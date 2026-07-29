export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
export const WS_BASE = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') : 'http://localhost:3001');

let currentToken: string | null = localStorage.getItem('restaurantos_access_token');

export function setAuthToken(token: string | null) {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
}

async function authFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth_unauthorized'));
  }
  return res;
}

/* Authentication APIs */
export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка входа в систему');
  }
  return await res.json();
}

export async function courierLoginApi(phone: string, pinCode: string) {
  const res = await fetch(`${API_BASE}/auth/courier-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pinCode }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка входа для курьера');
  }
  return await res.json();
}

export async function getMeApi() {
  const res = await authFetch(`${API_BASE}/auth/me`);
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка получения профиля');
  }
  return await res.json();
}

export async function refreshApi(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка обновления токена');
  }
  return await res.json();
}

/* Core Dashboard & Warehouse APIs */
export async function fetchDashboardSummary() {
  const res = await authFetch(`${API_BASE}/organization/dashboard-summary`);
  return await res.json();
}

export async function fetchBalances() {
  const res = await authFetch(`${API_BASE}/warehouse/balances`);
  return await res.json();
}

export async function fetchIngredients() {
  const res = await authFetch(`${API_BASE}/warehouse/ingredients`);
  return await res.json();
}

export async function createIngredient(data: any) {
  const res = await authFetch(`${API_BASE}/warehouse/ingredients`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Ошибка создания ингредиента');
  }
  return await res.json();
}

export async function addStockReceipt(data: any) {
  const res = await authFetch(`${API_BASE}/warehouse/receipts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Ошибка оприходования');
  }
  return await res.json();
}

export async function addManualWriteOff(data: any) {
  const res = await authFetch(`${API_BASE}/warehouse/write-offs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Ошибка списания');
  }
  return await res.json();
}

export async function fetchMenuItems() {
  const res = await authFetch(`${API_BASE}/menu/items`);
  return await res.json();
}

export async function fetchMovements() {
  const res = await authFetch(`${API_BASE}/warehouse/movements`);
  return await res.json();
}

export async function fetchIncidents() {
  const res = await authFetch(`${API_BASE}/warehouse/incidents`);
  return await res.json();
}

export async function simulateNexiumReceipt(receiptData: any) {
  const res = await fetch(`${API_BASE}/nexium/simulate-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receiptData),
  });
  return await res.json();
}

/* Stop-List APIs */
export async function fetchStopList() {
  const res = await authFetch(`${API_BASE}/menu/stop-list`);
  return await res.json();
}

export async function fetchStopListHistory() {
  const res = await authFetch(`${API_BASE}/menu/stop-list/history`);
  return await res.json();
}

export async function setManualStop(menuItemId: string, reason?: string) {
  const res = await authFetch(`${API_BASE}/menu/items/${menuItemId}/manual-stop`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Ошибка внесения в стоп-лист');
  }
  return await res.json();
}

export async function restoreManualStop(menuItemId: string) {
  const res = await authFetch(`${API_BASE}/menu/items/${menuItemId}/manual-restore`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Ошибка возобновления позиции');
  }
  return await res.json();
}

/* Phase 2: Table & QR-Menu APIs */
export async function fetchTables() {
  const res = await authFetch(`${API_BASE}/tables`);
  return await res.json();
}

export async function fetchPublicMenu(qrSlug: string) {
  const res = await fetch(`${API_BASE}/public/menu/${qrSlug}`);
  return await res.json();
}

export async function callWaiter(qrSlug: string) {
  const res = await fetch(`${API_BASE}/public/tables/${qrSlug}/call-waiter`, {
    method: 'POST',
  });
  return await res.json();
}

