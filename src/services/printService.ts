import printer from '../config/printerConfig';

interface OrderItem {
    name: string;
    quantity: number;
    totalPrice: number;
}

interface Order {
    items: OrderItem[];
    totalAmount: number;
}

export const printOrder = async (order: Order): Promise<void> => {
    try {
        printer.alignCenter();
        printer.println('Order Receipt');
        printer.drawLine();

        order.items.forEach((item) => {
            printer.println(`${item.name} x${item.quantity} - $${item.totalPrice.toFixed(2)}`);
        });

        printer.drawLine();
        printer.println(`Total: $${order.totalAmount.toFixed(2)}`);
        printer.cut();

        await printer.execute();
        console.log('Print job executed, output written to file.');
    } catch (error) {
        console.error('Error during printing:', error);
    }
};
