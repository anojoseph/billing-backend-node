import { Request, Response } from "express";
import Kitchen from "../../models/kitchen/Kitchen";
import Product from "../../models/product/product";

export const getKitchens = async (req: Request, res: Response) => {
    try {
        const kitchens = await Kitchen.find().populate("items");
        res.json(kitchens);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getKitchenById = async (req: Request, res: Response) => {
    try {
        const kitchen = await Kitchen.findById(req.params.id).populate("items");
        if (!kitchen) return res.status(404).json({ error: "Kitchen not found" });
        res.json(kitchen);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createKitchen = async (req: Request, res: Response) => {
    try {
        const { name, status, items } = req.body;

        if (!name || typeof status !== 'boolean' || !Array.isArray(items)) {
            return res.status(400).json({ error: "Name, status (boolean), and items (array) are required" });
        }

        const validItems = await Product.find({ _id: { $in: items } });
        if (validItems.length !== items.length) {
            return res.status(400).json({ error: "Invalid product IDs in items" });
        }

        const newKitchen = new Kitchen({ name, status, items });
        await newKitchen.save();

        await Product.updateMany(
            { _id: { $in: items } },
            { $set: { kitchen: newKitchen._id } }
        );


        res.status(201).json(newKitchen);
    } catch (error) {
        console.error("Error creating kitchen:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// export const updateKitchen = async (req: Request, res: Response) => {
//     try {
//         const { name, status, items } = req.body;

//         if (items) {
//             const validItems = await Product.find({ _id: { $in: items } });
//             if (validItems.length !== items.length)
//                 return res.status(400).json({ error: "Invalid product IDs in items" });
//         }

//         const updatedKitchen = await Kitchen.findByIdAndUpdate(
//             req.params.id,
//             { name, status, items, updated_at: new Date() },
//             { new: true }
//         );

//         if (!updatedKitchen)
//             return res.status(404).json({ error: "Kitchen not found" });

//         res.json(updatedKitchen);
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };
export const updateKitchen = async (req: Request, res: Response) => {
    try {
        const { name, status, items } = req.body;

        const kitchenId = req.params.id;

        if (items) {
            const validItems = await Product.find({ _id: { $in: items } });
            if (validItems.length !== items.length)
                return res.status(400).json({ error: "Invalid product IDs in items" });

            // Remove kitchen reference from products no longer in the list
            await Product.updateMany(
                { kitchen: kitchenId, _id: { $nin: items } },
                { $unset: { kitchen: "" } }
            );

            // Add kitchen reference to new products
            await Product.updateMany(
                { _id: { $in: items } },
                { $set: { kitchen: kitchenId } }
            );
        }

        const updatedKitchen = await Kitchen.findByIdAndUpdate(
            kitchenId,
            { name, status, items, updated_at: new Date() },
            { new: true }
        );

        if (!updatedKitchen)
            return res.status(404).json({ error: "Kitchen not found" });

        res.json(updatedKitchen);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteKitchen = async (req: Request, res: Response) => {
    try {
        const kitchen = await Kitchen.findByIdAndUpdate(
            req.params.id,
            { deleted_at: new Date() },
            { new: true }
        );

        if (!kitchen) return res.status(404).json({ error: "Kitchen not found" });

        res.json({ message: "Kitchen soft deleted", kitchen });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
