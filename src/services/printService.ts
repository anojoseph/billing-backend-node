import Settings from "../models/settings/setting";
import Product from '../models/product/product';
import fs from 'fs';
const CONFIG_FILE = './printer-config.json';
import escpos from 'escpos';
import PrintJob from '../models/settings/printJob';
escpos.USB = require('escpos-usb'); // required for USB printing



function getPrinterConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return null;
}
const config = getPrinterConfig();




// export async function printOrder(order: any, bill?: any): Promise<string> {
//     const settings = await Settings.findOne();
//     if (!settings) throw new Error("Settings not configured.");

//     const ESC = '\x1B';
//     const BOLD_ON = ESC + 'E' + '\x01';
//     const BOLD_OFF = ESC + 'E' + '\x00';

//     const lineWidth = 48;
//     const divider = "-".repeat(lineWidth);

//     function centerAlign(text: string, width: number): string {
//         if (text.length >= width) return text;
//         const padSize = Math.floor((width - text.length) / 2);
//         return ' '.repeat(padSize) + text + ' '.repeat(width - text.length - padSize);
//     }

//     function rightAlign(text: string, width: number): string {
//         return text.padStart(width);
//     }

//     let printContent = "\n";

//     // Header - GST Left, WhatsApp Right
//     const gstText = `GSTIN: ${settings.gstNumber || ''}`;
//     const whatsappText = settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : '';
//     printContent += BOLD_ON + gstText + rightAlign(whatsappText, lineWidth - gstText.length) + BOLD_OFF + "\n\n";

//     printContent += BOLD_ON + centerAlign(settings.storeName, lineWidth) + BOLD_OFF + "\n\n";
//     // printContent += BOLD_ON + centerAlign(settings.storeName.toUpperCase(), lineWidth) + BOLD_OFF + "\n\n";
//     if (settings.storeAddress) printContent += centerAlign(settings.storeAddress, lineWidth) + "\n";
//     if (settings.storeContact) printContent += centerAlign(`PH: ${settings.storeContact}`, lineWidth) + "\n";
//     if (settings.fssai_available && settings.fssai_number)
//         printContent += centerAlign(`FSSAI: ${settings.fssai_number}`, lineWidth) + "\n";

//     printContent += divider + "\n";

//     const now = new Date();
//     const date = now.toLocaleDateString('en-GB');
//     const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

//     printContent += `Bill #: ${bill?.billNumber || order.orderNumber}`.padEnd(24) + `Date: ${date}\n`;
//     printContent += `Type  : ${order.orderType}`.padEnd(24) + `Time: ${time}\n`;
//     printContent += `Payment: ${order.paymentType}\n`;

//     printContent += divider + "\n";

//     // Item Header
//     printContent += BOLD_ON + "# Product".padEnd(20) + "Qty".padStart(5) + "Rate".padStart(8) + "Total".padStart(9) + BOLD_OFF + "\n";
//     printContent += divider + "\n";

//     let itemIndex = 1;
//     let subTotal = 0;

//     if (order.items && Array.isArray(order.items)) {
//         for (const item of order.items) {
//             const product = await Product.findById(item.id);
//             const name = ((product?.name || 'Unknown').substring(0, 18)).trim();
//             const qty = item.quantity.toFixed(1).padStart(5);
//             const rate = item.price.toFixed(2).padStart(8);
//             const total = item.totalPrice.toFixed(2).padStart(9);
//             subTotal += item.totalPrice;

//             printContent += `${itemIndex} ${name}`.padEnd(20) + qty + rate + total + "\n";
//             itemIndex++;

//             // Addons
//             if (item.addons && item.addons.length > 0) {
//                 for (const addon of item.addons) {
//                     const addonName = `+ ${addon.name}`.substring(0, 18).trim();
//                     const addonQty = addon.qty.toFixed(1).padStart(5);
//                     const addonRate = addon.price.toFixed(2).padStart(8);
//                     const addonTotal = (addon.qty * addon.price).toFixed(2).padStart(9);
//                     subTotal += addon.qty * addon.price;

