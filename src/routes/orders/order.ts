import express from 'express';
import { createOrder, completeOrder } from '../../controllers/order/orderController';

const router = express.Router();

// Route for creating an order
router.post('/create', createOrder);
router.put('/:orderId/complete', completeOrder);


export default router;