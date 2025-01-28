import { Request, Response } from 'express';
import mongoose from 'mongoose';

const allowedFields: Record<string, string[]> = {
    ProductItem: ['id', 'name', 'status'],
};

export const getItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const { collection } = req.params;
        const { fields, searchValue, page = 1, limit = 10 } = req.query;
        if (!collection) {
            res.status(400).json({ error: 'Collection name is required' });
            return;
        }
        if (!mongoose.modelNames().includes(collection)) {
            res.status(404).json({ error: `Model for collection '${collection}' does not exist.` });
            return;
        }
        const Model = mongoose.model(collection);
        if (!allowedFields[collection]) {
            res.status(404).json({ error: `No allowed fields found for collection '${collection}'` });
            return;
        }
        let projection: Record<string, any> = {};
        if (fields) {
            let fieldList: string[] = [];
            if (Array.isArray(fields)) {
                fieldList = fields as string[];
            } else if (typeof fields === 'string') {
                fieldList = fields.split(',');
            }
            const invalidFields = fieldList.filter(field => !allowedFields[collection].includes(field));
            if (invalidFields.length > 0) {
                res.status(400).json({ error: `Invalid fields requested: ${invalidFields.join(', ')}` });
                return;
            }
            projection = fieldList.reduce((acc: Record<string, any>, field: string) => {
                acc[field] = 1;
                return acc;
            }, { _id: 0 });
        } else {
            projection = allowedFields[collection].reduce((acc: Record<string, any>, field: string) => {
                acc[field] = 1;
                return acc;
            }, { _id: 0 });
        }

        let searchQuery: any = { deleted_at: null };
        if (searchValue) {
            const searchVal = typeof searchValue === 'string' ? searchValue.toLowerCase() : searchValue;
            const validSearchFields = allowedFields[collection];
            const searchCriteria: any = {};
            validSearchFields.forEach((field) => {
                const fieldType = Model.schema.path(field).instance;

                if (fieldType === 'String') {
                    searchCriteria[field] = { $regex: searchVal, $options: 'i' };
                } else if (fieldType === 'Boolean') {
                    const boolValue = searchVal === 'true' ? true : (searchVal === 'false' ? false : undefined);
                    if (boolValue !== undefined) {
                        searchCriteria[field] = boolValue;
                    }
                }
            });
            if (Object.keys(searchCriteria).length > 0) {
                searchQuery = {
                    ...searchQuery,
                    $or: Object.keys(searchCriteria).map((field) => ({
                        [field]: searchCriteria[field],
                    })),
                };
            } else {
                res.status(400).json({ error: 'Invalid search value for boolean fields' });
                return;
            }
        }

        const items = await Model.find(searchQuery, projection)
            .skip((parseInt(page as string) - 1) * parseInt(limit as string))
            .limit(parseInt(limit as string));

        const totalCount = await Model.countDocuments(searchQuery);

        res.json({
            items,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit as string)),
                currentPage: parseInt(page as string),
                pageSize: parseInt(limit as string),
            },
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
