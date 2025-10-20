import { Request, Response, NextFunction } from 'express';
import Settings from '../../models/settings/setting';
import multer from 'multer';

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
            settings.accept_qr_booking = req.body.accept_qr_booking === 'true';
            settings.show_available_qty = req.body.show_available_qty === 'true';
            settings.auto_print_bill = req.body.auto_print_bill === 'true';
            settings.auto_print_kot = req.body.auto_print_kot === 'true';
            settings.auto_print_token = req.body.auto_print_token === 'true';
            settings.tax_status = req.body.tax_status === 'true';
            settings.sgst = req.body.sgst;
            settings.cgst = req.body.cgst;
            settings.igst = req.body.igst;
            settings.storeAddress = req.body.storeAddress;
            settings.storeContact = req.body.storeContact;
            settings.gstNumber = req.body.gstNumber;
            settings.gst_available = req.body.gst_available;
            settings.fssai_available = req.body.fssai_available;
            settings.fssai_number = req.body.fssai_number;
            settings.whatsapp = req.body.whatsapp;


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

