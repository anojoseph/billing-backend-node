import { SerialPort } from 'serialport';
import { Request, Response } from 'express';
import os from 'os';

export const getSerialPorts = async (req: Request, res: Response) => {
    try {
        // Avoid trying to list ports in production or non-supported environments
        if (os.platform() === 'linux' && process.env.NODE_ENV === 'production') {
            return res.status(200).json({ message: 'SerialPort listing is disabled in production.' });
        }

        const ports = await SerialPort.list();
        res.json(ports);
    } catch (error:any) {
        res.status(500).json({ message: 'Unable to fetch Serial Ports!', error: error.message });
    }
};
