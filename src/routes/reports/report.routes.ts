import express from 'express';
import { getBillWiseSalesReport } from '../../controllers/reports/dailyreport';
import { getItemWiseSalesReport } from '../../controllers/reports/dailyreport';
import { getDayWiseSalesReport } from '../../controllers/reports/dailyreport';



const router = express.Router();

router.get('/daily-report', getBillWiseSalesReport);  // ✅ Pass function directly
router.get('/item-report', getItemWiseSalesReport);  // ✅ Pass function directly
router.get('/day-report', getDayWiseSalesReport);  // ✅ Pass function directly



export default router;