//                     printContent += `  ${addonName}`.padEnd(20) + addonQty + addonRate + addonTotal + "\n";
//                 }
//             }
//         }
//     }

//     // Totals
//     const sgst = parseFloat(settings.sgst || '0');
//     const cgst = parseFloat(settings.cgst || '0');
//     const sgstAmount = subTotal * (sgst / 100);
//     const cgstAmount = subTotal * (cgst / 100);
//     const taxTotal = sgstAmount + cgstAmount;
//     const grandTotal = subTotal + taxTotal;
//     const roundOff = Math.round(grandTotal) - grandTotal;
//     const finalTotal = Math.round(grandTotal);

//     printContent += divider + "\n";
//     printContent += "SUB TOTAL:".padEnd(30) + subTotal.toFixed(2).padStart(12) + "\n";
//     if (sgst > 0) printContent += `SGST ${sgst}%:`.padEnd(30) + sgstAmount.toFixed(2).padStart(12) + "\n";
//     if (cgst > 0) printContent += `CGST ${cgst}%:`.padEnd(30) + cgstAmount.toFixed(2).padStart(12) + "\n";

//     printContent += divider + "\n";
//     printContent += BOLD_ON + "GRAND TOTAL:".padEnd(30) + grandTotal.toFixed(2).padStart(12) + BOLD_OFF + "\n";
//     printContent += "ROUND OFF".padEnd(30) + roundOff.toFixed(2).padStart(12) + "\n";
//     printContent += divider + "\n";
//     printContent += BOLD_ON + "TOTAL:".padEnd(30) + finalTotal.toFixed(2).padStart(12) + BOLD_OFF + "\n\n";

//     // Words
//     printContent += `Rupees ${numberToWords(finalTotal)} Only\n\n`;

//     // Payment Type
//     if (order.paymentType === 'CASH') {
//         printContent += `Cash Received   : ${finalTotal.toFixed(2)}\n`;
//         printContent += `Balance Payable : 0.00\n`;
//     } else if (order.paymentType === 'CARD') {
//         printContent += `Card Received   : ${finalTotal.toFixed(2)}\n`;
//     }

//     // Footer
//     printContent += divider + "\n";
//     printContent += centerAlign('"If you are satisfied tell others,', lineWidth) + "\n";
//     printContent += centerAlign('If not tell us!"', lineWidth) + "\n\n";

//     // Print Job Queue
//     if (bill && settings?.auto_print_bill) {
//         await PrintJob.create({
//             content: wrapWithEscPos(printContent),
//             type: 'bill',
//             status: 'pending'
//         });
//     }

//     console.log(printContent);
//     return printContent;
// }



// Number to Words Conversion Function

