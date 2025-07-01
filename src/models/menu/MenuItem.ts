// models/menu/MenuItem.ts
import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  label: String,
  icon: String,
  roles: [String],
  children: [
    {
      label: String,
      route: String,
      roles: [String],
    }
  ]
});

export default mongoose.model('MenuItem', MenuItemSchema);
