import { Order } from "../../models/orders/order";
import Product from "../../models/product/product";
import Kitchen from "../../models/kitchen/Kitchen";
import Table from "../../models/table/table"
import Settings from "../../models/settings/setting";

const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");


async function printKitchenTickets(orderId: any) {
    // 1️⃣ Find the order first
    const order = await Order.findById(orderId);
    if (!order) {
        console.error("Order not found.");
        return { printContent: '' };
    }



    // Gather products by their respective kitchen
    const itemsByKitchen: Record<string, {
        kitchenId: string;
        kitchenName: string;
        items: { productName: string; quantity: number }[];
    }> = {};

    for (const item of order.items) {
        const product = await Product.findById(item.id);
        if (product) {
            // Find which kitchen contains this product
            const kitchen = await Kitchen.findOne({ items: product._id });

            let kitchenId = "Unknown";

            if (kitchen && kitchen._id) {
                kitchenId = kitchen._id.toString();
            }

            if (!itemsByKitchen[kitchenId]) {
                itemsByKitchen[kitchenId] = {
                    kitchenId,
                    kitchenName: kitchen ? kitchen.name : "Unknown",
                    items: [],
                };
            }

            itemsByKitchen[kitchenId].items.push({ productName: product.name, quantity: item.quantity });
        }
    }

    let allTickets = '';
    // Loop through each group and format KOT
    for (const [kitchenId, data] of Object.entries(itemsByKitchen)) {
        let tableName = '';
        if (order.orderType === 'Dine-in') {
            const table = await Table.findById(order.tableId);
            tableName = table ? table.name : "UnknownTable";
        } else if (order.orderType === 'Takeaway') {
            tableName = "Takeaway Order";
        }
        const printTime = formatDateTime();
        const ticket = `=== KOT for ${data.kitchenName} ===\nTime: ${printTime}\nTable: ${tableName}\n${data.items.map((item) => `${item.quantity} x ${item.productName}`).join('\n')}\n===============\n`;

        console.log(ticket);
        allTickets += ticket;

        const settings = await Settings.findOne();
        if (!settings) {
            console.error("Settings not configured.");
            return { printContent: allTickets.trim() };
        }

        const port = settings.printerPort;

        if (!port) {
            console.error("Printer port is not set in settings.");
            return { printContent: allTickets.trim() };
        }

    }

    return { printContent: allTickets.trim() };
}
function formatDateTime() {
    const now = new Date();
    return now.toLocaleString('en-GB', { hour12: true }); // For dd/MM/yyyy, hh:mm:ss AM/PM
}




export { printKitchenTickets };
