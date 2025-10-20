import { Request, Response } from 'express';
import { Order } from '../../models/orders/order';
import Product from '../../models/product/product';
import Settings from '../../models/settings/setting';
import Bill from '../../models/bill/bill';
import mongoose from 'mongoose';
import { printOrder, printToken } from '../../services/printService';
import { printKitchenTickets } from "../kitchen/kot";
import OrderHistory from "../../models/orders/OrderHistory";

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
    const {
        tableId,
        orderType,
        items,
        paymentType,
        discountType,
        discountValue
    }: {
        tableId?: string;
        orderType: 'Dine-in' | 'Takeaway' | 'Bill';
        items: OrderItem[],
        paymentType: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other';
        discountType?: 'percentage' | 'amount';
        discountValue?: number;
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const settings = await Settings.findOne();
        const stockUpdateNeeded = settings?.stockUpdate ?? false;

        let subTotal = 0;
        const processedItems: { id: mongoose.Types.ObjectId; quantity: number; price: number; totalPrice: number; addons?: Addon[]; }[] = [];
        //const processedItems: any[] = [];
        for (const item of items) {
            const { id, quantity, price, addons } = item;

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

            let itemTotal = price * quantity;

            if (addons && Array.isArray(addons)) {
                for (const addon of addons) {
                    itemTotal += addon.price * addon.qty;
                }
            }

            subTotal += itemTotal;

            processedItems.push({
                id: new mongoose.Types.ObjectId(id),
                quantity,
                price,
                totalPrice: itemTotal,
                ...(addons ? { addons } : {})
            });
        }


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

                existingOrder.totalAmount += subTotal;
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

        // Calculate discount and grand total
        let discountAmt = 0;
        if (discountType && discountValue) {
            discountAmt = discountType === 'percentage'
                ? (discountValue / 100) * subTotal
                : discountValue;
            discountAmt = Math.min(discountAmt, subTotal);
        }
        const discountedTotal = subTotal - discountAmt;

        let sgstAmount = 0, cgstAmount = 0, igstAmount = 0, taxTotal = 0;

        if (settings?.tax_status) {
            const sgst = parseFloat(settings?.sgst || '0');
            const cgst = parseFloat(settings?.cgst || '0');
            const igst = parseFloat(settings?.igst || '0');

            if (igst > 0) {
                igstAmount = discountedTotal * (igst / 100);
            } else {
                sgstAmount = discountedTotal * (sgst / 100);
                cgstAmount = discountedTotal * (cgst / 100);
            }

            taxTotal = sgstAmount + cgstAmount + igstAmount;
        }

        const grandTotal = discountedTotal + taxTotal;

        const newOrder = new Order({

            tableId: orderType === 'Dine-in' ? tableId : null,
            orderType,
            items: processedItems,
            totalAmount: subTotal,
            status: orderType === 'Takeaway' || orderType === 'Bill' ? 'completed' : 'pending',
            orderNumber: nextOrderNumber,
            paymentType: orderType === 'Dine-in' ? undefined : paymentType,
            discountType: discountType || null,
            discountValue: discountValue || 0,
            discountAmount: discountAmt,
            sgst: sgstAmount,
            cgst: cgstAmount,
            igst: igstAmount,
            taxAmount: taxTotal,
            grandTotal: Math.round(grandTotal)
        });
        await newOrder.save({ session });

        let printContent = '';

        if (orderType === 'Takeaway' || orderType === 'Bill') {
            const roundoffTotal = Math.round(grandTotal);
            const newBill = new Bill({
                orderId: newOrder._id,
                tableId: newOrder.tableId,
                items: newOrder.items,
                totalAmount: subTotal,
                discountType: discountType || null,
                discountValue: discountValue || 0,
                discountAmount: discountAmt,
                sgst: sgstAmount,
                cgst: cgstAmount,
                igst: igstAmount,
                taxAmount: taxTotal,
                grandTotal: roundoffTotal,
                type: orderType,
                orderNumber: nextOrderNumber,
                paymentType
            });



            await newBill.save({ session });
            printContent = await printOrder(newOrder as any, newBill);
            await printToken(newOrder);
            await printKitchenTickets(newOrder._id);
        }

        await session.commitTransaction();

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder,
            ...(printContent && { printContent })
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
        const {
            paymentType,
            discountType,
            discountValue
        }: {
            paymentType?: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other';
            discountType?: 'percentage' | 'amount';
            discountValue?: number;
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ message: 'Invalid order ID format' });
            return;
        }

        const order = await Order.findById(orderId).session(session);

        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        const settings = await Settings.findOne();
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

        // ✅ Compute discount
        const subTotal = order.totalAmount;
        let discountAmt = 0;
        if (discountType && discountValue) {
            discountAmt = discountType === 'percentage'
                ? (discountValue / 100) * subTotal
                : discountValue;

            discountAmt = Math.min(discountAmt, subTotal);
        }

        const discountedTotal = subTotal - discountAmt;

        let sgstAmount = 0;
        let cgstAmount = 0;
        let taxTotal = 0;

        if (settings?.tax_status) {
            const sgst = parseFloat(settings.sgst || '0');
            const cgst = parseFloat(settings.cgst || '0');
            sgstAmount = discountedTotal * (sgst / 100);
            cgstAmount = discountedTotal * (cgst / 100);
            taxTotal = sgstAmount + cgstAmount;
        }

        const grandTotal = discountedTotal + taxTotal;

        order.discountType = discountType;
        order.discountValue = discountValue || 0;
        order.discountAmount = discountAmt;
        order.status = 'completed';
        await order.save({ session });

        // ✅ Create bill
        const newBill = new Bill({
            orderId: order._id,
            tableId: order.tableId,
            items: order.items,
            totalAmount: subTotal,
            discountType: order.discountType,
            discountValue: order.discountValue,
            discountAmount: discountAmt,
            taxAmount: taxTotal,
            grandTotal,
            type: order.orderType,
            orderNumber: order.orderNumber,
            paymentType: order.paymentType
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

    try {
        const settings = await Settings.findOne().session(session);
        const stockUpdateNeeded = settings?.stockUpdate ?? false;

        const {
            billNumber,
            items,
            paymentType,
            discountType,
            discountValue
        }: {
            billNumber: string;
            items: Array<{
                id: string;
                quantity: number;
                price: number;
                addons?: Array<{ name: string; qty: number; price: number }>;
            }>;
            paymentType?: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other';
            discountType?: 'percentage' | 'amount';
            discountValue?: number;
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

        // Capture previous data for history
        const previousBillData = bill.toObject();
        const previousOrderData = order.toObject();

        let totalAmount = 0;
        const updatedItems = [];

        for (const item of items) {
            const { id, quantity, price } = item;
            const product = await Product.findById(id).session(session);

            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ message: `Product with id ${id} not found` });
            }

            const availableQty = product.qty ?? 0;
            if (stockUpdateNeeded && quantity > availableQty) {
                await session.abortTransaction();
                return res.status(400).json({ message: `Not enough stock for ${product.name}` });
            }

            if (stockUpdateNeeded) {
                product.qty = availableQty - quantity;
                await product.save({ session });
            }

            const addons = Array.isArray(item.addons) ? item.addons : [];
            const totalPrice = quantity * price + addons.reduce((sum, a) => sum + a.qty * a.price, 0);
            totalAmount += totalPrice;

            updatedItems.push({
                id: new mongoose.Types.ObjectId(id),
                quantity,
                price,
                totalPrice,
                addons
            });
        }

        // Compute discount
        let discountAmount = 0;
        const discountValNum = Number(discountValue) || 0;
        if (discountType && !isNaN(discountValNum)) {
            discountAmount = discountType === 'percentage' ? (discountValNum / 100) * totalAmount : discountValNum;
            discountAmount = Math.min(discountAmount, totalAmount);
        }

        // Taxable amount
        const taxableAmount = totalAmount - discountAmount;

        // Tax calculation safely
        const sgstRate = Number(settings?.sgst) || 0;
        const cgstRate = Number(settings?.cgst) || 0;
        const igstRate = Number(settings?.igst) || 0;

        let cgst = 0, sgst = 0, igst = 0, taxAmount = 0;
        if (settings?.tax_status) {
            cgst = (taxableAmount * cgstRate) / 100;
            sgst = (taxableAmount * sgstRate) / 100;
            igst = (taxableAmount * igstRate) / 100;
            taxAmount = cgst + sgst + igst;
        }

        const grandTotal = taxableAmount + taxAmount;

        // Save history
        await OrderHistory.create([{
            orderId: order._id,
            previousData: previousOrderData,
            updatedData: {
                items: updatedItems,
                totalAmount,
                discountType,
                discountValue: discountValNum,
                discountAmount,
                cgst,
                sgst,
                igst,
                taxAmount,
                grandTotal
            },
            editedBy: (req as any).user?.id || "Unknown",
            editedAt: new Date()
        }], { session });

        // Update Order
        order.items = updatedItems as any;
        order.totalAmount = totalAmount;
        order.paymentType = paymentType || order.paymentType;
        order.discountType = discountType;
        order.discountValue = discountValNum;
        order.discountAmount = discountAmount;
        await order.save({ session });

        // Update Bill
        bill.items = updatedItems as any;
        bill.totalAmount = totalAmount;
        bill.paymentType = paymentType || bill.paymentType;
        bill.discountType = discountType || null;
        bill.discountValue = discountValNum;
        bill.discountAmount = discountAmount;
        bill.cgst = cgst;
        bill.sgst = sgst;
        bill.igst = igst;
        bill.taxAmount = taxAmount;
        bill.grandTotal = Math.round(grandTotal);
        bill.billeditstatus = true;
        bill.editDate = new Date();
        await bill.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            message: "Bill and Order updated successfully",
            bill
        });

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

