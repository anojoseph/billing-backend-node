import express, { RequestHandler } from 'express';
import { createOrder, completeOrder, updateBillAndOrder, getBillByNumber, deleteBillAndOrder } from '../../controllers/order/orderController';

const router = express.Router();

// Route for creating an order
router.post('/create', createOrder);
router.put('/:orderId/complete', completeOrder);

router.get('/:billNumber', getBillByNumber as RequestHandler); 
router.put('/:orderId/update', updateBillAndOrder as RequestHandler);
router.delete('/:billNumber/delete', deleteBillAndOrder as RequestHandler);




export default router;