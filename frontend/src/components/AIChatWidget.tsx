import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  RefreshCw,
  TrendingUp,
  Award,
  Package,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { sendAiChatMessage } from '../services/api';

interface Message {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  data?: any;
  toolsCalled?: string[];
  timestamp: Date;
}

interface AIChatWidgetProps {
  onClose: () => void;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'AI',
      text: 'Здравствуйте! Я ваш AI-ассистент по аналитике **Restaurant OS**.\n\nЯ напрямую запрашиваю детерминированные сервисы аналитики и готов ответить на любые вопросы о продажах, складе, курьерах и аномалиях.',
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (customQuery?: string) => {
    const query = customQuery || inputMessage;
    if (!query.trim() || isSending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputMessage('');
    setIsSending(true);

    try {
      const res = await sendAiChatMessage(query);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: res.replyText,
        data: res.data,
        toolsCalled: res.toolsCalled,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'AI',
        text: `⚠️ Ошибка взаимодействия с аналитическим модулем: ${e.message || 'Не удалось получить данные'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    { text: 'Какая выручка за прошлую неделю?', icon: TrendingUp },
    { text: 'Какие блюда продаются лучше всего?', icon: Award },
    { text: 'Когда закончится фарш и что докупить?', icon: Package },
    { text: 'Есть ли подозрительные списания?', icon: ShieldAlert },
    { text: 'Покажи сбои склада и стоп-листы', icon: AlertTriangle },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '560px', background: '#090d14', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#121824', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--color-signal-blue)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>AI-Помощник Владельца</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: 600 }}>● Function Calling SQL Engine</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Prompts Chips */}
        <div style={{ padding: '12px 16px', background: '#0d121c', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {quickPrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#e2e8f0',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon size={13} color="var(--color-signal-blue)" /> {p.text}
              </button>
            );
          })}
        </div>

        {/* Message History Window */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '10px',
                flexDirection: msg.sender === 'USER' ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: msg.sender === 'USER' ? 'var(--color-signal-blue)' : '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {msg.sender === 'USER' ? <User size={16} color="#fff" /> : <Bot size={16} color="#38bdf8" />}
              </div>

              <div
                style={{
                  background: msg.sender === 'USER' ? 'var(--color-signal-blue)' : '#121824',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--color-border)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}

                {/* Render Tool Badges if executed */}
                {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {msg.toolsCalled.map((tool, idx) => (
                      <span key={idx} className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                        ⚙️ Tool: {tool}()
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-twilight-blue)', fontSize: '0.85rem' }}>
              <RefreshCw size={14} className="spin" /> Запрос к аналитическому движку...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ padding: '16px', background: '#121824', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            placeholder="Спросите AI-ассистента о ресторанах, складе или выручке..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{ flex: 1, padding: '12px 14px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }} disabled={isSending}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
