import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { api, BASE_URL } from '../services/api';
import { BellIcon, LogOutIcon, ChevronDownIcon, SlidersIcon, SearchIcon, MenuIcon } from '../icons';
import CommandPalette from './CommandPalette';
import CRMChatAssistant from '../components/CRMChatAssistant';
import NotificationDropdown from '../components/NotificationDropdown';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Global keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close dropdowns on click outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setIsProfileOpen(false);
            setIsNotificationsOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchNotifications = React.useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // 1. Fetch persistent notifications from DB
            const dbNotifications = await api.getNotifications();
            
            let items: any[] = dbNotifications.map((n: any) => ({
                id: n._id,
                _id: n._id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: !n.isRead,
                type: n.type || 'info',
                initials: n.title.charAt(0).toUpperCase(),
                color: n.type === 'task' ? '#6366f1' : n.type === 'interview' ? '#0ea5e9' : n.type === 'new_task' ? '#10b981' : '#6366f1',
                path: n.path || '/',
                rawDate: new Date(n.createdAt),
                isDb: true
            }));

            // Sort by latest
            items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
            setNotifications(items);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsAsRead();
            
            // Persistently dismiss active dynamic alerts
            const dismissed = JSON.parse(localStorage.getItem('dismissed_ticket_alerts') || '[]');
            notifications.forEach(n => {
                if (!n.isDb && !dismissed.includes(n.id)) {
                    dismissed.push(n.id);
                }
            });
            localStorage.setItem('dismissed_ticket_alerts', JSON.stringify(dismissed));
            
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };


    const handleClearAll = async () => {
        if (window.confirm('Clear all notifications? This cannot be undone.')) {
            try {
                await api.clearAllNotifications();
                setNotifications([]);
            } catch (error) {
                console.error('Error clearing notifications:', error);
            }
        }
    };

    const handleNotificationClick = async (n: any) => {
        if (n.isDb && n.unread) {
            try {
                await api.markNotificationAsRead(n.id);
            } catch (error) {
                console.error('Error marking read:', error);
            }
        } else if (!n.isDb) {
            // Persistently dismiss the clicked dynamic ticket alert
            const dismissed = JSON.parse(localStorage.getItem('dismissed_ticket_alerts') || '[]');
            if (!dismissed.includes(n.id)) {
                dismissed.push(n.id);
                localStorage.setItem('dismissed_ticket_alerts', JSON.stringify(dismissed));
            }
            setNotifications(prev => prev.filter(item => item.id !== n.id));
        }
        // Always navigate to the notification list with the notification ID to highlight it
        navigate(`/notifications?id=${n.id}`);
        setIsNotificationsOpen(false);
    };

    // Auto-refresh notifications every 60 seconds (increased from 30 as fallback)
    React.useEffect(() => {
        fetchNotifications(); // Initial fetch
        const interval = setInterval(fetchNotifications, 60000);
        
        // Listen for real-time notification events from ChatContext
        const handleNewNotification = () => {
            fetchNotifications();
        };
        window.addEventListener('notification_received', handleNewNotification);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification_received', handleNewNotification);
        };
    }, [fetchNotifications]);

    React.useEffect(() => {
        if (isNotificationsOpen) {
            fetchNotifications();
        }
    }, [isNotificationsOpen, fetchNotifications]);


    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-dark)', overflow: 'hidden' }}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <nav style={{
                    padding: '0.75rem 2.5rem',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '72px',
                    boxSizing: 'border-box',
                    zIndex: 50,
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            className="hamburger-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '0.75rem', marginRight: '16px' }}
                        >
                            <MenuIcon size={24} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '12px', borderRadius: '0.75rem', transition: 'background 0.2s' }}
                            className="nav-item-hover"
                        >
                            <SearchIcon size={20} />
                        </button>

                        {/* Notifications */}
                        <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
                                style={{ 
                                    border: 'none', 
                                    color: 'var(--text-muted)', 
                                    cursor: 'pointer', 
                                    position: 'relative', 
                                    display: 'flex', 
                                    padding: '12px', 
                                    borderRadius: '0.75rem', 
                                    transition: 'all 0.2s',
                                    background: isNotificationsOpen ? 'rgba(0,0,0,0.05)' : 'transparent'
                                }}
                                className="nav-item-hover"
                            >
                                <BellIcon size={20} />
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </button>

                            {isNotificationsOpen && (
                                <NotificationDropdown 
                                    notifications={notifications}
                                    isLoading={isLoading}
                                    onMarkAllRead={handleMarkAllRead}
                                    onClearAll={handleClearAll}
                                    onClose={() => setIsNotificationsOpen(false)}
                                    onNotificationClick={handleNotificationClick}
                                />
                            )}
                        </div>
                        <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                            <div className="header-profile-trigger" onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', background: isProfileOpen ? 'rgba(0,0,0,0.05)' : 'transparent', userSelect: 'none' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: (user as any)?.profilePhoto ? `url(${BASE_URL}${(user as any).profilePhoto}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '800', color: 'white', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>{!(user as any)?.profilePhoto && user?.name?.charAt(0).toUpperCase()}</div>
                                <div style={{ textAlign: 'left', display: 'block', minWidth: '0' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{user?.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{user?.role}</div>
                                </div>
                                <ChevronDownIcon size={16} color="var(--text-muted)" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                            </div>
                            {isProfileOpen && (
                                <div className="dropdown-menu">
                                    <button onClick={() => { navigate('/settings'); setIsProfileOpen(false); }} className="dropdown-item"><SlidersIcon size={18} /> Settings</button>
                                    <button onClick={handleLogout} className="dropdown-item"><LogOutIcon size={18} /> Log out</button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
                <main 
                    className="custom-scrollbar"
                    style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflow: 'hidden',
                        position: 'relative',
                        height: 'calc(100vh - 72px)',
                        paddingBottom: '2rem'
                    }}
                >
                    <Outlet />
                    {user?.role !== 'Normal User' && <CRMChatAssistant />}
                </main>
            </div>
            <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};

export default MainLayout;