/* Phase 2: Orders & KDS APIs */
export async function createPublicOrder(data: any) {
  const res = await fetch(`${API_BASE}/public/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка создания заказа');
  }
  return await res.json();
}

export async function fetchOrders(status?: string) {
  const url = status ? `${API_BASE}/orders?status=${status}` : `${API_BASE}/orders`;
  const res = await authFetch(url);
  return await res.json();
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка обновления статуса');
  }
  return await res.json();
}

/* Phase 3: CRM & Loyalty APIs */
export async function fetchCustomers(search?: string) {
  const url = search ? `${API_BASE}/customers?search=${encodeURIComponent(search)}` : `${API_BASE}/customers`;
  const res = await authFetch(url);
  return await res.json();
}

export async function fetchCustomerById(id: string) {
  const res = await authFetch(`${API_BASE}/customers/${id}`);
  return await res.json();
}

export async function findOrCreateCustomerByPhone(phone: string, name?: string) {
  const res = await authFetch(`${API_BASE}/customers/by-phone`, {
    method: 'POST',
    body: JSON.stringify({ phone, name }),
  });
  return await res.json();
}

export async function fetchLoyaltyHistory(customerId: string) {
  const res = await authFetch(`${API_BASE}/customers/${customerId}/loyalty/history`);
  return await res.json();
}

export async function adjustLoyaltyPoints(customerId: string, points: number, comment: string) {
  const res = await authFetch(`${API_BASE}/customers/${customerId}/loyalty/adjust`, {
    method: 'POST',
    body: JSON.stringify({ points, comment }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка корректировки баллов');
  }
  return await res.json();
}

/* Phase 3: Coupon APIs */
export async function fetchCoupons() {
  const res = await authFetch(`${API_BASE}/coupons`);
  return await res.json();
}

export async function createCoupon(data: { code: string; discountType: string; discountValue: number; customerId?: string; expiresAt?: string }) {
  const res = await authFetch(`${API_BASE}/coupons`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка создания купона');
  }
  return await res.json();
}

export async function validateCoupon(code: string, totalAmount: number, customerId?: string) {
  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, totalAmount, customerId }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Купон недействителен');
  }
  return await res.json();
}

/* Phase 3: Notification Log APIs */
export async function fetchNotificationLogs() {
  const res = await authFetch(`${API_BASE}/notifications/logs`);
  return await res.json();
}

/* Phase 4: Courier & Delivery APIs */
export async function fetchCouriers(branchId?: string, status?: string) {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);
  if (status) params.append('status', status);

  const res = await authFetch(`${API_BASE}/couriers?${params.toString()}`);
  return await res.json();
}

export async function fetchCourierById(id: string) {
  const res = await authFetch(`${API_BASE}/couriers/${id}`);
  return await res.json();
}

export async function createCourier(data: { name: string; phone: string; vehicleType: string; pinCode?: string }) {
  const res = await authFetch(`${API_BASE}/couriers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка создания курьера');
  }
  return await res.json();
}

export async function resetCourierPin(id: string, pinCode?: string) {
  const res = await authFetch(`${API_BASE}/couriers/${id}/reset-pin`, {
    method: 'POST',
    body: JSON.stringify({ pinCode }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка сброса PIN-кода курьера');
  }
  return await res.json();
}

export async function updateCourierStatus(id: string, status: 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY') {
  const res = await authFetch(`${API_BASE}/couriers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка изменения статуса курьера');
  }
  return await res.json();
}

export async function assignCourierToOrder(orderId: string, courierId: string) {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/assign-courier`, {
    method: 'POST',
    body: JSON.stringify({ courierId }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка назначения курьера');
  }
  return await res.json();
}

export async function updateDeliveryStatus(orderId: string, status: string, failureReason?: string) {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/delivery-status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, failureReason }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка обновления статуса доставки');
  }
  return await res.json();
}

/* Phase 5: Analytics & AI Module APIs */
export async function fetchRevenueAnalytics(from?: string, to?: string, groupBy: string = 'day') {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('groupBy', groupBy);

  const res = await authFetch(`${API_BASE}/analytics/revenue?${params.toString()}`);
  return await res.json();
}

export async function fetchTopItemsAnalytics(from?: string, to?: string, limit: number = 10) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('limit', String(limit));

  const res = await authFetch(`${API_BASE}/analytics/top-items?${params.toString()}`);
  return await res.json();
}

export async function fetchStockIncidentsAnalytics(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await authFetch(`${API_BASE}/analytics/stock-incidents?${params.toString()}`);
  return await res.json();
}

export async function fetchStopListFrequencyAnalytics(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await authFetch(`${API_BASE}/analytics/stoplist-frequency?${params.toString()}`);
  return await res.json();
}

export async function fetchPurchaseForecast(branchId?: string, days: number = 14) {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);
  params.append('days', String(days));

  const res = await authFetch(`${API_BASE}/analytics/purchase-forecast?${params.toString()}`);
  return await res.json();
}

export async function fetchFlaggedOperations(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await authFetch(`${API_BASE}/analytics/flagged-operations?${params.toString()}`);
  return await res.json();
}

export async function sendAiChatMessage(message: string, sessionId?: string) {
  const res = await authFetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка обработки AI-сообщения');
  }
  return await res.json();
}
