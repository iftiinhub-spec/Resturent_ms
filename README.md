# Offline Restaurant Management & POS System (MERN Stack)

A complete, **100% Offline-First Restaurant Management System** built with **React**, **Tailwind CSS**, **Node.js**, **Express**, and **local MongoDB**. Designed to run on restaurant premises without requiring an internet connection or external cloud services.

---

## 🚀 Quick Start (1-Click Launch)

### Prerequisites
1. **Node.js** (v18+)
2. **MongoDB** running locally on default port `27017`

### Running the System
Double-click `start-pos.bat` or run:
```bash
npm start
```
Open your browser to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔐 Default User Roles & Credentials

The system automatically seeds initial accounts, menu items, categories, and tables on the first run:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin` | `admin123` | Full access to all modules, financial reports, user management, inventory & pricing |
| **💼 Cashier** | `cashier1` | `cashier123` | POS order taking, payment processing, change calculation, receipt printing, tables |

> *Quick-fill buttons are provided on the login screen for rapid testing.*

---

## 📦 Key System Modules & Features

### 1. 🛡️ Role-Based Authentication & Security
- Secure token-based session handling stored locally.
- Password hashing with **Bcrypt**.
- Strict permission checks on both the Express API and React views:
  - **Admin**: Can access POS, Tables, Orders, Menu & Inventory, Categories, Cashiers, Reports.
  - **Cashier**: Restricted to POS Terminal, Table Floor, and Orders History. Sensitive administrative functions and profit analytics are inaccessible.

### 2. ⚡ POS Terminal (Order Management & Cashier Counter)
- **Fast Menu Catalog**: Search by item name or SKU code (e.g. `B01`), filter by category.
- **Visual Grid**: Displays item emoji, pricing, stock remaining, and out-of-stock badges.
- **Order Cart**:
  - Switch between **🍽️ Dine-In** and **🥡 Takeaway**.
  - Interactive table assignment with live status.
  - Quantity controls (`+` / `-`), remove items, and order notes.
  - Authorized discount buttons (0%, 5%, 10%, 15%, 20%).
  - Real-time Subtotal, Discount, and Grand Total calculation.
  - **Save Pending**: Hold open tab orders for later payment.
  - **Pay Now**: Launch payment modal.

### 3. 💵 Payment & Real-Time Change Calculation
- **Cash Payment Processor**:
  - Quick denomination buttons: `Exact`, `$10`, `$20`, `$50`, `$100`.
  - Live change calculator display (`Customer Change: $X.XX`).
  - Validation: Prevents completion if cash tendered is less than the total.
- **Card Payment**: Supports POS card terminals.
- Automatic inventory stock decrement upon order completion.

### 4. 🖨️ Printable Thermal Receipts
- High-fidelity restaurant receipt layout matching standard 80mm POS thermal printers.
- Details: Store header, Order #, Date/Time, Cashier name, Dine-In table or Takeaway, itemized quantities and totals, Subtotal, Discount, Grand Total, Amount Paid, and Change Given.
- Native `window.print()` trigger with dedicated `@media print` thermal styling.

### 5. 🪑 Table Floor Management
- Visual floor map with real-time status badges:
  - 🟢 **Available**: Ready for new diners. Direct button to start order for that table.
  - 🟡 **Occupied**: Shows linked order number and current balance. Direct link to pay.
  - 🔵 **Reserved**: Table reserved for upcoming guests.
- Admin controls to add tables, edit capacity, and delete tables.

### 6. 📦 Menu & Inventory Management (Admin)
- Add, edit, and delete food and beverage items.
- Item attributes: Name, SKU Code, Category, Description, Selling Price, Cost Price, Stock Quantity, Low-Stock Threshold, and Display Emoji.
- Real-time stock status:
  - 🔴 **Red alert** when stock reaches or drops below threshold.
  - Quick restock shortcuts (`+5`, `+10`, `-1`).
  - Instant **Enable/Disable** toggle to take items off the menu when ingredients run out.

### 7. 🏷️ Categories Management (Admin)
- Organize items into categories (e.g., Burgers, Pizzas, Sides, Beverages, Desserts).
- Automatic cascading category name updates.

### 8. 👥 Cashier & User Management (Admin)
- Create new cashier accounts.
- Assign roles (`Admin` or `Cashier`).
- Activate / Deactivate accounts without losing order history.
- Admin password reset modal.
- Safeguards preventing admins from deactivating or deleting their own account.

### 9. 📊 Sales Reports & Analytics (Admin)
- **Timeframes**: Daily (Last 7 Days), Weekly (Last 4 Weeks), Monthly (Last 6 Months).
- **Summary Metrics**: Total Revenue, Cost of Goods, Net Profit, Orders Count, Average Order Value, and Discounts Given.
- **Sales by Cashier**: Compare shift sales, order count, and item quantities per employee.
- **Most-Sold Items**: Top 15 ranking by units sold and revenue generated.
- **Audit Logs**: Cancelled orders log with cancellation reasons and lost revenue.
- **Offline Export**: Export sales reports directly to `.CSV` format or print summaries.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (offline bundled icons)
- **Backend**: Node.js, Express 5, Cors, Dotenv, Bcryptjs, JSON Web Tokens
- **Database**: Local MongoDB (`mongodb://127.0.0.1:27017/offline_restaurant_db?directConnection=true`)

---

## 📁 Directory Structure

```text
Resturent_ms/
├── package.json               # Root scripts (start, dev, build)
├── start-pos.bat              # Windows double-click launcher
├── backend/
│   ├── .env                   # Local configuration
│   ├── server.js              # Express app & static file serving
│   ├── config/
│   │   └── db.js              # Offline MongoDB connection
│   ├── models/                # User, Category, MenuItem, Table, Order
│   ├── routes/                # Auth, Users, Categories, Menu, Tables, Orders, Reports
│   ├── middleware/            # Auth & Role-based Authorization
│   └── utils/
│       ├── seedData.js        # Default data seeder
│       └── testE2E.js         # Automated end-to-end verification
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── src/
    │   ├── App.jsx            # Main app shell & view switching
    │   ├── context/
    │   │   └── AuthContext.jsx # Offline auth state
    │   ├── services/
    │   │   └── api.js         # API client
    │   ├── components/        # Navbar, Sidebar, PaymentModal, ReceiptModal
    │   └── views/             # Login, Dashboard, POS, Tables, Orders, Menu, Categories, Users, Reports
    └── dist/                  # Production-compiled offline bundle
```
