// printerConfigController.ts
import fs from 'fs';

const CONFIG_FILE = './printer-config.json';

export const getPrinterConfig = (req: any, res: any) => {
    if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json({ billing: '', kitchens: {} });
    }
};

export const savePrinterConfig = (req: any, res: any) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Saved' });
};
