import { Request, Response, NextFunction } from 'express';
import Settings from '../../models/settings/setting';
import multer from 'multer';
import path from 'path';

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists in your project
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Get settings
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            res.status(404).json({ message: 'No settings found' });
            return;
        }

        // Construct full URL for the logo
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fullLogoUrl = settings.logo ? `${baseUrl}/${settings.logo.replace(/\\/g, '/')}` : null;

        res.json({
            ...settings.toObject(),
            logo: fullLogoUrl, // Replace logo path with full URL
        });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = [
    upload.single('logo'), // Middleware to handle file upload
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        try {
            let settings = await Settings.findOne();

            if (!settings) {
                // Create a new settings document if none exists
                settings = new Settings();
            }

            // Update fields from req.body
            settings.storeName = req.body.storeName;
            settings.status = req.body.status === 'true'; // Convert to boolean
            settings.stockUpdate = req.body.stockUpdate === 'true';

            // Handle file upload
            if (req.file) {
                settings.logo = req.file.path; // Save file path to DB
            }

            await settings.save();
            res.json({ message: 'Settings updated successfully', settings });

        } catch (error) {
            next(error);
        }
    }
];

