import express, { RequestHandler } from 'express';
import { createOrder, completeOrder, updateBillAndOrder, getBillByNumber, deleteBillAndOrder } from '../../controllers/order/orderController';
import { printKitchenTickets } from '../../controllers/kitchen/kot';
const router = express.Router();

// Route for creating an order
router.post('/create', createOrder);
router.put('/:orderId/complete', completeOrder);

router.get('/:billNumber', getBillByNumber as RequestHandler); 
router.put('/:orderId/update', updateBillAndOrder as RequestHandler);
router.delete('/:billNumber/delete', deleteBillAndOrder as RequestHandler);


router.post('/:orderId/print', async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await printKitchenTickets(orderId);
    res.json({ printContent: result.printContent });
  } catch (error) {
    res.status(500).json({ message: 'Print failed!', error });
  }
});
    





export default router;