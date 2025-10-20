import { Request, Response } from 'express';
import Bill from '../../models/bill/bill'; // Import the Bill model
import OrderHistory from '../../models/orders/OrderHistory';
import User from '../../models/auth/User';
import Product from '../../models/product/product';

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

    if (type) matchStage.type = type;

    const billWiseReport = await Bill.aggregate([
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          billNumber: 1,
          orderId: 1,
          tableId: 1,
          totalAmount: 1,
          discountType: 1,
          discountValue: 1,
          discountAmount: 1,
          taxAmount: 1,
          grandTotal: 1,
          type: 1,
          paymentType: 1,
          createdAt: 1
        },
      },
      { $sort: { createdAt: 1 } }
    ]);

    const summary = billWiseReport.reduce(
      (acc, bill) => {
        acc.totalAmount += bill.totalAmount || 0;
        acc.totalDiscount += bill.discountAmount || 0;
        acc.totalTax += bill.taxAmount || 0;
        acc.grandTotal += bill.grandTotal || 0;
        return acc;
      },
      { totalAmount: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 }
    );

    res.status(200).json({
      bills: billWiseReport,
      summary
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
          totalSales: { $sum: '$items.totalPrice' } // or price * quantity
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

    // ✅ Add summary
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
          totalSales: { $sum: "$grandTotal" }, // Include tax-inclusive amount
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

    // ✅ Add summary
    const summary = dayWiseReport.reduce(
      (acc, item) => {
        acc.totalSales += item.totalSales;
        acc.billCount += item.billCount;
        return acc;
      },
      { totalSales: 0, billCount: 0 }
    );

    res.status(200).json({
      days: dayWiseReport,
      summary
    });

  } catch (error) {
    console.error('Error generating day-wise sales report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Report of bill edits in a date range
export const getBillEditReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'startDate and endDate are required' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setDate(end.getDate() + 1);

    const history = await OrderHistory.aggregate([
      { $match: { editedAt: { $gte: start, $lt: end } } },

      // Join with Bill to get billNumber
      {
        $lookup: {
          from: 'bills',
          localField: 'orderId',
          foreignField: 'orderId',
          as: 'billInfo'
        }
      },
      { $unwind: '$billInfo' },

      // Join with User using user.id (not _id)
      {
        $lookup: {
          from: 'users',
          localField: 'editedBy',  // UUID stored in order history
          foreignField: 'id',      // UUID field in user collection
          as: 'editor'
        }
      },
      { $unwind: { path: '$editor', preserveNullAndEmptyArrays: true } },

      { $sort: { editedAt: -1 } },

      {
        $project: {
          billNumber: '$billInfo.billNumber',
          editedAt: 1,
          editedBy: { $ifNull: ['$editor.name', 'Unknown'] },
          previousTotal: '$previousData.totalAmount',
          previousGrandTotal: '$previousData.grandTotal',
          updatedTotal: '$updatedData.totalAmount',
          updatedGrandTotal: '$updatedData.grandTotal',
          paymentType: '$previousData.paymentType',
          items: '$updatedData.items'
        }
      }
    ]);

    // ✅ Enrich item list with product names
    const allProductIds = [
      ...new Set(history.flatMap(h => h.items?.map((i: any) => i.id) || []))
    ];

    const products = await Product.find({ _id: { $in: allProductIds } }).select('name');
    const productMap = Object.fromEntries(products.map((p: any) => [p._id.toString(), p.name]));

    const enrichedHistory = history.map(h => ({
      ...h,
      items: h.items?.map((i: any) => ({
        ...i,
        name: productMap[i.id] || i.id
      }))
    }));

    res.status(200).json({ history: enrichedHistory });

  } catch (error) {
    console.error('Error fetching bill edit report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Fetch history for a specific bill
export const getBillEditHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { billNumber } = req.params;

    const bill = await Bill.findOne({ billNumber });
    if (!bill) {
      res.status(404).json({ message: 'Bill not found' });
      return;
    }

    const history = await OrderHistory.aggregate([
      { $match: { orderId: bill.orderId } },
      {
        $lookup: {
          from: 'users',
          localField: 'editedBy',
          foreignField: 'id',
          as: 'editor'
        }
      },
      { $unwind: { path: '$editor', preserveNullAndEmptyArrays: true } },
      { $sort: { editedAt: -1 } },
      {
        $project: {
          editedAt: 1,
          editedBy: { $ifNull: ['$editor.name', 'Unknown'] },
          previousTotal: '$previousData.totalAmount',
          previousGrandTotal: '$previousData.grandTotal',
          updatedTotal: '$updatedData.totalAmount',
          updatedGrandTotal: '$updatedData.grandTotal',
          paymentType: '$previousData.paymentType',
          items: '$updatedData.items'
        }
      }
    ]);

    // ✅ Enrich items with product names
    const allProductIds = [
      ...new Set(history.flatMap(h => h.items?.map((i: any) => i.id) || []))
    ];
    const products = await Product.find({ _id: { $in: allProductIds } }).select('name');
    const productMap = Object.fromEntries(products.map((p: any) => [p._id.toString(), p.name]));

    const enrichedHistory = history.map(h => ({
      ...h,
      items: h.items?.map((i: any) => ({
        ...i,
        name: productMap[i.id] || i.id
      }))
    }));

    res.status(200).json({ billNumber, history: enrichedHistory });
  } catch (error) {
    console.error('Error fetching bill history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};