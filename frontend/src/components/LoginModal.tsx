import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, courierLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'courier'>('staff');

  // Staff login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Courier login state
  const [phone, setPhone] = useState('+77071112233');
  const [pinCode, setPinCode] = useState('1234');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await courierLogin(phone, pinCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа для курьера');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetSelect = (presetEmail: string, presetRole: string) => {
    if (presetRole === 'COURIER') {
      setActiveTab('courier');
      setPhone('+77071112233');
      setPinCode('1234');
    } else {
      setActiveTab('staff');
      setEmail(presetEmail);
      setPassword('password123');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 14, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '460px',
        background: '#121824',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>🔐 Авторизация Restaurant OS</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-twilight-blue)', fontSize: '0.85rem' }}>
              Вход и Role-Based Access Control (RBAC)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-twilight-blue)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: '#090d14',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'staff' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: activeTab === 'staff' ? '#fff' : 'var(--color-twilight-blue)',
              fontWeight: activeTab === 'staff' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            👨‍💼 Сотрудник (Email)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('courier'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'courier' ? 'var(--color-primary, #3b82f6)' : 'transparent',
              color: activeTab === 'courier' ? '#fff' : 'var(--color-twilight-blue)',
              fontWeight: activeTab === 'courier' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            🛵 Курьер (PIN)
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Staff Login Form */}
        {activeTab === 'staff' && (
          <form onSubmit={handleStaffSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--color-twilight-blue)', fontSize: '0.85rem', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurantos.demo"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090d14',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--color-twilight-blue)', fontSize: '0.85rem', marginBottom: '6px' }}>
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090d14',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {isSubmitting ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        )}

        {/* Courier Login Form */}
        {activeTab === 'courier' && (
          <form onSubmit={handleCourierSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--color-twilight-blue)', fontSize: '0.85rem', marginBottom: '6px' }}>
                Номер телефона
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+77071112233"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090d14',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--color-twilight-blue)', fontSize: '0.85rem', marginBottom: '6px' }}>
                PIN-код курьера
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="1234"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090d14',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1.2rem',
                  letterSpacing: '4px',
                  textAlign: 'center',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {isSubmitting ? 'Проверка PIN...' : 'Войти как курьер'}
            </button>
          </form>
        )}

        {/* Quick Demo Switcher */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', marginBottom: '8px' }}>
            Быстрый вход для тестирования RBAC (демо-аккаунты):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className="badge"
              onClick={() => handlePresetSelect('owner@restaurantos.demo', 'OWNER')}
              style={{ background: '#3b82f620', border: '1px solid #3b82f6', color: '#60a5fa', cursor: 'pointer' }}
            >
              👑 OWNER
            </button>
            <button
              type="button"
              className="badge"
              onClick={() => handlePresetSelect('manager@restaurantos.demo', 'MANAGER')}
              style={{ background: '#10b98120', border: '1px solid #10b981', color: '#34d399', cursor: 'pointer' }}
            >
              💼 MANAGER
            </button>
            <button
              type="button"
              className="badge"
              onClick={() => handlePresetSelect('storekeeper@restaurantos.demo', 'STOREKEEPER')}
              style={{ background: '#f59e0b20', border: '1px solid #f59e0b', color: '#fbbf24', cursor: 'pointer' }}
            >
              📦 STOREKEEPER
            </button>
            <button
              type="button"
              className="badge"
              onClick={() => handlePresetSelect('chef@restaurantos.demo', 'CHEF')}
              style={{ background: '#ec489920', border: '1px solid #ec4899', color: '#f472b6', cursor: 'pointer' }}
            >
              👨‍🍳 CHEF
            </button>
            <button
              type="button"
              className="badge"
              onClick={() => handlePresetSelect('', 'COURIER')}
              style={{ background: '#8b5cf620', border: '1px solid #8b5cf6', color: '#a78bfa', cursor: 'pointer' }}
            >
              🛵 COURIER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
