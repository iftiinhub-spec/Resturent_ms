const assert = require('assert');

async function runE2ETest() {
  console.log('--- Starting Offline Restaurant E2E Verification ---');

  // 1. Login as Cashier
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier1', password: 'cashier123' }),
  });
  const loginData = await loginRes.json();
  assert(loginData.success, 'Cashier login should succeed');
  assert(loginData.user.role === 'cashier', 'Role should be cashier');
  const token = loginData.token;
  console.log('✓ Cashier login successful:', loginData.user.name);

  // 2. Fetch Menu Items
  const menuRes = await fetch('http://localhost:5000/api/menu?availableOnly=true', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const menuData = await menuRes.json();
  assert(menuData.success && menuData.data.length > 0, 'Menu items should be returned');
  console.log(`✓ Fetched ${menuData.data.length} available menu items`);

  const item1 = menuData.data[0];
  const item2 = menuData.data[1];
  const initialStockItem1 = item1.stockQuantity;

  // 3. Fetch Tables
  const tablesRes = await fetch('http://localhost:5000/api/tables', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tablesData = await tablesRes.json();
  assert(tablesData.success && tablesData.data.length > 0, 'Tables should be returned');
  const table = tablesData.data.find(t => t.status === 'Available') || tablesData.data[0];
  console.log(`✓ Selected Table: ${table.tableNumber}`);

  // 4. Create Order with Cash Payment
  const expectedSubtotal = item1.price * 2 + item2.price * 1;
  const discountPercent = 10;
  const discountAmount = Number(((expectedSubtotal * discountPercent) / 100).toFixed(2));
  const grandTotal = Number((expectedSubtotal - discountAmount).toFixed(2));
  const amountPaid = Math.ceil(grandTotal) + 10; // Extra cash
  const expectedChange = Number((amountPaid - grandTotal).toFixed(2));

  const createOrderRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderType: 'Dine-In',
      tableId: table._id,
      items: [
        { menuItemId: item1._id, quantity: 2 },
        { menuItemId: item2._id, quantity: 1 },
      ],
      discountPercent,
      isPaidNow: true,
      amountPaid,
      paymentMethod: 'Cash',
    }),
  });
  const orderData = await createOrderRes.json();
  assert(orderData.success, 'Order creation should succeed');
  assert(orderData.data.status === 'Completed', 'Order status should be Completed');
  assert.strictEqual(orderData.data.changeGiven, expectedChange, 'Change calculation must match');
  console.log(`✓ Created Order ${orderData.data.orderNumber} Total: $${orderData.data.grandTotal}, Change: $${orderData.data.changeGiven}`);

  // 5. Verify Stock Deduction
  const updatedItemRes = await fetch(`http://localhost:5000/api/menu/${item1._id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const updatedItemData = await updatedItemRes.json();
  assert.strictEqual(updatedItemData.data.stockQuantity, initialStockItem1 - 2, 'Stock should be decremented by 2');
  console.log(`✓ Stock for "${item1.name}" correctly decremented from ${initialStockItem1} to ${updatedItemData.data.stockQuantity}`);

  // 6. Login as Admin & Verify Reports
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const adminData = await adminLoginRes.json();
  assert(adminData.success && adminData.user.role === 'admin', 'Admin login must succeed');

  const reportRes = await fetch('http://localhost:5000/api/reports/sales?period=daily', {
    headers: { Authorization: `Bearer ${adminData.token}` },
  });
  const reportData = await reportRes.json();
  assert(reportData.success, 'Sales report must be generated');
  console.log(`✓ Admin Sales Report verified: Total Revenue: $${reportData.summary.totalRevenue}, Net Profit: $${reportData.summary.netProfit}`);

  console.log('--- ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

runE2ETest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
