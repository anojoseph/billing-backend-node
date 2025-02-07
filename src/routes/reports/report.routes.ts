import express from 'express';
import { getBillWiseSalesReport } from '../../controllers/reports/dailyreport';

const router = express.Router();

router.get('/daily-report', getBillWiseSalesReport);  // ✅ Pass function directly

export default router;
