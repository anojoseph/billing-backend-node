// routes/menu.routes.ts
import express, { RequestHandler } from 'express';
import {
  getMenuByRole,
  createMenu,
  updateMenu,
  getMenuById,
  getAllMenus
} from '../../controllers/menu/menu.controller';
import { seedMenus } from '../../controllers/menu/menu.seed';

const router = express.Router();

router.get('/menu/all', getAllMenus as RequestHandler);
router.get('/menu', getMenuByRole as RequestHandler);
router.get('/menu/:id', getMenuById as RequestHandler); // 👈 added
router.post('/menu', createMenu as RequestHandler);
router.put('/menu/:id', updateMenu as RequestHandler);
router.post('/menu/seed', seedMenus as RequestHandler);

export default router;
