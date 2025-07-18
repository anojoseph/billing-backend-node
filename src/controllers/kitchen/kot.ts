import fs from 'fs';
import net from 'net';
import { Order } from "../../models/orders/order";
import Product from "../../models/product/product";
import Kitchen from "../../models/kitchen/Kitchen";
import Table from "../../models/table/table";

const CONFIG_FILE = './printer-config.json';

function getPrinterConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return { kitchens: {} };
}

function sendToNetworkPrinter(ipPort: string, content: string): Promise<void> {
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

function formatDateTime() {
  const now = new Date();
  return now.toLocaleString('en-GB', { hour12: true });
}

async function printKitchenTickets(orderId: any) {
  const order = await Order.findById(orderId);
  if (!order) {
    console.error("Order not found.");
    return { printContent: '' };
  }

  const printerConfig = getPrinterConfig();

  const itemsByKitchen: Record<string, {
    kitchenId: string;
    kitchenName: string;
    items: {
      productName: string;
      quantity: number;
      addons?: { name: string; qty: number }[];
    }[];
  }> = {};

  for (const item of order.items) {
    const product = await Product.findById(item.id);
    if (!product) continue;

    const kitchenId = product.kitchen?.toString() || "Unknown";
    const kitchen = kitchenId !== "Unknown" ? await Kitchen.findById(kitchenId) : null;

    if (!itemsByKitchen[kitchenId]) {
      itemsByKitchen[kitchenId] = {
        kitchenId,
        kitchenName: kitchen?.name || "Unknown",
        items: [],
      };
    }

    // Group by product name + addons
    const existingItem = itemsByKitchen[kitchenId].items.find(i =>
      i.productName === product.name &&
      JSON.stringify(i.addons || []) === JSON.stringify(item.addons || [])
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      itemsByKitchen[kitchenId].items.push({
        productName: product.name,
        quantity: item.quantity,
        addons: item.addons || []
      });
    }
  }

  let allTickets = '';

  for (const [kitchenId, data] of Object.entries(itemsByKitchen)) {
    let tableName = '';
    if (order.orderType === 'Dine-in') {
      const table = await Table.findById(order.tableId);
      tableName = table ? table.name : "UnknownTable";
    } else if (order.orderType === 'Takeaway') {
      tableName = "Takeaway Order";
    }

    const printTime = formatDateTime();
    const billInfo = order.orderNumber ? `Order No: ${order.orderNumber}\n` : '';

    const itemsText = data.items.map(item => {
      let line = `${item.quantity} x ${item.productName}`;
      if (item.addons && item.addons.length > 0) {
        line += '\n' + item.addons.map(addon => `   → ${addon.qty} x ${addon.name}`).join('\n');
      }
      return line;
    }).join('\n');

    const ticket = `\n\n==== KOT for ${data.kitchenName} ====\nTime  : ${printTime}\n${billInfo}Table : ${tableName}\n\n${itemsText}\n\n==============================\n\n`;

    allTickets += ticket;

    const kitchenPrinterIp = printerConfig.kitchens?.[kitchenId];
    if (kitchenPrinterIp) {
      try {
        await sendToNetworkPrinter(kitchenPrinterIp, ticket);
        console.log(`✅ Printed KOT for ${data.kitchenName} to ${kitchenPrinterIp}`);
      } catch (err) {
        console.error(`❌ Failed to print to ${kitchenPrinterIp}`, err);
      }
    } else {
      console.warn(`⚠️ No printer assigned for kitchen ID: ${kitchenId}`);
    }
  }

  return { printContent: allTickets.trim() };
}

export { printKitchenTickets };
