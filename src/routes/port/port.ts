import express from 'express';
import { getSerialPorts } from '../../controllers/port/serialPortController';

const router = express.Router();

// Route for creating an order
router.get('/serialports', getSerialPorts);





export default router;