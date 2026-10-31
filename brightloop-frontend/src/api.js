// src/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Auto logout on token expiration
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null; 
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Something went wrong');
    error.status = response.status;
    error.code = data?.code || 'UNKNOWN_ERROR';
    error.fields = data?.fields || {}; 
    throw error;
  }

  return data; 
}

// ==========================================
// OBJECT NAMESPACES (Kept for compatibility)
// ==========================================
export const auth = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  me: () => request('/auth/me'),
};

export const staff = {
  list: (params) => request(`/staff${buildQuery(params)}`),
  create: (data) => request('/staff', { method: 'POST', body: data }),
};

export const customers = {
  list: (params) => request(`/customers${buildQuery(params)}`),
  create: (data) => request('/customers', { method: 'POST', body: data }),
};

export const products = {
  list: (params) => request(`/products${buildQuery(params)}`),
  create: (data) => request('/products', { method: 'POST', body: data }),
};

export const plans = {
  list: (params) => request(`/plans${buildQuery(params)}`),
  create: (data) => request('/plans', { method: 'POST', body: data }),
};

export const taxes = {
  list: (params) => request(`/taxes${buildQuery(params)}`),
};

export const discounts = {
  list: (params) => request(`/discounts${buildQuery(params)}`),
  create: (data) => request('/discounts', { method: 'POST', body: data }),
};

export const templates = {
  list: (params) => request(`/templates${buildQuery(params)}`),
};

export const subscriptions = {
  list: (params) => request(`/subscriptions${buildQuery(params)}`),
  get: (id) => request(`/subscriptions/${id}`),
  create: (data) => request('/subscriptions', { method: 'POST', body: data }),
  updateStatus: (id, status) => request(`/subscriptions/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const invoices = {
  list: (params) => request(`/invoices${buildQuery(params)}`),
  get: (id) => request(`/invoices/${id}`),
  updateStatus: (id, status) => request(`/invoices/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const payments = {
  list: (params) => request(`/payments${buildQuery(params)}`),
  create: (data) => request('/payments', { method: 'POST', body: data }),
};

// ==========================================
// FLAT FUNCTIONS (Bridging UI Components)
// ==========================================
export const fetchProducts = (params) => request(`/products${buildQuery(params)}`);
export const saveProduct = (data) => request(data.id ? `/products/${data.id}` : '/products', { method: data.id ? 'PUT' : 'POST', body: data });

export const getPlans = (params) => request(`/plans${buildQuery(params)}`);
export const createPlan = (data) => request('/plans', { method: 'POST', body: data });

export const getPayments = (params) => request(`/payments${buildQuery(params)}`);
export const recordPayment = (data) => request('/payments', { method: 'POST', body: data });

export const changeSubscriptionStatus = (id, data) => request(`/subscriptions/${id}/status`, { method: 'PATCH', body: data });

// Reports for Dashboard
export const getSummary = (params) => request(`/reports/summary${buildQuery(params)}`);
export const getRevenue = (params) => request(`/reports/revenue${buildQuery(params)}`);
export const getOverdue = (params) => request(`/reports/overdue${buildQuery(params)}`);

// Portal (Customer-facing endpoints)
export const getPortalSubscriptions = (params) => request(`/portal/subscriptions${buildQuery(params)}`);
export const getPortalSubscription = (id) => request(`/portal/subscriptions/${id}`);
export const getPortalInvoices = (params) => request(`/portal/invoices${buildQuery(params)}`);

// Custom Blob function specifically for PDF downloads
export const downloadPortalInvoice = async (id) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/portal/invoices/${id}/download`, { headers });
  if (!response.ok) throw new Error('Failed to download invoice');
  return response.blob(); 
};
