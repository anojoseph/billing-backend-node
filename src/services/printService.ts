import Settings from "../models/settings/setting";
import Product from '../models/product/product';
import fs from 'fs';
const CONFIG_FILE = './printer-config.json';
import net from 'net';
import escpos from 'escpos';

escpos.USB = require('escpos-usb'); // required for USB printing

function sendToUSBPrinter(printerName: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const device = new escpos.USB();
            const printer = new escpos.Printer(device);

            device.open((err: any) => {
                if (err) {
                    console.error('⚠️ Printer open failed:', err.message);
                    return resolve(); // Don't reject, just continue
                }

                printer
                    .text(content)
                    .cut()
                    .close();

                resolve();
            });
        } catch (e: any) {
            console.error('⚠️ Printer error:', e.message);
            resolve(); // Don't reject the promise
        }
    });
}


function sendToNetworkPrinter(ipPort: string, content: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
        const [host, portStr] = ipPort.split(':');
        const port = parseInt(portStr, 10) || 9100;

        const socket = new net.Socket();
        socket.connect(port, host, () => {
            socket.write(content, () => {
                socket.end();
                resolve();
            });
        });
        socket.on('error', reject);
    });
}


function getPrinterConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return null;
}
const config = getPrinterConfig();



export async function printOrder(order: any, bill?: any): Promise<string> {
    const settings = await Settings.findOne();
    if (!settings) throw new Error("Settings not configured.");

    const lineWidth = 40;
    const divider = "=".repeat(lineWidth);
    const lineDivider = "-".repeat(lineWidth);

    function centerAlign(text: string, width: number): string {
        if (text.length >= width) return text;
        const padSize = Math.floor((width - text.length) / 2);
        return ' '.repeat(padSize) + text;
    }

    let printContent = "";
    printContent += divider + "\n";
    printContent += centerAlign(settings.storeName, lineWidth) + "\n";
    printContent += divider + "\n";

    const dateStr = new Date().toLocaleString();
    printContent += bill
        ? `Bill No : ${bill.billNumber}\n`
        : `Order No: ${order.orderNumber}\n`;
    printContent += `Date    : ${dateStr}\n`;
    printContent += `Type    : ${order.orderType}\n`;

    // ✅ Add payment type (only if available)
    if (order.paymentType) {
        printContent += `Payment : ${order.paymentType}\n`;
    }

    printContent += lineDivider + "\n";

    printContent += "Item".padEnd(18) + " " +
        "Qty".padStart(3) + " " +
        "Price".padStart(6) + " " +
        "Total".padStart(7) + "\n";
    printContent += lineDivider + "\n";

    let addonTotalAmount = 0;

    for (const item of order.items) {
        const product = await Product.findById(item.id);
        let productName = product ? product.name : 'Unknown';
        if (productName.length > 18) {
            productName = productName.substring(0, 18);
        }

        const qtyStr = String(item.quantity).padStart(3, ' ');
        const priceStr = item.price.toFixed(2).padStart(6, ' ');
        const totalStr = item.totalPrice.toFixed(2).padStart(7, ' ');

        printContent += productName.padEnd(18) + " " + qtyStr + " " + priceStr + " " + totalStr + "\n";

        // Addons (if any)
        if (item.addons && Array.isArray(item.addons)) {
            for (const addon of item.addons) {
                const addonQtyStr = String(addon.qty).padStart(3, ' ');
                const addonPriceStr = addon.price.toFixed(2).padStart(6, ' ');
                const addonTotal = addon.qty * addon.price;
                const addonTotalStr = addonTotal.toFixed(2).padStart(7, ' ');
                addonTotalAmount += addonTotal;

                const addonLabel = ` ↳ ${addon.name}`;
                printContent += addonLabel.padEnd(18) + " " + addonQtyStr + " " + addonPriceStr + " " + addonTotalStr + "\n";
            }
        }
    }


    printContent += lineDivider + "\n";
    const grandTotal = order.totalAmount + addonTotalAmount;
    printContent += "Total:".padEnd(28) + grandTotal.toFixed(2).padStart(7, ' ') + "\n";
    printContent += divider + "\n";
    printContent += centerAlign("Thank You!", lineWidth) + "\n";
    printContent += divider + "\n";

    if (bill) {
        // Billing printer
        if (config?.billing) {
            sendToNetworkPrinter(config.billing, wrapWithEscPos(printContent));
            // USB Printer
        } else {
            console.log("No billing printer configured.");
        }
    }
    console.log(printContent)
    return printContent;
}

export async function printToken(order: any) {
    const lineWidth = 32;
    const divider = "=".repeat(lineWidth);

    let content = "";
    content += divider + "\n";
    content += "      TOKEN - " + order.orderType + "\n";
    content += divider + "\n";
    content += `Order No : ${order.orderNumber}\n`;
    content += `Time     : ${formatTimeToken()}\n`;
    content += divider + "\n";
    content += "Item                Qty\n";
    content += divider + "\n";

    for (const item of order.items) {
        const product = await Product.findById(item.id);
        const productName = product ? product.name : 'Unknown';
        const name = productName.length > 18 ? productName.substring(0, 18) : productName;
        content += name.padEnd(20) + String(item.quantity).padStart(3) + "\n";

        if (item.addons && item.addons.length > 0) {
            for (const addon of item.addons) {
                const addonName = `↳ ${addon.name}`;
                content += addonName.padEnd(20) + String(addon.qty).padStart(3) + "\n";
            }
        }
    }

    content += divider + "\n";
    content += " Please wait for your order\n";
    content += divider + "\n";

    // Print to token printer (USB or Network)
    if (config?.token) {
        await sendToNetworkPrinter(config.token, wrapWithEscPos(content));
        await testWiFiPrint()
        // USB printer
    } else {
        console.warn("⚠️ No token printer configured.");
    }

    console.log("🧾 Token Printed:\n", content);
    return content;
}

function formatTimeToken() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function wrapWithEscPos(text: string): Buffer {
    const ESC = '\x1B';
    const GS = '\x1D';
    const init = ESC + '@';
    const cut = GS + 'V' + '\x00';
    const lineSpacing = ESC + '3' + '\x18';
    const finalText = [
        init,
        lineSpacing,
        text,
        '\n\n\n\n',  // Space before cut
        cut
    ].join('');
    return Buffer.from(finalText, 'ascii');
}

export async function testWiFiPrint() {
  const testText = "✅ Wi-Fi Printer Connected\nTest print from Node.js\n\n";
  const buffer = wrapWithEscPos(testText);

  try {
    await sendToNetworkPrinter("192.168.1.111:9100", buffer);
    console.log("✅ Test print sent via Wi-Fi");
  } catch (err) {
    console.error("❌ Test print failed:");
  }
}
