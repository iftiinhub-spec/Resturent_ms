const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5000'
  ? '/api'
  : 'http://localhost:5000/api';

// Helper for making API requests with offline token handling
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('pos_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Token expired or invalid
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.reload();
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to local backend. Ensure Node server is running on port 5000.');
    }
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),
  updatePassword: (currentPassword, newPassword) => request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Menu & Inventory
  getMenu: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/menu${qs ? `?${qs}` : ''}`);
  },
  createMenuItem: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAvailability: (id) => request(`/menu/${id}/toggle-availability`, { method: 'PATCH' }),
  adjustStock: (id, adjustment, newQuantity) => request(`/menu/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ adjustment, newQuantity }) }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),

  // Tables
  getTables: () => request('/tables'),
  createTable: (data) => request('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateTable: (id, data) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTableStatus: (id, status, currentOrder) => request(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, currentOrder }) }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  payOrder: (id, amountPaid, paymentMethod = 'Cash') => request(`/orders/${id}/pay`, { method: 'PUT', body: JSON.stringify({ amountPaid, paymentMethod }) }),
  cancelOrder: (id, cancellationReason) => request(`/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ cancellationReason }) }),

  // Users (Admin only)
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id, newPassword) => request(`/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Reports (Admin & basic dashboard)
  getDashboardData: () => request('/reports/dashboard'),
  getSalesReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/sales${qs ? `?${qs}` : ''}`);
  },
  getCashierReport: () => request('/reports/cashiers'),
  getTopItemsReport: () => request('/reports/top-items'),
  getCancelledReport: () => request('/reports/cancelled'),
};
