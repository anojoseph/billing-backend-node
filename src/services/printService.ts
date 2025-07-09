import Settings from "../models/settings/setting";
import Product from '../models/product/product';

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

    console.log(printContent)
    return printContent;
}

