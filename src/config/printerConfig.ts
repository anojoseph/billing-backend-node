import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import * as path from 'path';

const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: path.join(__dirname, '../public/printer_output.txt'),
});

export default printer;