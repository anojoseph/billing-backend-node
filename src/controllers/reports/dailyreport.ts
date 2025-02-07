import { Request, Response } from 'express';
import Bill from '../../models/bill/bill'; // Import the Bill model

export const getBillWiseSalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, type } = req.query;
        console.log('Query Parameters:', { startDate, endDate, type });

        // Validate startDate and endDate
        if (!startDate || !endDate) {
            res.status(400).json({ message: 'startDate and endDate are required' });
            return;
        }

        // Convert startDate and endDate to Date objects
        const startDateObj = new Date(startDate as string);
        const endDateObj = new Date(endDate as string);

        // Set endDate to the next day to include all bills on the endDate
        endDateObj.setDate(endDateObj.getDate() + 1);

        // Build the match stage for filtering by date and type (if provided)
        const matchStage: any = {
            createdAt: {
                $gte: startDateObj, // Bills created on or after startDate
                $lt: endDateObj,    // Bills created before the next day of endDate
            },
        };

        // Add type filter if provided
        if (type) {
            matchStage.type = type;
        }

        console.log('Match Stage:', matchStage); // Log the match stage for debugging

        // Generate the bill-wise sales report using aggregation
        const billWiseReport = await Bill.aggregate([
            {
                $match: matchStage, // Filter bills by date and type (if provided)
            },
            {
                $project: {
                    _id: 1, // Include bill ID
                    orderId: 1, // Include order ID
                    tableId: 1, // Include table ID
                    totalAmount: 1, // Include total amount
                    type: 1, // Include bill type
                    createdAt: 1, // Include creation date
                },
            },
            {
                $sort: { createdAt: 1 }, // Sort bills by creation date
            },
        ]);

        console.log('Bill-wise Report:', billWiseReport); // Log the report for debugging

        // Calculate the total amount summary
        const totalAmountSummary = billWiseReport.reduce((sum, bill) => sum + bill.totalAmount, 0);

        // Send the bill-wise report and total amount summary as a response
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