import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getColors = () => {
        switch (type) {
            case 'success': return { bg: 'rgba(16, 185, 129, 0.95)', icon: '✅' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.95)', icon: '❌' };
            case 'warning': return { bg: 'rgba(245, 158, 11, 0.95)', icon: '⚠️' };
            case 'info': return { bg: 'rgba(59, 130, 246, 0.95)', icon: 'ℹ️' };
            default: return { bg: 'rgba(30, 41, 59, 0.95)', icon: '🔔' };
        }
    };

    const { bg, icon } = getColors();

    return (
        <div style={{
            background: bg,
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            pointerEvents: 'auto',
            animation: isLeaving ? 'fadeOutDown 0.3s ease-in forwards' : 'fadeInUp 0.3s ease-out forwards',
            maxWidth: '400px',
            minWidth: '300px',
            marginBottom: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            <span style={{ flex: 1, fontWeight: '500', fontSize: '0.875rem' }}>{message}</span>
            <button
                onClick={() => {
                    setIsLeaving(true);
                    setTimeout(onClose, 300);
                }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px'
                }}
            >✕</button>
        </div>
    );
};

