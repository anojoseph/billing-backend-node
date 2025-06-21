// import { SerialPort } from 'serialport';
// import { Request, Response } from 'express';
// import os from 'os';

// export const getSerialPorts = async (req: Request, res: Response): Promise<void> => {
//     try {
//         if (os.platform() === 'linux' && process.env.NODE_ENV === 'production') {
//             res.status(200).json({ message: 'SerialPort listing is disabled in production.' });
//             return; // ✅ important to prevent TS confusion
//         }

//         const ports = await SerialPort.list();
//         res.json(ports);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Unable to fetch Serial Ports!', error: error.message });
//     }
// };
