import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    storeName: string;
    logo: string;
    status: boolean;
    stockUpdate: boolean;
    printerPort:string;
    accept_qr_booking:boolean;
}

const SettingsSchema: Schema = new Schema({
    storeName: { type: String, required: true },
    logo: { type: String, required: false },
    status: { type: Boolean, default: true },
    stockUpdate: { type: Boolean, default: false },
    printerPort: { type: String, required: false },
    accept_qr_booking: { type: Boolean, required: false }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