export async function printOrder(order: any, bill?: any): Promise<string> {
    const settings = await Settings.findOne();
    if (!settings) throw new Error("Settings not configured.");

    const ESC = '\x1B';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const lineWidth = 48;
    const divider = "-".repeat(lineWidth);

    function centerAlign(text: string, width: number): string {
        if (text.length >= width) return text;
        const padSize = Math.floor((width - text.length) / 2);
        return ' '.repeat(padSize) + text + ' '.repeat(width - text.length - padSize);
    }

    function rightAlign(text: string, width: number): string {
        return text.padStart(width);
    }

    let printContent = "\n";

    // Header
    const gstText = `GSTIN: ${settings.gstNumber || ''}`;
    const whatsappText = settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : '';
    printContent += BOLD_ON + gstText + rightAlign(whatsappText, lineWidth - gstText.length) + BOLD_OFF + "\n\n";

    printContent += BOLD_ON + centerAlign(settings.storeName, lineWidth) + BOLD_OFF + "\n\n";
    if (settings.storeAddress) printContent += centerAlign(settings.storeAddress, lineWidth) + "\n";
    if (settings.storeContact) printContent += centerAlign(`PH: ${settings.storeContact}`, lineWidth) + "\n";
    if (settings.fssai_available && settings.fssai_number)
        printContent += centerAlign(`FSSAI: ${settings.fssai_number}`, lineWidth) + "\n";

    printContent += divider + "\n";

    // Date/Time
    const now = new Date();
    const date = now.toLocaleDateString('en-GB');
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    printContent += `Bill #: ${bill?.billNumber || order.orderNumber}`.padEnd(24) + `Date: ${date}\n`;
    printContent += `Type  : ${order.orderType}`.padEnd(24) + `Time: ${time}\n`;
    printContent += `Payment: ${order.paymentType || bill?.paymentType || '-'}` + "\n";

    printContent += divider + "\n";

    // Item Header
    printContent += BOLD_ON + "# Product".padEnd(20) + "Qty".padStart(5) + "Rate".padStart(8) + "Total".padStart(9) + BOLD_OFF + "\n";
    printContent += divider + "\n";

    // Items
    let itemIndex = 1;
    let subTotal = 0;

    if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
            const product = await Product.findById(item.id);
            const name = ((product?.name || 'Unknown').substring(0, 18)).trim();
            const qty = item.quantity.toFixed(1).padStart(5);
            const rate = item.price.toFixed(2).padStart(8);
            const itemTotal = item.price * item.quantity;
            const total = itemTotal.toFixed(2).padStart(9);
            subTotal += itemTotal;

            printContent += `${itemIndex} ${name}`.padEnd(20) + qty + rate + total + "\n";
            itemIndex++;

            if (item.addons && item.addons.length > 0) {
                for (const addon of item.addons) {
                    const addonQtyValue = addon.qty || 1;
                    const addonName = `+ ${addon.name}`.substring(0, 18).trim();
                    const addonQty = addonQtyValue.toFixed(1).padStart(5);
                    const addonRate = addon.price.toFixed(2).padStart(8);
                    const addonTotalValue = addonQtyValue * addon.price;
                    const addonTotal = addonTotalValue.toFixed(2).padStart(9);
                    subTotal += addonTotalValue;

                    printContent += `  ${addonName}`.padEnd(20) + addonQty + addonRate + addonTotal + "\n";
                }
            }
        }
    }

    printContent += divider + "\n";

    // Use bill values if available
    const discountType = bill?.discountType || order?.discountType || 'none';
    const discountValue = parseFloat(bill?.discountValue || order?.discountValue || 0);
    const discountAmount = bill?.discountAmount || 0;
    const discountedTotal = subTotal - discountAmount;

    let sgstAmount = 0, cgstAmount = 0, taxTotal = 0;
    if (settings.tax_status) {
        sgstAmount = (bill?.sgstAmount !== undefined) ? bill.sgstAmount : (parseFloat(settings.sgst || '0') / 100) * discountedTotal;
        cgstAmount = (bill?.cgstAmount !== undefined) ? bill.cgstAmount : (parseFloat(settings.cgst || '0') / 100) * discountedTotal;
        taxTotal = sgstAmount + cgstAmount;
    }

    const grandTotal = bill?.grandTotal || discountedTotal + taxTotal;
    const roundOff = Math.round(grandTotal) - grandTotal;
    const finalTotal = Math.round(grandTotal);

    // Totals
    printContent += "SUB TOTAL:".padEnd(30) + subTotal.toFixed(2).padStart(12) + "\n";

    if (discountAmount > 0) {
        if (discountType === 'percentage') {
            printContent += `DISCOUNT (${discountValue}%):`.padEnd(30) + discountAmount.toFixed(2).padStart(12) + "\n";
        } else {
            printContent += `DISCOUNT:`.padEnd(30) + discountAmount.toFixed(2).padStart(12) + "\n";
        }
        printContent += "AFTER DISCOUNT:".padEnd(30) + discountedTotal.toFixed(2).padStart(12) + "\n";
    }

    if (settings.tax_status) {
        if (sgstAmount > 0) printContent += `SGST:`.padEnd(30) + sgstAmount.toFixed(2).padStart(12) + "\n";
        if (cgstAmount > 0) printContent += `CGST:`.padEnd(30) + cgstAmount.toFixed(2).padStart(12) + "\n";
    }

    printContent += divider + "\n";
    printContent += BOLD_ON + "GRAND TOTAL:".padEnd(30) + grandTotal.toFixed(2).padStart(12) + BOLD_OFF + "\n";
    printContent += "ROUND OFF".padEnd(30) + roundOff.toFixed(2).padStart(12) + "\n";
    printContent += divider + "\n";
    printContent += BOLD_ON + "TOTAL:".padEnd(30) + finalTotal.toFixed(2).padStart(12) + BOLD_OFF + "\n\n";

    // Amount in Words
    printContent += `Rupees ${numberToWords(finalTotal)} Only\n\n`;

    // Payment
    if (order.paymentType === 'CASH') {
        printContent += `Cash Received   : ${finalTotal.toFixed(2)}\n`;
        printContent += `Balance Payable : 0.00\n`;
    } else if (order.paymentType === 'CARD') {
        printContent += `Card Received   : ${finalTotal.toFixed(2)}\n`;
    }

    // Footer
    printContent += divider + "\n";
    printContent += centerAlign('"If you are satisfied tell others,', lineWidth) + "\n";
    printContent += centerAlign('If not tell us!"', lineWidth) + "\n\n";

    // Print Job
    if (bill && settings?.auto_print_bill) {
        await PrintJob.create({
            content: wrapWithEscPos(printContent),
            type: 'bill',
            status: 'pending'
        });
    }

    console.log(printContent)
    return printContent;
}



