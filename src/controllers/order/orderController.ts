import { Request, Response } from 'express';
import { Order } from '../../models/orders/order';
import Product from '../../models/product/product';
import Settings from '../../models/settings/setting';
import Bill from '../../models/bill/bill';
import mongoose from 'mongoose';
import { printOrder, printToken } from '../../services/printService';
import { printKitchenTickets } from "../kitchen/kot";

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    totalPrice?: number;
    addons?: Addon[];
}

interface Addon {
    name: string;
    qty: number;
    price: number;
}


export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { tableId, orderType, items, paymentType }: { tableId?: string; orderType: 'Dine-in' | 'Takeaway' | 'Bill'; items: OrderItem[], paymentType: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other'; } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const settings = await Settings.findOne();
        const stockUpdateNeeded = settings?.stockUpdate ?? false;

        let totalAmount = 0;
        const processedItems: { id: mongoose.Types.ObjectId; quantity: number; price: number; totalPrice: number; addons?: Addon[]; }[] = [];

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
                totalPrice,
                ...(item.addons ? { addons: item.addons } : {})
            });
        }

        // ✅ Validate paymentType only if completed order
        if ((orderType === 'Takeaway' || orderType === 'Bill') && !paymentType) {
            res.status(400).json({ message: 'Payment type is required for completed orders' });
            await session.abortTransaction();
            return;
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

                existingOrder.totalAmount += totalAmount

                await existingOrder.save({ session });

                await session.commitTransaction();
                res.status(200).json({
                    message: 'Order updated successfully',
                    order: existingOrder
                });
                return;
            }
        }
        const lastOrder = await Order.findOne().sort({ created_at: -1 });
        const nextOrderNumber = lastOrder?.orderNumber
            ? `ORD-${String(parseInt(lastOrder.orderNumber.split('-')[1]) + 1).padStart(4, '0')}`
            : 'ORD-0001';

        const newOrder = new Order({
            tableId: orderType === 'Dine-in' ? tableId : null,
            orderType,
            items: processedItems,
            totalAmount,
            status: orderType === 'Takeaway' || orderType === 'Bill' ? 'completed' : 'pending',
            orderNumber: nextOrderNumber,
            paymentType: orderType === 'Dine-in' ? undefined : paymentType,
        });

        await newOrder.save({ session });



        let printContent = '';
        // If the order type is 'Takeaway' or 'Bill', create a corresponding bill
        if (orderType === 'Takeaway' || orderType === 'Bill') {
            const newBill = new Bill({
                orderId: newOrder._id,
                tableId: newOrder.tableId,
                items: newOrder.items,
                totalAmount: newOrder.totalAmount,
                type: orderType,
                orderNumber: nextOrderNumber,
                paymentType
                // Add other fields as necessary
            });


            await newBill.save({ session });
            printContent = await printOrder(newOrder as any, newBill);
            await printToken(newOrder);
            await printKitchenTickets(newOrder._id); 
            // Optionally, print the order
            // await printOrder(newOrder as any);
        }

        await session.commitTransaction();
        if (orderType === 'Takeaway' || orderType === 'Bill') {
            res.status(201).json({
                message: 'Order created successfully',
                order: newOrder,
                ...(printContent && { printContent })
            });

        }
        else {
            res.status(201).json({
                message: 'Order created successfully',
                order: newOrder,
            });
        }


        //await printKitchenTickets(newOrder._id); //printing order

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
        const { paymentType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ message: 'Invalid order ID format' });
            return;
        }

        const order = await Order.findById(orderId).session(session);

        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        // ✅ Set orderNumber if not already
        if (!order.orderNumber) {
            const lastOrder = await Order.findOne().sort({ created_at: -1 });
            const nextOrderNumber = lastOrder?.orderNumber
                ? `ORD-${String(parseInt(lastOrder.orderNumber.split('-')[1]) + 1).padStart(4, '0')}`
                : 'ORD-0001';
            order.orderNumber = nextOrderNumber;
        }

        // ✅ Set payment type
        if (paymentType) {
            order.paymentType = paymentType;
        }

        // ✅ Mark as completed
        order.status = 'completed';
        await order.save({ session });

        // ✅ Create a bill
        const newBill = new Bill({
            orderId: order._id,
            tableId: order.tableId,
            items: order.items,
            totalAmount: order.totalAmount,
            type: order.orderType,
            orderNumber: order.orderNumber,
            paymentType: order.paymentType // optional
        });

        await newBill.save({ session });

        const printContent = await printOrder(order as any, newBill);

        await session.commitTransaction();

        res.status(200).json({
            message: 'Order marked as completed and bill created',
            bill: newBill,
            printContent
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error completing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        session.endSession();
    }
};


