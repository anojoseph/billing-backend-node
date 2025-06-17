import { SerialPort } from 'serialport';
import { Request, Response } from 'express';

export const getSerialPorts = async (req: Request, res: Response) => {
    try {
        const ports = await SerialPort.list();
        res.json(ports);
    } catch (error) {
        res.status(500).json({ message: 'Unable to fetch Serial Ports!', error });
    }
};

