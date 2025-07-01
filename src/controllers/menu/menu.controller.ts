// controllers/menu.controller.ts
import { Request, Response, RequestHandler } from 'express';
import MenuItem from '../../models/menu/MenuItem';

export const createMenu = async (req: Request, res: Response) => {
    try {
        const menu = new MenuItem(req.body);
        await menu.save();
        res.status(201).json({ message: 'Menu created successfully', menu });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create menu', error });
    }
};

export const updateMenu = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Menu not found' });
        res.json({ message: 'Menu updated successfully', menu: updated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update menu', error });
    }
};

export const getMenuByRole = async (req: Request, res: Response) => {
    const roleParam = req.query.role;

    let role: string;

    if (typeof roleParam === 'string') {
        role = roleParam;
    } else if (Array.isArray(roleParam) && typeof roleParam[0] === 'string') {
        role = roleParam[0]; // use the first value if array
    } else {
        return res.status(400).json({ message: 'Invalid or missing role' });
    }

    const allMenus = await MenuItem.find();

    const filtered = allMenus
        .map(menu => {
            const children = menu.children.filter((child: any) => child.roles.includes(role));
            return children.length > 0 || menu.roles.includes(role)
                ? {
                    label: menu.label,
                    icon: menu.icon,
                    roles: menu.roles,
                    children,
                }
                : null;
        })
        .filter(Boolean);

    res.json(filtered);

};

// controllers/menu.controller.ts
export const getMenuById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const menu = await MenuItem.findById(id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get menu', error });
    }
};


// controllers/menu.controller.ts
export const getAllMenus = async (req: Request, res: Response) => {
  try {
    const menus = await MenuItem.find();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menus', error });
  }
};
