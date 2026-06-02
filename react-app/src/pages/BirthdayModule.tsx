import { useState, useEffect } from 'react';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CakeIcon, SparklesIcon, MailIcon, MessageIcon, CalendarIcon, CheckIcon } from '../icons';

interface UserBirthday {
    _id: string;
    name: string;
    email: string;
    phone: string;
    dob: string;
    profilePhoto?: string;
    role: string;
    type: "Employee" | "Candidate";
    daysUntil?: number;
}

const BirthdayModule = () => {
    const [todaysBirthdays, setTodaysBirthdays] = useState<UserBirthday[]>([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<UserBirthday[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchBirthdays();
    }, []);

    const fetchBirthdays = async () => {
        try {
            setLoading(true);
            const today = await api.getTodaysBirthdays();
            const upcoming = await api.getUpcomingBirthdays();
            setTodaysBirthdays(today);
            setUpcomingBirthdays(upcoming);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
            showToast('Failed to load birthday data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === todaysBirthdays.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(todaysBirthdays.map(u => u._id));
        }
    };

    const sendEmailGreeting = (user: UserBirthday) => {
        const subject = `Happy Birthday, ${user.name}! 🎂`;
        const body = `Dear ${user.name},\n\nWishing you a very Happy Birthday from the entire team! Have a fantastic day ahead.\n\nBest Regards,\nCRM Team`;
        window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const sendWhatsAppGreeting = (user: UserBirthday) => {
        const message = `Happy Birthday, ${user.name}! 🎂 Hope you have a wonderful day! 🎉`;
        const phone = user.phone ? user.phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const bulkEmail = () => {
        const selectedUsers = todaysBirthdays.filter(u => selectedIds.includes(u._id));
        if (selectedUsers.length === 0) return;
        
        const emails = selectedUsers.map(u => u.email).join(',');
        const subject = encodeURIComponent("Happy Birthday! 🎂");
        const body = encodeURIComponent("Dear All,\n\nWishing you all a very Happy Birthday! Have a fantastic day ahead.\n\nBest Regards,\nCRM Team");
        window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
        showToast(`Email composer opened for ${selectedUsers.length} users`, 'success');
    };

    const bulkWhatsApp = () => {
        const selectedUsers = todaysBirthdays.filter(u => selectedIds.includes(u._id));
        if (selectedUsers.length === 0) return;

        if (selectedUsers.length > 5) {
            if (!window.confirm(`You are about to open ${selectedUsers.length} WhatsApp tabs. Proceed?`)) return;
        }

        selectedUsers.forEach(u => {
            const message = encodeURIComponent(`Happy Birthday, ${u.name}! 🎂 Hope you have a wonderful day! 🎉`);
            const phone = u.phone ? u.phone.replace(/\D/g, '') : '';
            if (phone) {
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
            }
        });
        showToast(`WhatsApp tabs opened for ${selectedUsers.length} users`, 'success');
    };

    if (loading) return <div className="flex-center h-full">Loading Birthday celebrations...</div>;

    return (
        <div className="page-container fade-in" style={{ 
            height: 'calc(100vh - 80px)', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden', 
            padding: '1.25rem',
            boxSizing: 'border-box'
        }}>
            {/* Header / Hero Section */}
            <div className="glass-card" style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                marginBottom: '1rem',
                padding: '1rem 1.5rem',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                flexShrink: 0
            }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            padding: '0.5rem', 
                            borderRadius: '10px',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <SparklesIcon size={20} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.01em' }}>
                                Birthday Celebrations
                            </h1>
                            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>
                                Track and celebrate birthdays for your team and candidates.
                            </p>
                        </div>
                    </div>
                    
                    {/* Bulk Actions UI */}
                    {selectedIds.length > 0 && (
                        <div className="fade-in" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{selectedIds.length} Selected</span>
                            <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.3)' }} />
                            <button onClick={bulkEmail} className="bulk-action-btn" style={{ 
                                background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', 
                                borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}>
                                <MailIcon size={14} /> Send Bulk Email
                            </button>
                            <button onClick={bulkWhatsApp} className="bulk-action-btn" style={{ 
                                background: '#22c55e', color: 'white', border: 'none', padding: '0.4rem 0.8rem', 
                                borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}>
                                <MessageIcon size={14} /> Send Bulk WhatsApp
                            </button>
                        </div>
                    )}
                </div>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-10%', right: '-2%', opacity: 0.08, pointerEvents: 'none' }}>
                    <CakeIcon size={120} />
                </div>
            </div>

            <div className="modern-grid" style={{ 
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '1.25rem',
                overflow: 'hidden',
                minHeight: 0 
            }}>
                {/* Today's Section */}
                <div className="glass-card" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    overflow: 'hidden',
                    padding: '1.25rem',
                    background: 'var(--bg-glass)',
                    borderRadius: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                                <CakeIcon size={18} />
                            </div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Today's Birthdays</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {todaysBirthdays.length > 0 && (
                                <button 
                                    onClick={toggleSelectAll}
                                    style={{ 
                                        background: 'transparent', border: 'none', color: '#6366f1', 
                                        fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {selectedIds.length === todaysBirthdays.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                            <span style={{ 
                                background: todaysBirthdays.length > 0 ? '#ef4444' : 'rgba(148, 163, 184, 0.1)',
                                color: todaysBirthdays.length > 0 ? 'white' : '#64748b',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}>
                                {todaysBirthdays.length} Total
                            </span>
                        </div>
                    </div>

                    <div className="custom-scrollbar" style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem', 
                        paddingRight: '0.4rem' 
                    }}>
                        {todaysBirthdays.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '3rem 1rem', 
                                opacity: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <CakeIcon size={40} />
                                <p style={{ fontSize: '0.9rem' }}>No birthdays today.</p>
                            </div>
                        ) : (
                            todaysBirthdays.map(user => (
                                <div key={user._id} className={`hover-lift ${selectedIds.includes(user._id) ? 'selected' : ''}`} style={{
                                    padding: '0.75rem 1rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1rem',
                                    background: selectedIds.includes(user._id) ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: selectedIds.includes(user._id) ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0,0,0,0.05)',
                                    borderLeft: '4px solid #ef4444',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}>
                                    {/* Selection Checkbox */}
                                    <div 
                                        onClick={() => toggleSelection(user._id)}
                                        style={{ 
                                            width: '20px', height: '20px', borderRadius: '6px', 
                                            border: '2px solid',
                                            borderColor: selectedIds.includes(user._id) ? '#6366f1' : '#cbd5e1',
                                            background: selectedIds.includes(user._id) ? '#6366f1' : 'white',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {selectedIds.includes(user._id) && <CheckIcon size={12} color="white" />}
                                    </div>

                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '10px',
                                        background: user.profilePhoto ? `url(${BASE_URL}${user.profilePhoto}) center/cover no-repeat` : 'linear-gradient(135deg, #fecaca, #fca5a5)',
                                        flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                        color: '#ef4444', fontWeight: 'bold'
                                    }}>
                                        {!user.profilePhoto && user.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleSelection(user._id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{user.name}</h3>
                                            <span style={{ 
                                                fontSize: '0.6rem', 
                                                padding: '0.1rem 0.4rem', 
                                                borderRadius: '4px',
                                                background: user.type === 'Employee' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: user.type === 'Employee' ? '#3b82f6' : '#10b981',
                                                fontWeight: 'bold'
                                            }}>
                                                {user.type}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.role}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); sendEmailGreeting(user); }}
                                            style={{ 
                                                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Send Email"
                                        >
                                            <MailIcon size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); sendWhatsAppGreeting(user); }}
                                            style={{ 
                                                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                                background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Send WhatsApp"
                                        >
                                            <MessageIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Section */}
                <div className="glass-card" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    overflow: 'hidden',
                    padding: '1.25rem',
                    background: 'var(--bg-glass)',
                    borderRadius: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ padding: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: '#6366f1' }}>
                                <CalendarIcon size={18} />
                            </div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Upcoming Birthdays</h2>
                        </div>
                        <span style={{ 
                            color: '#64748b',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}>
                            Next 30 Days
                        </span>
                    </div>

                    <div className="custom-scrollbar" style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.6rem', 
                        paddingRight: '0.4rem' 
                    }}>
                        {upcomingBirthdays.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '3rem 1rem', 
                                opacity: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <CalendarIcon size={40} />
                                <p style={{ fontSize: '0.9rem' }}>No upcoming birthdays.</p>
                            </div>
                        ) : (
                            upcomingBirthdays.map(user => (
                                <div key={user._id} className="hover-lift" style={{
                                    padding: '0.6rem 1rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1rem',
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                        flexShrink: 0
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1 }}>
                                            {new Date(user.dob).toLocaleDateString('en-GB', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '1rem', color: '#4f46e5', fontWeight: '800', lineHeight: 1.1 }}>
                                            {new Date(user.dob).getDate()}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{user.name}</h3>
                                            <span style={{ 
                                                fontSize: '0.55rem', 
                                                padding: '0.1rem 0.35rem', 
                                                borderRadius: '4px',
                                                background: user.type === 'Employee' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: user.type === 'Employee' ? '#3b82f6' : '#10b981',
                                                fontWeight: 'bold'
                                            }}>
                                                {user.type}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                            {user.daysUntil === 1 ? 'Tomorrow' : `In ${user.daysUntil} days`}
                                        </div>
                                    </div>
                                    <div style={{ color: '#6366f1', opacity: 0.2 }}>
                                        <SparklesIcon size={14} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BirthdayModule;
