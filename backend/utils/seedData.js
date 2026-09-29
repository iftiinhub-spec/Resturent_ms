const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');

const seedInitialData = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });

    if (adminCount === 0) {
      console.log('[Seed] Seeding default users...');

      const adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        name: 'Restaurant Administrator',
        role: 'admin',
        isActive: true,
      });

      const cashierUser = await User.create({
        username: 'cashier1',
        password: 'cashier123',
        name: 'Sarah Connor (Cashier)',
        role: 'cashier',
        isActive: true,
      });

      console.log('[Seed] Admin: admin / admin123');
      console.log('[Seed] Cashier: cashier1 / cashier123');

      // Categories
      console.log('[Seed] Seeding categories...');
      const catBurgers = await Category.create({ name: 'Burgers', icon: 'Utensils', description: 'Gourmet handcrafted burgers' });
      const catPizzas = await Category.create({ name: 'Pizzas', icon: 'Pizza', description: 'Fresh stone-baked pizzas' });
      const catSides = await Category.create({ name: 'Sides & Snacks', icon: 'Sandwich', description: 'Crispy sides and appetizers' });
      const catDrinks = await Category.create({ name: 'Beverages', icon: 'CupSoda', description: 'Chilled drinks, sodas & shakes' });
      const catDesserts = await Category.create({ name: 'Desserts', icon: 'Cake', description: 'Sweet cakes and ice creams' });

      // Menu Items
      console.log('[Seed] Seeding menu items...');
      const itemsData = [
        { name: 'Classic Angus Burger', code: 'B01', category: catBurgers._id, categoryName: catBurgers.name, price: 9.99, costPrice: 4.20, stockQuantity: 40, lowStockThreshold: 8, imageEmoji: '🍔', description: '100% Angus beef patty, crisp lettuce, tomato, special sauce' },
        { name: 'Double Bacon Cheddar Burger', code: 'B02', category: catBurgers._id, categoryName: catBurgers.name, price: 12.99, costPrice: 5.50, stockQuantity: 30, lowStockThreshold: 5, imageEmoji: '🍔', description: 'Double patties, smoked bacon, melted aged cheddar' },
        { name: 'Crispy Spicy Chicken Burger', code: 'B03', category: catBurgers._id, categoryName: catBurgers.name, price: 10.50, costPrice: 4.00, stockQuantity: 25, lowStockThreshold: 5, imageEmoji: '🍗', description: 'Southern fried spicy chicken breast, slaw, garlic aioli' },
        { name: 'Pepperoni Supreme Pizza', code: 'P01', category: catPizzas._id, categoryName: catPizzas.name, price: 14.99, costPrice: 5.80, stockQuantity: 20, lowStockThreshold: 5, imageEmoji: '🍕', description: 'Italian pepperoni, mozzarella, rich tomato sauce' },
        { name: 'Margherita Classic Pizza', code: 'P02', category: catPizzas._id, categoryName: catPizzas.name, price: 11.99, costPrice: 4.20, stockQuantity: 18, lowStockThreshold: 5, imageEmoji: '🍕', description: 'Fresh basil leaves, buffalo mozzarella, virgin olive oil' },
        { name: 'BBQ Smokey Chicken Pizza', code: 'P03', category: catPizzas._id, categoryName: catPizzas.name, price: 15.50, costPrice: 6.20, stockQuantity: 15, lowStockThreshold: 4, imageEmoji: '🍕', description: 'Grilled chicken strips, red onions, tangy BBQ swirl' },
        { name: 'Crispy French Fries (L)', code: 'S01', category: catSides._id, categoryName: catSides.name, price: 4.50, costPrice: 1.10, stockQuantity: 65, lowStockThreshold: 10, imageEmoji: '🍟', description: 'Golden sea-salted potato fries' },
        { name: 'Loaded Cheese & Bacon Fries', code: 'S02', category: catSides._id, categoryName: catSides.name, price: 6.99, costPrice: 2.20, stockQuantity: 32, lowStockThreshold: 6, imageEmoji: '🍟', description: 'Melted cheese sauce, jalapeños, crispy bacon bits' },
        { name: 'Golden Mozzarella Sticks (6pcs)', code: 'S03', category: catSides._id, categoryName: catSides.name, price: 5.99, costPrice: 1.90, stockQuantity: 28, lowStockThreshold: 6, imageEmoji: '🧀', description: 'Stringy mozzarella breaded with marinara dip' },
        { name: 'Iced Lemon Mint Tea', code: 'D01', category: catDrinks._id, categoryName: catDrinks.name, price: 3.50, costPrice: 0.80, stockQuantity: 50, lowStockThreshold: 10, imageEmoji: '🍹', description: 'Fresh brewed black tea infused with lemon and mint' },
        { name: 'Strawberry Milkshake', code: 'D02', category: catDrinks._id, categoryName: catDrinks.name, price: 5.50, costPrice: 1.80, stockQuantity: 4, lowStockThreshold: 5, imageEmoji: '🥤', description: 'Real strawberries blended with rich vanilla ice cream' }, // Low stock!
        { name: 'Chilled Cola Can 330ml', code: 'D03', category: catDrinks._id, categoryName: catDrinks.name, price: 2.50, costPrice: 0.70, stockQuantity: 60, lowStockThreshold: 12, imageEmoji: '🥤', description: 'Refreshing cold can' },
        { name: 'Warm Chocolate Lava Cake', code: 'C01', category: catDesserts._id, categoryName: catDesserts.name, price: 6.50, costPrice: 2.10, stockQuantity: 3, lowStockThreshold: 5, imageEmoji: '🍰', description: 'Warm molten chocolate center with vanilla gelato' }, // Low stock!
        { name: 'Caramel Sundae Bowl', code: 'C02', category: catDesserts._id, categoryName: catDesserts.name, price: 4.50, costPrice: 1.40, stockQuantity: 19, lowStockThreshold: 5, imageEmoji: '🍨', description: 'Whipped cream, crushed nuts, warm salted caramel' },
      ];

      const insertedItems = await MenuItem.insertMany(itemsData);

      // Tables
      console.log('[Seed] Seeding tables...');
      const tablesData = [
        { tableNumber: 'Table 1', capacity: 2, status: 'Available' },
        { tableNumber: 'Table 2', capacity: 4, status: 'Available' },
        { tableNumber: 'Table 3', capacity: 4, status: 'Available' },
        { tableNumber: 'Table 4', capacity: 6, status: 'Available' },
        { tableNumber: 'Table 5', capacity: 2, status: 'Available' },
        { tableNumber: 'Table 6', capacity: 8, status: 'Available' },
        { tableNumber: 'Table 7', capacity: 4, status: 'Available' },
        { tableNumber: 'Table 8', capacity: 4, status: 'Available' },
      ];

      const insertedTables = await Table.insertMany(tablesData);

      // Create some historical sample orders so reports look great immediately
      console.log('[Seed] Seeding initial sample orders...');
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const sampleOrders = [
        {
          orderNumber: 'ORD-20260926-0001',
          orderType: 'Dine-In',
          table: insertedTables[0]._id,
          tableNumber: insertedTables[0].tableNumber,
          cashier: cashierUser._id,
          cashierName: cashierUser.name,
          items: [
            { menuItem: insertedItems[0]._id, name: insertedItems[0].name, price: insertedItems[0].price, costPrice: insertedItems[0].costPrice, quantity: 2, subtotal: 19.98 },
            { menuItem: insertedItems[6]._id, name: insertedItems[6].name, price: insertedItems[6].price, costPrice: insertedItems[6].costPrice, quantity: 1, subtotal: 4.50 },
            { menuItem: insertedItems[11]._id, name: insertedItems[11].name, price: insertedItems[11].price, costPrice: insertedItems[11].costPrice, quantity: 2, subtotal: 5.00 },
          ],
          subtotal: 29.48,
          discountPercent: 5,
          discountAmount: 1.47,
          taxPercent: 0,
          taxAmount: 0,
          grandTotal: 28.01,
          paymentMethod: 'Cash',
          amountPaid: 30.00,
          changeGiven: 1.99,
          status: 'Completed',
          completedAt: twoDaysAgo,
          createdAt: twoDaysAgo,
        },
        {
          orderNumber: 'ORD-20260927-0002',
          orderType: 'Takeaway',
          table: null,
          tableNumber: '',
          cashier: cashierUser._id,
          cashierName: cashierUser.name,
          items: [
            { menuItem: insertedItems[3]._id, name: insertedItems[3].name, price: insertedItems[3].price, costPrice: insertedItems[3].costPrice, quantity: 1, subtotal: 14.99 },
            { menuItem: insertedItems[7]._id, name: insertedItems[7].name, price: insertedItems[7].price, costPrice: insertedItems[7].costPrice, quantity: 1, subtotal: 6.99 },
            { menuItem: insertedItems[9]._id, name: insertedItems[9].name, price: insertedItems[9].price, costPrice: insertedItems[9].costPrice, quantity: 1, subtotal: 3.50 },
          ],
          subtotal: 25.48,
          discountPercent: 0,
          discountAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          grandTotal: 25.48,
          paymentMethod: 'Cash',
          amountPaid: 30.00,
          changeGiven: 4.52,
          status: 'Completed',
          completedAt: yesterday,
          createdAt: yesterday,
        },
        {
          orderNumber: 'ORD-20260928-0003',
          orderType: 'Dine-In',
          table: insertedTables[1]._id,
          tableNumber: insertedTables[1].tableNumber,
          cashier: adminUser._id,
          cashierName: adminUser.name,
          items: [
            { menuItem: insertedItems[1]._id, name: insertedItems[1].name, price: insertedItems[1].price, costPrice: insertedItems[1].costPrice, quantity: 2, subtotal: 25.98 },
            { menuItem: insertedItems[12]._id, name: insertedItems[12].name, price: insertedItems[12].price, costPrice: insertedItems[12].costPrice, quantity: 2, subtotal: 13.00 },
          ],
          subtotal: 38.98,
          discountPercent: 0,
          discountAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          grandTotal: 38.98,
          paymentMethod: 'Cash',
          amountPaid: 40.00,
          changeGiven: 1.02,
          status: 'Completed',
          completedAt: now,
          createdAt: now,
        },
      ];

      await Order.insertMany(sampleOrders);
      console.log('[Seed] Database initialization complete!');
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};

module.exports = seedInitialData;