function numberToWords(num: number): string {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatTenth = (digit: number, prev: number) => {
        return 0 == digit ? '' : ' ' + (1 == digit ? double[prev] : tens[digit]);
    };
    const formatOther = (digit: number, next: string, denom: string) => {
        return (0 != digit && 1 != digit ? ' ' + single[digit] + ' ' + denom + ' ' + next : ' ' + single[digit] + ' ' + denom + next).trim();
    };

    let str = '';
    let rupees = Math.floor(num);
    let paise = Math.round((num - rupees) * 100);

    if (rupees > 0) {
        str += single[Math.floor(rupees / 10000000)] ? formatOther(Math.floor(rupees / 10000000), '', 'Crore') : '';
        rupees %= 10000000;
        str += single[Math.floor(rupees / 100000)] ? formatOther(Math.floor(rupees / 100000), '', 'Lakh') : '';
        rupees %= 100000;
        str += single[Math.floor(rupees / 1000)] ? formatOther(Math.floor(rupees / 1000), '', 'Thousand') : '';
        rupees %= 1000;
        str += single[Math.floor(rupees / 100)] ? formatOther(Math.floor(rupees / 100), '', 'Hundred') : '';
        str += formatTenth(Math.floor((rupees % 100) / 10), rupees % 10);
        str += 0 != rupees % 10 && Math.floor(rupees / 10) != 1 ? ' ' + single[rupees % 10] : '';
    } else {
        str += 'Zero';
    }

    if (paise > 0) {
        str += ' and ';
        str += formatTenth(Math.floor(paise / 10), paise % 10);
        str += 0 != paise % 10 && Math.floor(paise / 10) != 1 ? ' ' + single[paise % 10] : '';
        str += ' Paise';
    }

    return str.trim();
}


export async function printToken(order: any) {

    const settings = await Settings.findOne();
    if (!settings) throw new Error("Settings not configured.");

    if (settings.auto_print_token) {

        const lineWidth = 48;
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
                    const addonName = `> ${addon.name}`;
                    content += addonName.padEnd(20) + String(addon.qty).padStart(3) + "\n";
                }
            }
        }

        content += divider + "\n";
        content += " Please wait for your order\n";
        content += divider + "\n";

        // Print to token printer (USB or Network)
        if (config?.token) {
            //await sendToNetworkPrinter(config.token, wrapWithEscPos(content));
            await PrintJob.create({
                content: wrapWithEscPos(content),
                type: 'token',
                status: 'pending'
            });
        } else {
            console.warn("⚠️ No token printer configured.");
        }
        return content;
    }
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
