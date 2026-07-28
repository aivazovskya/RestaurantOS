import React, { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, Search, AlertCircle } from 'lucide-react';
import { createIngredient, addStockReceipt, addManualWriteOff } from '../services/api';

interface WarehouseViewProps {
  balances: any[];
  onRefresh: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ balances, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);

  // Form States
  const [newIng, setNewIng] = useState({
    name: '',
    category: 'GROCERY',
    mainUnit: 'KG',
    costPerUnit: 1000,
    minStockLevel: 5,
    lossPercentage: 0,
    initialStock: 10,
  });

  const [receiptForm, setReceiptForm] = useState({
    ingredientId: '',
    quantity: 5,
    unitCost: 1000,
    invoiceNumber: '',
  });

  const [writeOffForm, setWriteOffForm] = useState({
    ingredientId: '',
    quantity: 1,
    reason: 'Порча / истек срок',
  });

  const filteredBalances = balances.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIngredient(newIng);
    setIsAddModalOpen(false);
    onRefresh();
  };

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    await addStockReceipt({
      invoiceNumber: receiptForm.invoiceNumber || `INV-${Date.now()}`,
      items: [
        {
          ingredientId: receiptForm.ingredientId || balances[0]?.ingredientId,
          quantity: Number(receiptForm.quantity),
          unitCost: Number(receiptForm.unitCost),
        },
      ],
    });
    setIsReceiptModalOpen(false);
    onRefresh();
  };

  const handleWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    await addManualWriteOff({
      reason: writeOffForm.reason,
      items: [
        {
          ingredientId: writeOffForm.ingredientId || balances[0]?.ingredientId,
          quantity: Number(writeOffForm.quantity),
        },
      ],
    });
    setIsWriteOffModalOpen(false);
    onRefresh();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Склад и Остатки</h1>
          <p className="page-subtitle">Управление запасами сырья, приходами и списаниями</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsWriteOffModalOpen(true)}>
            <ArrowDownLeft size={16} />
            Списание
          </button>
          <button className="btn btn-secondary" onClick={() => setIsReceiptModalOpen(true)}>
            <ArrowUpRight size={16} />
            Приход
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Добавить сырье
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Поиск по названию сырья или артикулу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: '200px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="ALL">Все категории</option>
          <option value="MEAT">Мясо и Птица</option>
          <option value="VEGETABLES">Овощи и Фрукты</option>
          <option value="DAIRY">Молочные продукты</option>
          <option value="GROCERY">Бакалея и Соусы</option>
          <option value="BEVERAGES">Напитки и Бар</option>
        </select>
      </div>

      {/* Stock Balance Table */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Наименование сырья</th>
                <th>Категория</th>
                <th>Текущий остаток</th>
                <th>Мин. порог</th>
                <th>Себестоимость</th>
                <th>Сумма в запасах</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    {b.code || 'ING-000'}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {b.name}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px' }}>
                      {b.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    <span style={{ color: b.isNegative ? '#f87171' : b.isLowStock ? '#fbbf24' : '#fff' }}>
                      {b.quantity} {b.unit}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {b.minStockLevel} {b.unit}
                  </td>
                  <td>{b.costPerUnit?.toLocaleString('ru-RU')} ₸ / {b.unit}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {b.totalCost?.toLocaleString('ru-RU')} ₸
                  </td>
                  <td>
                    {b.isNegative ? (
                      <span className="badge badge-danger">
                        <AlertCircle size={12} /> Отрицательный остаток
                      </span>
                    ) : b.isLowStock ? (
                      <span className="badge badge-warning">Низкий запас</span>
                    ) : (
                      <span className="badge badge-success">В норме</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Ingredient */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Добавить новое сырье</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateIngredient}>
              <div className="form-group">
                <label className="form-label">Наименование сырья</label>
                <input required className="form-input" value={newIng.name} onChange={(e) => setNewIng({ ...newIng, name: e.target.value })} placeholder="Например, Соус Томатный" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select className="form-select" value={newIng.category} onChange={(e) => setNewIng({ ...newIng, category: e.target.value })}>
                    <option value="MEAT">Мясо и Птица</option>
                    <option value="VEGETABLES">Овощи и Фрукты</option>
                    <option value="DAIRY">Молочные продукты</option>
                    <option value="GROCERY">Бакалея и Соусы</option>
                    <option value="BEVERAGES">Напитки и Бар</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ед. измерения</label>
                  <select className="form-select" value={newIng.mainUnit} onChange={(e) => setNewIng({ ...newIng, mainUnit: e.target.value })}>
                    <option value="KG">Килограмм (KG)</option>
                    <option value="L">Литр (L)</option>
                    <option value="PCS">Штука (PCS)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Себестоимость (₸)</label>
                  <input type="number" className="form-input" value={newIng.costPerUnit} onChange={(e) => setNewIng({ ...newIng, costPerUnit: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Мин. запас</label>
                  <input type="number" className="form-input" value={newIng.minStockLevel} onChange={(e) => setNewIng({ ...newIng, minStockLevel: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить сырье</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receipt */}
      {isReceiptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Приход от поставщика</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setIsReceiptModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddReceipt}>
              <div className="form-group">
                <label className="form-label">Выберите позицию</label>
                <select className="form-select" value={receiptForm.ingredientId} onChange={(e) => setReceiptForm({ ...receiptForm, ingredientId: e.target.value })}>
                  {balances.map((b) => (
                    <option key={b.ingredientId} value={b.ingredientId}>{b.name} ({b.unit})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Количество прихода</label>
                  <input type="number" step="0.1" className="form-input" value={receiptForm.quantity} onChange={(e) => setReceiptForm({ ...receiptForm, quantity: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Цена за ед. (₸)</label>
                  <input type="number" className="form-input" value={receiptForm.unitCost} onChange={(e) => setReceiptForm({ ...receiptForm, unitCost: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Номер накладной</label>
                <input className="form-input" value={receiptForm.invoiceNumber} onChange={(e) => setReceiptForm({ ...receiptForm, invoiceNumber: e.target.value })} placeholder="Например, ТТН-4921" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReceiptModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Провести приход</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Write Off */}
      {isWriteOffModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Ручное списание сырья</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setIsWriteOffModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleWriteOff}>
              <div className="form-group">
                <label className="form-label">Выберите сырье</label>
                <select className="form-select" value={writeOffForm.ingredientId} onChange={(e) => setWriteOffForm({ ...writeOffForm, ingredientId: e.target.value })}>
                  {balances.map((b) => (
                    <option key={b.ingredientId} value={b.ingredientId}>{b.name} (Доступно: {b.quantity} {b.unit})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Списываемое количество</label>
                <input type="number" step="0.1" className="form-input" value={writeOffForm.quantity} onChange={(e) => setWriteOffForm({ ...writeOffForm, quantity: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Причина списания</label>
                <input className="form-input" value={writeOffForm.reason} onChange={(e) => setWriteOffForm({ ...writeOffForm, reason: e.target.value })} placeholder="Бракераж / просрочка / пролито" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsWriteOffModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-danger">Списать со склада</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
