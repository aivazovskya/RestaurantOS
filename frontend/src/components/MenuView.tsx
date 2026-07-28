import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface MenuViewProps {
  menuItems: any[];
}

export const MenuView: React.FC<MenuViewProps> = ({ menuItems }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Меню и Технологические карты</h1>
          <p className="page-subtitle">Рецептуры блюд, расчет себестоимости и Food Cost %</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {menuItems.map((dish) => {
          const isExpanded = expandedId === dish.id;
          const recipeItems = dish.recipeCard?.items || [];

          return (
            <div key={dish.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {dish.imageUrl && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                    <img src={dish.imageUrl} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{dish.name}</h3>
                  <span className="badge badge-info">{dish.category}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {dish.description || 'Без описания'}
                </p>

                {/* Price & Cost Summary */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Цена</span>
                    <div style={{ fontWeight: 800, color: '#fff' }}>{dish.sellingPrice?.toLocaleString('ru-RU')} ₸</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Себестоимость</span>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{dish.calculatedPrimeCost?.toLocaleString('ru-RU')} ₸</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Food Cost</span>
                    <div style={{ fontWeight: 800, color: dish.foodCostPercent > 35 ? '#f87171' : '#34d399' }}>
                      {dish.foodCostPercent}%
                    </div>
                  </div>
                </div>

                {/* POS Item Mapping */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px', fontFamily: 'var(--font-code)' }}>
                  Nexium POS ID: {dish.posItemId}
                </div>
              </div>

              {/* Accordion Toggle for Recipe Card */}
              <div>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem' }}
                  onClick={() => toggleExpand(dish.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> Техкарта ({recipeItems.length} ингредиентов)
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Ингредиент</th>
                          <th>Брутто (Склад)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipeItems.map((ri: any) => (
                          <tr key={ri.id}>
                            <td style={{ fontWeight: 600 }}>{ri.ingredient?.name}</td>
                            <td style={{ fontFamily: 'var(--font-code)', color: 'var(--primary)' }}>
                              {ri.grossAmount} {ri.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
