import express from "express";
import { getAllTables, getTableById, createTable, updateTable, deleteTable } from "../../controllers/table/table";

const router = express.Router();

router.get("/table", getAllTables);
router.get("/table/:id", getTableById);
router.post("/table", createTable);
router.patch("/table/:id", updateTable);
router.delete("/table/:id", deleteTable);


export default router;