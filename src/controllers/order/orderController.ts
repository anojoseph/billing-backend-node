import { Request, Response } from 'express';
import { Order } from '../../models/orders/order';
import Product from '../../models/product/product';
import Settings from '../../models/settings/setting';
import Bill from '../../models/bill/bill';
import mongoose from 'mongoose';
import { printOrder } from '../../services/printService';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    totalPrice?: number;
}


export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { tableId, orderType, items }: { tableId?: string; orderType: 'Dine-in' | 'Takeaway' | 'Bill'; items: OrderItem[] } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const settings = await Settings.findOne();
        const stockUpdateNeeded = settings?.stockUpdate ?? false;

        let totalAmount = 0;
        const processedItems: { id: mongoose.Types.ObjectId; quantity: number; price: number; totalPrice: number }[] = [];

        for (const item of items) {
            const { id, quantity, price } = item;

            const product = await Product.findById(id).session(session);
            if (!product) {
                res.status(404).json({ message: `Product with id ${id} not found` });
                await session.abortTransaction();
                return;
            }

            if (stockUpdateNeeded && product.qty < quantity) {
                res.status(400).json({ message: `Not enough stock for ${product.name}` });
                await session.abortTransaction();
                return;
            }

            if (stockUpdateNeeded) {
                product.qty -= quantity;
                await product.save({ session });
            }

            const totalPrice = price * quantity;
            totalAmount += totalPrice;

            processedItems.push({
                id: new mongoose.Types.ObjectId(id),
                quantity,
                price,
                totalPrice
            });
        }

        if (orderType === 'Dine-in' && tableId) {
            const existingOrder = await Order.findOne({ tableId, status: 'pending' }).session(session);

            if (existingOrder) {
                processedItems.forEach(item => {
                    const existingItem = existingOrder.items.find(i => i.id.equals(item.id));
                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                        existingItem.totalPrice += item.totalPrice;
                    } else {
                        existingOrder.items.push(item);
                    }
                });

                existingOrder.totalAmount += totalAmount;
                await existingOrder.save({ session });

                await session.commitTransaction();
                res.status(200).json({
                    message: 'Order updated successfully',
                    order: existingOrder
                });
                return;
            }
        }

        const newOrder = new Order({
            tableId: orderType === 'Dine-in' ? tableId : null,
            orderType,
            items: processedItems,
            totalAmount,
        });

        await newOrder.save({ session });

        // If the order type is 'Takeaway' or 'Bill', create a corresponding bill
        if (orderType === 'Takeaway' || orderType === 'Bill') {
            const newBill = new Bill({
                orderId: newOrder._id,
                tableId: newOrder.tableId,
                items: newOrder.items,
                totalAmount: newOrder.totalAmount,
                type:orderType,
                // Add other fields as necessary
            });

            await newBill.save({ session });

            // Optionally, print the order
            await printOrder(newOrder as any);
        }

        await session.commitTransaction();
        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ message: 'Error creating order' });
    } finally {
        session.endSession();
    }
};



export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching order' });
    }
};


export const updateOrder = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { items, status } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        // Update order items or status
        if (items) order.items = items;
        if (status) order.status = status;

        await order.save();

        res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order' });
    }
};

export const completeOrder = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ message: 'Invalid order ID format' });
            return;
        }

        const order = await Order.findById(orderId).session(session);

        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        // Update order status to 'completed'
        order.status = 'completed';
        await order.save({ session });

        // Create a new bill based on the completed order
        const newBill = new Bill({
            orderId: order._id,
            tableId: order.tableId,
            items: order.items,
            totalAmount: order.totalAmount,
            type: order.orderType,
            // Add other fields as necessary
        });

        await newBill.save({ session });

        await session.commitTransaction();
        await printOrder(order as any);
        res.status(200).json({ message: 'Order marked as completed and bill created', bill: newBill });
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error completing order:', error);

        if (error.name === 'CastError') {
            res.status(400).json({ message: 'Invalid order ID' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    } finally {
        session.endSession();
    }
};

