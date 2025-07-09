import express from 'express';
import { getSettings, updateSettings } from '../../controllers/settings/settings.controller';
import {getPrinterConfig,savePrinterConfig} from '../../services/printerConfigController'

const router = express.Router();

router.get('/general-settings', getSettings);  // ✅ Pass function directly
router.patch('/general-settings', updateSettings);  // ✅ Pass function directly4

router.get('/printer-config', getPrinterConfig);
router.post('/printer-config', savePrinterConfig);

export default router;
