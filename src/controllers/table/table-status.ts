import { Request, Response } from 'express';
import TableModel from '../../models/table/table'; // Ensure this path is correct
import { Order } from '../../models/orders/order';

export const getTableStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const tables = await TableModel.find({ deleted_at: null });

        const orders = await Order.find({ status: 'pending' }).populate('tableId');

        const tableStatuses = tables.map(table => {
            const ongoingOrders = orders.filter(order => order.tableId && order.tableId._id.toString() === table._id.toString());
            const currentBill = ongoingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const orderIds = ongoingOrders.map(order => order._id);

            return {
                tableId: table._id,
                tableNumber: table.no,
                status: ongoingOrders.length > 0 ? 'occupied' : 'free',
                currentBill: currentBill > 0 ? currentBill : null,
                orderIds: orderIds.length > 0 ? orderIds : null,
                tableName: table.name,
            };
        });

        res.status(200).json({ tables: tableStatuses });
    } catch (error) {
        console.error('Error fetching table statuses:', error);
        res.status(500).json({ message: 'Error fetching table statuses' });
    }
};

