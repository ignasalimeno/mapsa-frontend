import axios from 'axios'

const API_BASE_URL = (typeof window !== 'undefined' && window.__ENV?.VITE_API_URL)
  || import.meta.env.VITE_API_URL
  || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Customers
export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

// Vehicles
export const vehicleService = {
  getAll: (customerId) => api.get('/vehicles', { params: { customer_id: customerId } }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
}

// Items
export const itemService = {
  getAll: (type) => api.get('/items', { params: { type } }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getUsage: (id, startDate, endDate) => api.get(`/items/${id}/usage`, { params: { start_date: startDate, end_date: endDate } }),
  createWithdrawal: (id, data) => api.post(`/items/${id}/withdrawals`, data),
  bulkUpdatePrices: (data) => api.post('/items/bulk/update-prices', data),
}

// Work Orders
export const workOrderService = {
  getAll: (filters) => api.get('/work-orders', { params: filters }),
  getById: (id) => api.get(`/work-orders/${id}`),
  getItems: (id) => api.get(`/work-orders/${id}/items`),
  create: (data) => api.post('/work-orders', data),
  createComplete: (data) => api.post('/work-orders/complete', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  addItem: (id, data) => api.post(`/work-orders/${id}/items`, data),
  updateItem: (workOrderId, itemId, data) => api.put(`/work-orders/${workOrderId}/items/${itemId}`, data),
  deleteItem: (workOrderId, itemId) => api.delete(`/work-orders/${workOrderId}/items/${itemId}`),
  replaceItems: (id, items) => api.put(`/work-orders/${id}/items/replace`, { items }),
  generateDeliveryNote: (id) => api.post(`/work-orders/${id}/delivery-note`),
  generateInvoice: (id) => api.post(`/work-orders/${id}/invoice`),
}

// Documents
export const documentService = {
  getById: (id) => api.get(`/documents/${id}`),
  getByCustomer: (customerId) => api.get(`/documents/customer/${customerId}`),
  createFromWorkOrder: (workOrderId, data) => api.post(`/documents/work-order/${workOrderId}`, data),
}

// Account
export const accountService = {
  getCustomerAccount: (customerId) => api.get(`/account/customer/${customerId}`),
  createMovement: (customerId, data) => api.post(`/account/customer/${customerId}/movements`, data),
  listCustomerInvoices(customerId) {
    return api.get(`/customers/${customerId}/invoices`)
  },
  createCustomerPayment(customerId, payload) {
    return api.post(`/customers/${customerId}/payments`, payload)
  }
}

// Billing
export const invoiceService = {
  createFromWorkOrder: (workOrderId, data) => api.post(`/invoices/from-work-order/${workOrderId}`, data),
  uploadAttachment: (invoiceId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/invoices/${invoiceId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listAttachments: (invoiceId) => api.get(`/invoices/${invoiceId}/attachments`),
}

export const paymentService = {
  register: (payload) => api.post('/payments', payload),
}

export const deliveryNoteService = {
  createFromWorkOrder: (workOrderId, data) => api.post(`/delivery-notes/from-work-order/${workOrderId}`, data),
}

// Tags
export const tagService = {
  getAll: () => api.get('/tags'),
  getById: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
  getItems: (id) => api.get(`/tags/${id}/items`),
  assignToItem: (itemId, tagId) => api.post(`/items/${itemId}/tags/${tagId}`),
  removeFromItem: (itemId, tagId) => api.delete(`/items/${itemId}/tags/${tagId}`),
  getItemTags: (itemId) => api.get(`/items/${itemId}/tags`),
  bulkUpdatePrices: (tagId, data) => api.post(`/tags/${tagId}/update-prices`, data),
}

// Warehouses
export const warehouseService = {
  getAll: (activeOnly = false) => api.get('/warehouses', { params: { active_only: activeOnly } }),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  getStock: (id) => api.get(`/warehouses/${id}/stock`),
}

// Stock
export const stockService = {
  getTotal: () => api.get('/stock'),
  getByItem: (itemId) => api.get(`/stock/items/${itemId}`),
  getByWarehouse: (warehouseId) => api.get(`/stock/warehouses/${warehouseId}`),
  transfer: (data) => api.post('/stock/transfer', data),
  adjust: (data) => api.post('/stock/adjust', data),
  consume: (data) => api.post('/stock/consume', data),
  getMovements: (params) => api.get('/stock/movements', { params }),
}

export default api