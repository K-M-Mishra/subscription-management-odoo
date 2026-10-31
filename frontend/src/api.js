// src/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

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

async function apiFetch(endpoint, options = {}) {
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

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error occurred. Please check your connection.', {});
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return new Promise(() => {}); // Halt execution while browser redirects
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.code || 'ERROR',
      data?.message || `Request failed with status ${res.status}`,
      data?.fields || {}
    );
  }

  return data;
}

// ==========================================
// AUTH
// ==========================================
export const login = (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials });
export const getMe = () => apiFetch('/auth/me');

// ==========================================
// STAFF (Admin only)
// ==========================================
export const getStaffList = (params) => apiFetch(`/staff${buildQuery(params)}`);
export const getStaff = (id) => apiFetch(`/staff/${id}`);
export const createStaff = (data) => apiFetch('/staff', { method: 'POST', body: data });
export const updateStaff = (id, data) => apiFetch(`/staff/${id}`, { method: 'PUT', body: data });
export const deleteStaff = (id) => apiFetch(`/staff/${id}`, { method: 'DELETE' });

// ==========================================
// PRODUCTS & VARIANTS
// ==========================================
export const getProducts = (params) => apiFetch(`/products${buildQuery(params)}`);
export const getProduct = (id) => apiFetch(`/products/${id}`);
export const createProduct = (data) => apiFetch('/products', { method: 'POST', body: data });
export const updateProduct = (id, data) => apiFetch(`/products/${id}`, { method: 'PUT', body: data });
export const deleteProduct = (id) => apiFetch(`/products/${id}`, { method: 'DELETE' });

// ==========================================
// PLANS (Daily/Weekly/Monthly/Yearly)
// ==========================================
export const getPlans = (params) => apiFetch(`/plans${buildQuery(params)}`);
export const getPlan = (id) => apiFetch(`/plans/${id}`);
export const createPlan = (data) => apiFetch('/plans', { method: 'POST', body: data });
export const updatePlan = (id, data) => apiFetch(`/plans/${id}`, { method: 'PUT', body: data });
export const deletePlan = (id) => apiFetch(`/plans/${id}`, { method: 'DELETE' });

// ==========================================
// TAXES (Auto-calculated settings)
// ==========================================
export const getTaxes = (params) => apiFetch(`/taxes${buildQuery(params)}`);
export const getTax = (id) => apiFetch(`/taxes/${id}`);
export const createTax = (data) => apiFetch('/taxes', { method: 'POST', body: data });
export const updateTax = (id, data) => apiFetch(`/taxes/${id}`, { method: 'PUT', body: data });
export const deleteTax = (id) => apiFetch(`/taxes/${id}`, { method: 'DELETE' });

// ==========================================
// DISCOUNTS (Percent/Fixed, limits, scopes)
// ==========================================
export const getDiscounts = (params) => apiFetch(`/discounts${buildQuery(params)}`);
export const getDiscount = (id) => apiFetch(`/discounts/${id}`);
export const createDiscount = (data) => apiFetch('/discounts', { method: 'POST', body: data });
export const updateDiscount = (id, data) => apiFetch(`/discounts/${id}`, { method: 'PUT', body: data });
export const deleteDiscount = (id) => apiFetch(`/discounts/${id}`, { method: 'DELETE' });

// ==========================================
// TEMPLATES (Quotation templates)
// ==========================================
export const getTemplates = (params) => apiFetch(`/templates${buildQuery(params)}`);
export const getTemplate = (id) => apiFetch(`/templates/${id}`);
export const createTemplate = (data) => apiFetch('/templates', { method: 'POST', body: data });
export const updateTemplate = (id, data) => apiFetch(`/templates/${id}`, { method: 'PUT', body: data });
export const deleteTemplate = (id) => apiFetch(`/templates/${id}`, { method: 'DELETE' });

// ==========================================
// SUBSCRIPTIONS (Draft -> Quotation -> Confirmed -> Active -> Closed)
// ==========================================
export const getSubscriptions = (params) => apiFetch(`/subscriptions${buildQuery(params)}`);
export const getSubscription = (id) => apiFetch(`/subscriptions/${id}`);
export const createSubscription = (data) => apiFetch('/subscriptions', { method: 'POST', body: data });
export const updateSubscription = (id, data) => apiFetch(`/subscriptions/${id}`, { method: 'PUT', body: data });
export const changeSubscriptionStatus = (id, statusData) => apiFetch(`/subscriptions/${id}/status`, { method: 'PATCH', body: statusData });

// ==========================================
// BILLING (Cycles, Overviews)
// ==========================================
export const getBillingOverview = (params) => apiFetch(`/billing${buildQuery(params)}`);
export const triggerBillingCycle = (data) => apiFetch('/billing/trigger', { method: 'POST', body: data });

// ==========================================
// INVOICES (Draft -> Confirmed -> Paid / Cancelled)
// ==========================================
export const getInvoices = (params) => apiFetch(`/invoices${buildQuery(params)}`);
export const getInvoice = (id) => apiFetch(`/invoices/${id}`);
export const createInvoice = (data) => apiFetch('/invoices', { method: 'POST', body: data });
export const updateInvoice = (id, data) => apiFetch(`/invoices/${id}`, { method: 'PUT', body: data });
export const changeInvoiceStatus = (id, statusData) => apiFetch(`/invoices/${id}/status`, { method: 'PATCH', body: statusData });

// ==========================================
// PAYMENTS (Record method, amount, date, note)
// ==========================================
export const getPayments = (params) => apiFetch(`/payments${buildQuery(params)}`);
export const getPayment = (id) => apiFetch(`/payments/${id}`);
export const recordPayment = (data) => apiFetch('/payments', { method: 'POST', body: data });
export const updatePayment = (id, data) => apiFetch(`/payments/${id}`, { method: 'PUT', body: data });

// ==========================================
// CUSTOMERS
// ==========================================
export const getCustomers = (params) => apiFetch(`/customers${buildQuery(params)}`);
export const getCustomer = (id) => apiFetch(`/customers/${id}`);
export const createCustomer = (data) => apiFetch('/customers', { method: 'POST', body: data });
export const updateCustomer = (id, data) => apiFetch(`/customers/${id}`, { method: 'PUT', body: data });

// ==========================================
// REPORTS (Finance dashboard)
// ==========================================
export const getDashboardStats = (params) => apiFetch(`/reports/dashboard${buildQuery(params)}`);
export const getRevenueReport = (params) => apiFetch(`/reports/revenue${buildQuery(params)}`);

// ==========================================
// PORTAL (Customer-facing endpoints)
// ==========================================
export const getPortalSubscriptions = (params) => apiFetch(`/portal/subscriptions${buildQuery(params)}`);
export const getPortalSubscription = (id) => apiFetch(`/portal/subscriptions/${id}`);
export const getPortalInvoices = (params) => apiFetch(`/portal/invoices${buildQuery(params)}`);
export const getPortalInvoice = (id) => apiFetch(`/portal/invoices/${id}`);
export const downloadPortalInvoice = (id) => apiFetch(`/portal/invoices/${id}/download`);