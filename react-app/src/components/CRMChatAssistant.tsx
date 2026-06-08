import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { XIcon, SendIcon, SparklesIcon, UserIcon, ClockIcon } from '../icons';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const CRMChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your CRM AI Assistant. How can I help you today? You can ask me about candidates, tasks, or system stats.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await api.askAssistant(userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response.data?.answer || response.answer || '' }]);
        } catch (error) {
            showToast('Failed to get AI response', 'error');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Show top candidates for React",
        "Which tasks are overdue?",
        "How many candidates applied today?",
        "Summary of open jobs"
    ];

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="floating-chat-btn"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '85px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <SparklesIcon size={28} />
            </button>
        );
    }

    return (
        <div 
            className="chat-assistant-window glass-card"
            style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                width: '400px',
                height: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1001,
                padding: 0,
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.3s ease-out'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                        <SparklesIcon size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>CRM AI Assistant</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                            Online & Ready
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                >
                    <XIcon size={24} />
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'rgba(255,255,255,0.02)'
            }}>
                {messages.map((m, i) => (
                    <div 
                        key={i} 
                        style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                            gap: '0.4rem'
                        }}
                    >
                        <div style={{
                            padding: '1rem',
                            borderRadius: m.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                            background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'var(--glass)',
                            color: m.role === 'user' ? 'white' : 'var(--text-main)',
                            fontSize: '0.925rem',
                            lineHeight: '1.5',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {m.content}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {m.role === 'user' ? <UserIcon size={10} /> : <SparklesIcon size={10} />}
                            {m.role === 'user' ? 'You' : 'AI Assistant'}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinning" style={{ animation: 'spin 1s linear infinite' }}>
                            <ClockIcon size={16} />
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length === 1 && !loading && (
                <div style={{ padding: '0 1.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setInput(s);
                                handleSend();
                            }}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '1rem',
                                border: '1px solid #6366f1',
                                background: 'transparent',
                                color: '#6366f1',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #a855f7)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6366f1';
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <form 
                onSubmit={handleSend}
                style={{
                    padding: '1.25rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '0.75rem',
                    background: 'var(--bg-card)'
                }}
            >
                <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    style={{
                        flex: 1,
                        padding: '0.75rem 1.25rem',
                        borderRadius: '2rem',
                        border: '1px solid var(--border)',
                        background: 'var(--glass)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.925rem'
                    }}
                    disabled={loading}
                />
                <button 
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        opacity: (loading || !input.trim()) ? 0.6 : 1
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <SendIcon size={20} />
                </button>
            </form>
        </div>
    );
};

export default CRMChatAssistant;
