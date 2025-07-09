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


function sendToNetworkPrinter(ip: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.connect(9100, ip, () => {
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
    }

    printContent += lineDivider + "\n";
    printContent += "Total:".padEnd(28) + order.totalAmount.toFixed(2).padStart(7, ' ') + "\n";
    printContent += divider + "\n";
    printContent += centerAlign("Thank You!", lineWidth) + "\n";
    printContent += divider + "\n";

    if (bill) {
        // Billing printer
        if (config?.billing) {
            sendToUSBPrinter(config.billing, printContent); // USB Printer
        } else {
            console.log("No billing printer configured.");
        }
    }
    console.log(printContent)
    return printContent;
}