export const updateBillAndOrder = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const settings = await Settings.findOne();
    const stockUpdateNeeded = settings?.stockUpdate ?? false;

    try {
        const { billNumber, items, paymentType }: {
            billNumber: string;
            items: Array<{ id: string; quantity: number; price: number; addons?: Array<{ name: string; qty: number; price: number }> }>;
            paymentType?: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other';
        } = req.body;

        const bill = await Bill.findOne({ billNumber }).session(session);
        if (!bill) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Bill not found" });
        }

        const order = await Order.findById(bill.orderId).session(session);
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Order not found" });
        }

        let totalAmount = 0;
        const updatedItems = [];

        for (const item of items) {
            const { id, quantity, price } = item;

            const product = await Product.findById(id).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ message: `Product with id ${id} not found` });
            }

            if (stockUpdateNeeded) {
                if (quantity > product.qty) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: `Not enough stock for ${product.name}` });
                }
                product.qty -= quantity;
            }

            await product.save({ session });

            const totalPrice = quantity * price;
            totalAmount += totalPrice;

            updatedItems.push({
                id: new mongoose.Types.ObjectId(id),
                quantity,
                price,
                totalPrice,
                addons: item.addons ?? []
            });
        }

        // ✅ Update Order
        order.items = updatedItems as any;
        order.totalAmount = totalAmount;

        if (paymentType) {
            order.paymentType = paymentType;
        }

        await order.save({ session });

        // ✅ Update Bill
        bill.items = updatedItems as any;
        bill.totalAmount = totalAmount;

        if (paymentType) {
            bill.paymentType = paymentType;
        }

        await bill.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: "Bill and Order updated successfully", bill });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error updating bill/order:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};


export const getBillByNumber = async (req: Request, res: Response) => {
    try {
        const { billNumber } = req.params;

        const bill = await Bill.findOne({ billNumber, deleted_at: null }).populate("orderId");

        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        res.status(200).json({ bill });
    } catch (error) {
        console.error("Error fetching bill:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteBillAndOrder = async (req: any, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { billNumber } = req.params;
        let deletedBy: string | null = req.user?.id || null;

        // Validate deletedBy
        if (deletedBy && !mongoose.Types.ObjectId.isValid(deletedBy)) {
            console.warn("Invalid deletedBy value received:", deletedBy);
            deletedBy = null; // Prevent MongoDB CastError
        } else if (deletedBy) {
            deletedBy = new mongoose.Types.ObjectId(deletedBy).toString(); // Convert to string
        }

        const bill = await Bill.findOne({ billNumber, deleted_at: null }).session(session);
        if (!bill) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Bill not found or already deleted" });
        }

        const order = await Order.findById(bill.orderId).session(session);
        if (!order || order.deleted_at) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Order not found or already deleted" });
        }

        // Restore stock if needed
        const settings = await Settings.findOne();
        const stockUpdateNeeded = settings?.stockUpdate ?? false;

        if (stockUpdateNeeded) {
            for (const item of bill.items) {
                const product = await Product.findById(item.id).session(session);
                if (product) {
                    product.qty += item.quantity; // Restore stock
                    await product.save({ session });
                }
            }
        }

        // Soft delete bill and order
        await Order.findByIdAndUpdate(order._id, { deleted_at: new Date(), deleted_by: deletedBy }, { session });
        await Bill.findByIdAndUpdate(bill._id, { deleted_at: new Date(), deleted_by: deletedBy }, { session });

        await session.commitTransaction();
        res.status(200).json({ message: "Bill and Order soft deleted successfully" });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error deleting bill/order:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

