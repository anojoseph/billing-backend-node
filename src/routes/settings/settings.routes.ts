import express from 'express';
import { getSettings, updateSettings } from '../../controllers/settings/settings.controller';

const router = express.Router();

router.get('/general-settings', getSettings);  // ✅ Pass function directly
router.patch('/general-settings', updateSettings);  // ✅ Pass function directly

export default router;
