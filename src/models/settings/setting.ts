import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    storeName: string;
    logo: string;
    status: boolean;
    stockUpdate: boolean;
    printerPort: string;
    accept_qr_booking: boolean;
    show_available_qty: boolean;
    auto_print_bill: boolean;
    auto_print_kot: boolean;
}

const SettingsSchema: Schema = new Schema({
    storeName: { type: String, required: true },
    logo: { type: String, required: false },
    status: { type: Boolean, default: true },
    stockUpdate: { type: Boolean, default: false },
    printerPort: { type: String, required: false },
    accept_qr_booking: { type: Boolean, required: false },
    show_available_qty: { type: Boolean, required: false },
    auto_print_bill: { type: Boolean, required: false },
    auto_print_kot: { type: Boolean, required: false }


});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
