import { Request, Response } from 'express';
import Bill from '../../models/bill/bill'; // Import the Bill model

export const getBillWiseSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, type } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ message: 'startDate and endDate are required' });
            return;
        }

        const startDateObj = new Date(startDate as string);
        const endDateObj = new Date(endDate as string);
        endDateObj.setDate(endDateObj.getDate() + 1);

        const matchStage: any = {
            createdAt: {
                $gte: startDateObj,
                $lt: endDateObj,
            },
        };

        if (type) {
            matchStage.type = type;
        }

        const billWiseReport = await Bill.aggregate([
            {
                $match: matchStage,
            },
            {
                $project: {
                    _id: 1,
                    billNumber: 1,
                    orderId: 1,
                    tableId: 1,
                    totalAmount: 1,
                    type: 1,
                    createdAt: 1,
                    paymentType: 1, // ✅ Include this
                },
            },
            {
                $sort: { createdAt: 1 },
            },
        ]);

        const totalAmountSummary = billWiseReport.reduce((sum, bill) => sum + bill.totalAmount, 0);

        res.status(200).json({
            bills: billWiseReport,
            summary: {
                totalAmount: totalAmountSummary,
                billCount: billWiseReport.length,
            },
        });
    } catch (error) {
        console.error('Error generating bill-wise sales report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const getItemWiseSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ message: 'startDate and endDate are required' });
            return;
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setDate(end.getDate() + 1);

        const itemWiseReport = await Bill.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.id',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalSales: { $sum: '$items.totalPrice' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: {
                    path: '$product',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    productId: '$_id',
                    name: '$product.name',
                    totalQuantity: 1,
                    totalSales: 1,
                    _id: 0
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        // ✅ Calculate summary totals
        const summary = itemWiseReport.reduce(
            (acc, item) => {
                acc.totalQuantity += item.totalQuantity;
                acc.totalSales += item.totalSales;
                return acc;
            },
            { totalQuantity: 0, totalSales: 0 }
        );

        res.status(200).json({
            items: itemWiseReport,
            summary
        });
    } catch (error) {
        console.error('Error generating item-wise sales report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const getDayWiseSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ message: 'startDate and endDate are required' });
            return;
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setDate(end.getDate() + 1);

        const dayWiseReport = await Bill.aggregate([
            { $match: { createdAt: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalAmount" },
                    billCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: '$_id',
                    totalSales: 1,
                    billCount: 1,
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);

        res.status(200).json({ days: dayWiseReport });
    } catch (error) {
        console.error('Error generating day-wise sales report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
