import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPPORT_CONTACT } from '../constants/supportConfig';

import {
    DashboardIcon, UsersIcon, SettingsIcon, UserIcon,
    BriefcaseIcon, FileTextIcon, ChevronRightIcon, ChevronDownIcon, DatabaseIcon,
    PhoneIcon, MailIcon, SparklesIcon, BellIcon, CalendarIcon
} from '../icons';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, activeRole } = useAuth();
    const location = useLocation();

    // State for submenus
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);

    // Effect to auto-open if child is active
    React.useEffect(() => {
        if (['/users', '/attendance', '/leaves', '/payroll', '/roles'].some(path => location.pathname.startsWith(path))) {
            setIsUserMgmtOpen(true);
        }
    }, [location.pathname]);

    const ICON_PRIMARY = '#00548D';
    const ICON_SECONDARY = '#FA801C';

    interface NavItem {
        label: string;
        path?: string;
        icon: React.ReactNode;
        moduleKey?: string;
        isSubmenu?: boolean;
        isOpen?: boolean;
        onToggle?: () => void;
        children?: { label: string; path: string; moduleKey?: string }[];
    }

    const navItems: NavItem[] = [
        { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'dashboard' },
        { label: 'Candidates', path: '/candidates', icon: <UsersIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'candidates' },
        { label: 'Interview Calendar', path: '/interviews/calendar', icon: <CalendarIcon size={20} color={ICON_PRIMARY} />, moduleKey: 'candidates' },
        { label: 'Vacancy', path: '/jobs', icon: <BriefcaseIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'jobs' },
        { label: 'Tasks', path: '/tasks', icon: <FileTextIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'tasks' },
        { label: 'Call History', path: '/call-history', icon: <PhoneIcon size={20} color={ICON_PRIMARY} />, moduleKey: 'callHistory' },
        { label: 'Offers', path: '/offers', icon: <FileTextIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'offers' },

        // Group: User Management
        {
            label: 'User Management',
            icon: <SettingsIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />,
            isSubmenu: true,
            isOpen: isUserMgmtOpen,
            onToggle: () => setIsUserMgmtOpen(!isUserMgmtOpen),
            children: [
                { label: 'Users', path: '/users', moduleKey: 'users' },
                { label: 'Roles & Permissions', path: '/roles', moduleKey: 'roles' },
                { label: 'Attendance', path: '/attendance', moduleKey: 'attendance' },
                { label: 'Birthdays', path: '/birthdays', moduleKey: 'birthdays' },
                { label: 'Leaves', path: '/leaves', moduleKey: 'leaves' },
                { label: 'Payroll', path: '/payroll', moduleKey: 'payroll' },
            ]
        },
        { label: 'Notifications', path: '/notifications', icon: <BellIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} /> },
        { label: 'Export/Import', path: '/import-export', icon: <DatabaseIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'importExport' },
        { label: 'Templates', path: '/templates', icon: <FileTextIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'settings' },
        { label: 'Settings', path: '/settings', icon: <SettingsIcon size={20} color={ICON_PRIMARY} secondaryColor={ICON_SECONDARY} />, moduleKey: 'settings' },
    ];

    const hasPermission = (moduleKey?: string) => {
        if (!user) return false;
        if (user.role === 'Super Admin') return true;
        if (!moduleKey) return true;
        return activeRole?.permissions?.[moduleKey]?.view === true;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 99,
                        display: 'none' // Handled by CSS media query
                    }}
                />
            )}
            <aside
                className={`sidebar-container ${isOpen ? 'open' : ''}`}
                style={{
                    minWidth: '280px',
                    width: '280px',
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    padding: '1.5rem 0', // Changed padding for scrollable area
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    overflow: 'hidden', // Sidebox itself should not scroll
                    zIndex: 100,
                    transition: 'transform 0.3s ease-in-out'
                }}
            >
                {/* Header / Logo (Fixed) */}
                <div style={{ padding: '0 2rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                    <img src="/logo.png" alt="CRM Logo" style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }} />
                </div>

                {/* Navigation Items (Scrollable) */}
                <div
                    className="sidebar-scroll"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.5rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}
                >
                    {navItems.map((item, index) => {
                        if (!hasPermission(item.moduleKey)) return null;

                        if (item.isSubmenu) {
                            // Check if any child has permission, otherwise hide the submenu entirely
                            const visibleChildren = item.children?.filter(child => hasPermission(child.moduleKey)) || [];
                            if (visibleChildren.length === 0) return null;
                            return (
                                <div key={index}>
                                    <div
                                        onClick={item.onToggle}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.25rem'
                                        }}
                                        className="nav-item-hover"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {item.icon}
                                            {item.label}
                                        </div>
                                        {item.isOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                                    </div>

                                    {item.isOpen && (
                                        <div style={{ marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {visibleChildren.map((child, idx) => (
                                                <NavLink
                                                    key={idx}
                                                    to={child.path}
                                                    style={({ isActive }): React.CSSProperties => ({
                                                        display: 'block',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.5rem',
                                                        textDecoration: 'none',
                                                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                                        background: isActive ? 'rgba(0, 120, 198, 0.05)' : 'transparent',
                                                        fontSize: '0.9rem',
                                                        transition: 'all 0.2s',
                                                    })}
                                                    onClick={() => {
                                                        if (window.innerWidth < 1024 && onClose) onClose();
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', marginRight: '0.75rem', opacity: 0.5 }} />
                                                        {child.label}
                                                    </div>
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path || index}
                                to={item.path || '#'}
                                style={({ isActive }): React.CSSProperties => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.75rem',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    background: isActive ? 'rgba(0, 120, 198, 0.05)' : 'transparent',
                                    border: isActive ? '1px solid rgba(0, 120, 198, 0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    fontWeight: isActive ? '600' : '400'
                                })}
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Footer / Support (Fixed) */}
                <div style={{ padding: '1rem' }}>
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(0, 84, 141, 0.05) 0%, rgba(250, 128, 28, 0.05) 100%)',
                        borderRadius: '1.25rem',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            opacity: 0.1
                        }}>
                            <SparklesIcon size={40} color={ICON_SECONDARY} />
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--secondary)'
                            }}></div>
                            Quick Support
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', border: '1px solid var(--border)'
                                }}>
                                    <UserIcon size={14} color={ICON_PRIMARY} />
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                    {SUPPORT_CONTACT.name}
                                </span>
                            </div>

                            <a href={SUPPORT_CONTACT.phoneLink} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                textDecoration: 'none', color: 'var(--text-muted)',
                                transition: 'color 0.2s'
                            }} className="support-link">
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', border: '1px solid var(--border)'
                                }}>
                                    <PhoneIcon size={14} color={ICON_PRIMARY} />
                                </div>
                                <span style={{ fontSize: '0.75rem' }}>{SUPPORT_CONTACT.phone}</span>
                            </a>

                            <a href={SUPPORT_CONTACT.emailLink} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                textDecoration: 'none', color: 'var(--text-muted)',
                                transition: 'color 0.2s'
                            }} className="support-link">
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', border: '1px solid var(--border)'
                                }}>
                                    <MailIcon size={14} color={ICON_PRIMARY} />
                                </div>
                                <span style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{SUPPORT_CONTACT.email}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
