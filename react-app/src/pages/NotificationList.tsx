import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { BellIcon, CheckCircleIcon, TrashIcon } from '../icons';

interface Notification {
    id: string; // Unified ID
    _id?: string; // MongoDB ID
    title: string;
    message: string;
    type: string;
    unread: boolean;
    createdAt: string | Date;
    path?: string;
    initials?: string;
    color?: string;
    isDb?: boolean;
    rawDate: Date;
}

const NotificationList = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
    const { showToast } = useToast();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const highlightedId = searchParams.get('id');
    const notificationRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch ONLY persistent notifications from DB
            // This ensures that "Mark Read" and "Clear All" are permanent and consistent.
            const dbNotifications = await api.getNotifications();

            const items: Notification[] = dbNotifications.map((n: any) => ({
                id: n._id,
                _id: n._id,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
                createdAt: n.createdAt,
                unread: !n.isRead,
                initials: n.title.charAt(0).toUpperCase(),
                color: n.type === 'task' ? '#10b981' : n.type === 'interview' ? '#38bdf8' : '#6366f1',
                path: n.path || '/',
                rawDate: new Date(n.createdAt),
                isDb: true
            }));

            // Sort by latest
            items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
            setNotifications(items);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            showToast('Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle initial scroll to highlighted notification
    useEffect(() => {
        if (!loading && highlightedId && notificationRefs.current.get(highlightedId)) {
            setTimeout(() => {
                notificationRefs.current.get(highlightedId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [loading, highlightedId]);

    const markAsRead = async (id: string) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            showToast('Notification cleared', 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast('Failed to clear notification', 'error');
        }
    };

    const clearAllNotifications = async () => {
        if (window.confirm('Clear all notifications? This cannot be undone.')) {
            try {
                await api.clearAllNotifications();
                setNotifications([]);
                showToast('All notifications cleared', 'success');
            } catch (error) {
                console.error('Error clearing notifications:', error);
                showToast('Failed to clear all notifications', 'error');
            }
        }
    };

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Tailoring your updates...</p>
        </div>
    );

    const filteredNotifications = activeTab === 'ALL' 
        ? notifications 
        : notifications.filter(n => n.unread);

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="fade-in" style={{ maxWidth: '850px', margin: '0 auto', padding: '0 1rem' }}>
            {/* Header Section */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem', 
                marginBottom: '2.5rem',
                padding: '1.5rem 0',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '1.25rem',
                            background: 'linear-gradient(135deg, var(--primary), #0ea5e9)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(0, 84, 141, 0.3)'
                        }}>
                            <BellIcon size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                                Notifications
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                Stay updated with your CRM activity
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="btn-secondary"
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--primary)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <CheckCircleIcon size={18} /> Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button 
                                onClick={clearAllNotifications}
                                className="btn-secondary"
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <TrashIcon size={18} /> Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs / Segmented Control */}
                <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-dark)',
                    padding: '0.35rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border)',
                    alignSelf: 'flex-start',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <button
                        onClick={() => setActiveTab('ALL')}
                        style={{
                            padding: '0.6rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'ALL' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'ALL' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === 'ALL' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                            minWidth: '100px'
                        }}
                    >
                        ALL
                    </button>
                    <button
                        onClick={() => setActiveTab('UNREAD')}
                        style={{
                            padding: '0.6rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'UNREAD' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'UNREAD' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: activeTab === 'UNREAD' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                            minWidth: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        UNREAD
                        {unreadCount > 0 && (
                            <span style={{ 
                                background: 'var(--primary)', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '6px', 
                                fontSize: '0.7rem' 
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>
                    {`
                        @keyframes pulseHighlight {
                            0% { box-shadow: 0 0 0 0px var(--primary); }
                            50% { box-shadow: 0 0 0 10px rgba(0, 84, 141, 0); }
                            100% { box-shadow: 0 0 0 0px var(--primary); }
                        }
                        .notification-highlight {
                            border: 2px solid var(--primary) !important;
                            animation: pulseHighlight 2s infinite !important;
                            background: rgba(0, 84, 141, 0.05) !important;
                            z-index: 10;
                        }
                    `}
                </style>
                {filteredNotifications.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: '2rem' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', 
                            background: 'var(--bg-dark)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', border: '1px solid var(--border)'
                        }}>
                            <BellIcon size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                        </div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                            {activeTab === 'UNREAD' ? 'No unread notifications' : 'Inbox is empty'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '300px', margin: '0 auto' }}>
                            {activeTab === 'UNREAD' 
                                ? 'You have caught up with everything! Great job.' 
                                : 'When activity happens, you will see it here.'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((n) => (
                        <div 
                            key={n.id}
                            ref={el => { notificationRefs.current.set(n.id, el); }}
                            className={`glass-card ${highlightedId === n.id ? 'notification-highlight' : ''}`}
                            onClick={() => (n.isDb && n.unread) && markAsRead(n.id)}
                            style={{
                                display: 'flex',
                                gap: '1.25rem',
                                padding: '1.5rem',
                                borderLeft: n.unread ? '4px solid var(--primary)' : '1px solid var(--border)',
                                background: n.unread ? 'rgba(0, 84, 141, 0.03)' : 'var(--bg-card)',
                                cursor: 'default',
                                transition: 'all 0.3s',
                                opacity: 1,
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '0.75rem',
                                background: n.color || 'white', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', border: '1px solid var(--border)',
                                flexShrink: 0
                            }}>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>{n.initials}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: n.unread ? 'bold' : '600', color: 'var(--text-main)' }}>{n.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    {n.message}
                                </p>
                            </div>
                            {n.isDb && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(n.id);
                                    }}
                                    className="btn-icon"
                                    style={{
                                        alignSelf: 'flex-start',
                                        color: '#ef4444',
                                        padding: '0.5rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Delete notification"
                                >
                                    <TrashIcon size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationList;
