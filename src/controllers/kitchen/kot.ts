import { Order } from "../../models/orders/order";
import Product from "../../models/product/product";
import Kitchen from "../../models/kitchen/Kitchen";
import Table from "../../models/table/table"
import Settings from "../../models/settings/setting";

const { SerialPort } = require("serialport");
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");

SerialPort.list().then((ports: any) => {
    console.log("Available Serial Ports:");
    console.log(ports);
});



async function isPortAvailable(portPath: any) {
    try {
        const ports = await SerialPort.list();
        return ports.some((port: any) =>
            port.path === portPath);
    } catch (error) {
        console.error("Error while retrieving port list.", error);
        return false;
    }
}
(async () => {
    const settings = await Settings.findOne();
    if (!settings) {
        console.error("Settings not configured.");
        return;
    }

    const port = settings?.printerPort;
    if (!port) {
        console.error("Printer port is not set in settings.");
        return;
    }
    //const port =  settings?.printerPort;

    if (await isPortAvailable(port)) {
        console.log(`Port ${port} is connected — printer might be connected.`);
    } else {
        console.log(`Port ${port} is not connected — printer might be disconnected.`);
    }
})();
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

        // Printing to printer (Optionally)
        if (await isPortAvailable(port)) {
            console.log("Port is available. Attempting to print.");

            try {
                let printer = new ThermalPrinter({
                    type: PrinterTypes.EPSON,
                    interface: port,
                    removeSpecialCharacters: false
                });

                printer.print(ticket);
                printer.cut();

                await printer.execute();

                console.log(`Printed KOT for ${data.kitchenName}.`);

            } catch (error) {
                console.error(`Error while printing KOT for ${data.kitchenName}.`, error);
            }
        } else {
            console.error(`Port ${port} not connected. Please check your connection.`);
        }
    }

    return { printContent: allTickets.trim() };
}
function formatDateTime() {
    const now = new Date();
    return now.toLocaleString('en-GB', { hour12: true }); // For dd/MM/yyyy, hh:mm:ss AM/PM
}




export { printKitchenTickets };
