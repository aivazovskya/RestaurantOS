const API_BASE = 'http://localhost:3001/api/v1';

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE}/organization/dashboard-summary`);
  return await res.json();
}

export async function fetchBalances() {
  const res = await fetch(`${API_BASE}/warehouse/balances`);
  return await res.json();
}

export async function fetchIngredients() {
  const res = await fetch(`${API_BASE}/warehouse/ingredients`);
  return await res.json();
}

export async function createIngredient(data: any) {
  const res = await fetch(`${API_BASE}/warehouse/ingredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function addStockReceipt(data: any) {
  const res = await fetch(`${API_BASE}/warehouse/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function addManualWriteOff(data: any) {
  const res = await fetch(`${API_BASE}/warehouse/write-offs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function fetchMenuItems() {
  const res = await fetch(`${API_BASE}/menu/items`);
  return await res.json();
}

export async function fetchMovements() {
  const res = await fetch(`${API_BASE}/warehouse/movements`);
  return await res.json();
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE}/warehouse/incidents`);
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
  const res = await fetch(`${API_BASE}/menu/stop-list`);
  return await res.json();
}

export async function fetchStopListHistory() {
  const res = await fetch(`${API_BASE}/menu/stop-list/history`);
  return await res.json();
}

export async function setManualStop(menuItemId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/menu/items/${menuItemId}/manual-stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return await res.json();
}

export async function restoreManualStop(menuItemId: string) {
  const res = await fetch(`${API_BASE}/menu/items/${menuItemId}/manual-restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}

/* Phase 2: Table & QR-Menu APIs */
export async function fetchTables() {
  const res = await fetch(`${API_BASE}/tables`);
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
  const res = await fetch(url);
  return await res.json();
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.message || 'Ошибка обновления статуса');
  }
  return await res.json();
}
