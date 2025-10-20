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
    auto_print_token: boolean;
    tax_status: boolean;
    sgst: string;
    cgst: string;
    igst: string;
    storeAddress: string;
    storeContact: string;
    gstNumber: string;
    gst_available: boolean;
    fssai_available: boolean;
    fssai_number: string;
    whatsapp:string;

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
    auto_print_kot: { type: Boolean, required: false },
    auto_print_token: { type: Boolean, required: false },
    tax_status: { type: Boolean, required: false },
    sgst: { type: String, required: false },
    cgst: { type: String, required: false },
    igst: { type: String, required: false },
    storeAddress: { type: String, required: false },
    storeContact: { type: String, required: false },
    gstNumber: { type: String, required: false },
    gst_available: { type: Boolean, required: false },
    fssai_available: { type: Boolean, required: false },
    fssai_number: { type: String, required: false },
    whatsapp: { type: String, required: false },




});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
