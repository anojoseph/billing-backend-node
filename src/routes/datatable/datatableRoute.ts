import express from 'express';
import { getItems} from '../../controllers/data-table/datatableController';

const router = express.Router();

router.get('/collection/:collection', getItems);

export default router;
