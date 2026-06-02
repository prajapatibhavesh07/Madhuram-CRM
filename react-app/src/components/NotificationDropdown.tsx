import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '../icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  initials: string;
  color: string;
  path: string;
  isDb: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onNotificationClick: (n: Notification) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isLoading,
  onMarkAllRead,
  onClearAll,
  onClose,
  onNotificationClick
}) => {
  const [tab, setTab] = React.useState<'ALL' | 'UNREAD'>('ALL');
  const navigate = useNavigate();

  const filtered = tab === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.unread);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="notification-box" onClick={e => e.stopPropagation()}>
      <div className="notification-header">
        <h3>Notifications</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="mark-read-link" onClick={onMarkAllRead}>
                Mark all as read
            </button>
            {notifications.length > 0 && (
                <button 
                    onClick={onClearAll} 
                    style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        color: '#ef4444', 
                        padding: '4px 8px', 
                        background: 'rgba(239, 68, 68, 0.05)', 
                        border: '1px solid rgba(239, 68, 68, 0.1)', 
                        borderRadius: '6px', 
                        cursor: 'pointer' 
                    }}
                >
                    Clear all
                </button>
            )}
        </div>
      </div>

      <div className="notification-tabs">
        <div className="tabs-inner">
          <button 
            className={`tab-trigger ${tab === 'ALL' ? 'active' : ''}`}
            onClick={() => setTab('ALL')}
          >
            ALL
          </button>
          <button 
            className={`tab-trigger ${tab === 'UNREAD' ? 'active' : ''}`}
            onClick={() => setTab('UNREAD')}
          >
            UNREAD {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      <div className="notification-list custom-scrollbar">
        {isLoading ? (
          <div className="empty-state">
            <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((n) => (
            <div 
              key={n.id} 
              className={`notification-item ${n.unread ? 'unread-item' : ''}`}
              onClick={() => onNotificationClick(n)}
            >
              <div 
                className="avatar-wrapper" 
                style={{ background: n.color || 'var(--primary)' }}
              >
                {n.initials}
              </div>
              <div className="info-wrapper">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
              </div>
              <ChevronRightIcon size={18} className="chevron-right" />
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No notifications yet</p>
          </div>
        )}
      </div>

      <div className="notification-footer">
        <button 
          className="see-all-btn" 
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
        >
          See all
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
