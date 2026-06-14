import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClockIcon, ListIcon, AlertCircleIcon, BellIcon, SparklesIcon,
    UserIcon, UsersIcon
} from '../icons';
import CandidateSummaryCard from '../components/CandidateSummaryCard';
import { ModernStatsCard } from '../components/DashboardWidgets';

const EmployeeCard = ({ employee }: { employee: any }) => {
    return (
        <div className="employee-activity-card" style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
            marginBottom: '10px'
        }}>
            <div className="employee-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 0 }}>
                <div className="employee-avatar-wrapper" style={{ position: 'relative', width: '38px', height: '38px' }}>
                    {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="employee-avatar-img" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div className="employee-avatar-placeholder" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {employee.initial}
                        </div>
                    )}
                    <div className="online-pulse" style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
                </div>
                <div className="employee-info">
                    <h4 className="employee-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{employee.name}</h4>
                    <span className="employee-role" style={{ fontSize: '0.7rem', color: '#64748b' }}>{employee.role}</span>
                </div>
            </div>

            <div className="employee-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Active</div>
                    <div className="employee-stat-value" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{employee.active}</div>
                </div>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Done</div>
                    <div className="employee-stat-value done" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{employee.done}</div>
                </div>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Pending</div>
                    <div className="employee-stat-value" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginTop: '2px' }}>{employee.pending}</div>
                </div>
            </div>
        </div>
    );
};

const DashboardManager = ({ stats, onOpenTicketModal, onOpenTeamDrawer }: { stats: any; onOpenTicketModal?: (candidate: any) => void; onOpenTeamDrawer?: () => void }) => {
    const navigate = useNavigate();
    const [activeList, setActiveList] = React.useState<'reminders' | 'tickets' | 'assessment' | 'newlyAssigned'>('reminders');

    // High fidelity trend data (exact curves for aesthetic wave effects) scaled dynamically per live data
    const getTrendData = (type: string, currentValue: number) => {
        let baseTrend = [12, 18, 14, 26, 20, 28, 24];
        if (type === 'total') baseTrend = [12, 18, 14, 26, 20, 28, 24];
        else if (type === 'new') baseTrend = [8, 12, 9, 15, 11, 16, 14];
        else if (type === 'reminders') baseTrend = [5, 9, 7, 12, 8, 14, 11];
        else baseTrend = [14, 22, 17, 28, 21, 32, 27]; // assessment

        const lastVal = baseTrend[baseTrend.length - 1];
        const ratio = currentValue / (lastVal || 1);

        return baseTrend.map((val, idx) => {
            if (idx === baseTrend.length - 1) return currentValue;
            return Math.round(val * ratio);
        });
    };

    // Live binding Action Center items from live database lists
    const mockActionItems = {
        reminders: [
            { id: '1', title: 'Follow up: Pari Kulkarni 500', subtitle: 'Candidate: Pari Kulkarni 500 • Project: Website Redesign', time: '09:00 AM', status: 'OVERDUE', color: '#f43f5e', icon: ClockIcon },
            { id: '2', title: 'Schedule technical assessment for Akash Joshi', subtitle: 'Project: Mobile App • Step: Technical Round', time: '10:30 AM', status: 'DUE TODAY', color: '#f59e0b', icon: ClockIcon },
            { id: '3', title: 'Document upload pending – Om Kulkarni 499', subtitle: 'Project: SaaS Dashboard • Document: ID Proof', time: '11:15 AM', status: 'PENDING', color: '#64748b', icon: ClockIcon },
            { id: '4', title: 'Client feedback reminder – Ritesh Kumar', subtitle: 'Project: CRM Integration • Feedback Round', time: '01:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: ClockIcon }
        ],
        tickets: [
            { id: '1', title: 'Portal Login Issue - Akash K', subtitle: 'Project: Mobile App • Ticket ID: #10023', time: '11:00 AM', status: 'DUE TODAY', color: '#f59e0b', icon: ListIcon },
            { id: '2', title: 'Resume Download Failure', subtitle: 'Project: SaaS Dashboard • Ticket ID: #10024', time: '02:30 PM', status: 'PENDING', color: '#64748b', icon: ListIcon }
        ],
        assessment: [
            { id: '1', title: 'SQL Round Assessment - Tanvi S', subtitle: 'Candidate: Tanvi Shirke • Project: DB Sync', time: '12:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: AlertCircleIcon },
            { id: '2', title: 'React Coding round - Jak P', subtitle: 'Candidate: Jak Patel • Project: CRM v2', time: '03:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: AlertCircleIcon }
        ],
        newlyAssigned: [
            { id: '1', title: 'Jak Patel assigned as Lead Developer', subtitle: 'Assigned to: Sneha Joshi • Project: Mobile App', time: '09:30 AM', status: 'NEW', color: '#10b981', icon: BellIcon }
        ]
    };

    const remindersList = stats
        ? (stats.reminders || []).map((r: any) => ({
            id: r._id,
            title: r.title,
            subtitle: `Candidate: ${r.candidate?.name || 'N/A'} • ID: ${r.candidate?.applicationId || 'N/A'}`,
            time: new Date(r.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: new Date(r.reminderTime).getTime() < new Date().getTime() ? 'OVERDUE' : 'DUE TODAY',
            color: new Date(r.reminderTime).getTime() < new Date().getTime() ? '#f43f5e' : '#f59e0b',
            icon: ClockIcon,
            candidate: r.candidate
        }))
        : mockActionItems.reminders;

    const ticketsList = stats
        ? (stats.pendingTickets || []).map((c: any) => {
            const pendingTicket = c.tickets?.find((t: any) => t.portalStatus !== 'Completed') || c.tickets?.[0];
            return {
                id: c._id,
                title: `Portal Ticket for ${c.name}`,
                subtitle: `Candidate ID: ${c.applicationId} • Phone: ${c.phone || 'N/A'}`,
                time: pendingTicket?.expdate ? new Date(pendingTicket.expdate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A',
                status: pendingTicket?.portalStatus || 'PENDING',
                color: pendingTicket?.portalStatus === 'Pending' ? '#f59e0b' : '#f43f5e',
                icon: ListIcon,
                candidate: c
            };
        })
        : mockActionItems.tickets;

    const assessmentList = stats
        ? (stats.assessmentPending || []).map((c: any) => ({
            id: c._id,
            title: `Assessment: ${c.name}`,
            subtitle: `Candidate ID: ${c.applicationId} • Location: ${c.location || 'N/A'}`,
            time: new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            status: 'PENDING',
            color: '#8b5cf6',
            icon: AlertCircleIcon,
            candidate: c
        }))
        : mockActionItems.assessment;

    const newlyAssignedList = stats
        ? (stats.newAssigned || []).map((c: any) => ({
            id: c._id,
            title: `New Lead: ${c.name}`,
            subtitle: `Candidate ID: ${c.applicationId} • Phone: ${c.phone || 'N/A'}`,
            time: new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            status: 'NEW',
            color: '#10b981',
            icon: BellIcon,
            candidate: c
        }))
        : mockActionItems.newlyAssigned;

    const liveActionItems: any = {
        reminders: remindersList,
        tickets: ticketsList,
        assessment: assessmentList,
        newlyAssigned: newlyAssignedList
    };

    const pulseTeam = stats
        ? (stats.employeeStats || []).slice(0, 3).map((emp: any) => ({
            name: emp.name,
            role: emp.role,
            avatar: emp.profilePhoto || null,
            initial: emp.name.charAt(0),
            active: (emp.taskCounts?.Todo || 0) + (emp.taskCounts?.['In Progress'] || 0) || 0,
            done: emp.taskCounts?.Completed || 0,
            pending: emp.candidateCount || emp.taskCounts?.Cancelled || 0
        }))
        : [
            { name: 'Sneha Joshi', role: 'Recruiter', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', initial: 'SJ', active: 12, done: 8, pending: 4 },
            { name: 'Anjali Nair', role: 'Manager', avatar: null, initial: 'AN', active: 18, done: 12, pending: 6 },
            { name: 'Ritesh Kumar', role: 'Team Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', initial: 'RK', active: 15, done: 10, pending: 5 }
        ];

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div className="stats-row">
                <ModernStatsCard
                    title="Total Candidates"
                    value={stats?.counters?.totalCandidates ?? 0}
                    percent="12"
                    icon={UserIcon}
                    chartData={getTrendData('total', stats?.counters?.totalCandidates ?? 0)}
                    color="#3b82f6"
                />
                <ModernStatsCard
                    title="New Assigned"
                    value={stats?.counters?.newAssignedCount ?? 0}
                    percent="8"
                    icon={BellIcon}
                    chartData={getTrendData('new', stats?.counters?.newAssignedCount ?? 0)}
                    color="#f59e0b"
                />
                <ModernStatsCard
                    title="Reminders"
                    value={stats?.counters?.remindersCount ?? 0}
                    percent="-5"
                    icon={ClockIcon}
                    chartData={getTrendData('reminders', stats?.counters?.remindersCount ?? 0)}
                    color="#8b5cf6"
                />
                <ModernStatsCard
                    title="Assessment Pending"
                    value={stats?.counters?.assessmentPendingCount ?? 0}
                    percent="15"
                    icon={AlertCircleIcon}
                    chartData={getTrendData('assessment', stats?.counters?.assessmentPendingCount ?? 0)}
                    color="#06b6d4"
                />
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1.3fr 1fr' }}>
                {/* Actionable Items Widget */}
                <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '400px' }}>
                    <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Action Center</h3>
                            <SparklesIcon size={14} color="#f59e0b" />
                        </div>
                        <div className="tab-nav" style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                            {[
                                { id: 'reminders', label: 'Reminders', count: stats?.counters?.remindersCount ?? 0 },
                                { id: 'tickets', label: 'Tickets', count: stats?.counters?.pendingTicketsCount ?? 0 },
                                { id: 'assessment', label: 'Assessments', count: stats?.counters?.assessmentPendingCount ?? 0 },
                                { id: 'newlyAssigned', label: 'New', count: stats?.counters?.newAssignedCount ?? 0 }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveList(tab.id as any)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        border: 'none',
                                        background: activeList === tab.id ? '#3b82f6' : 'transparent',
                                        color: activeList === tab.id ? '#ffffff' : '#64748b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span>{tab.label}</span>
                                    <span style={{
                                        fontSize: '0.62rem',
                                        background: activeList === tab.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                        color: activeList === tab.id ? '#ffffff' : '#475569',
                                        padding: '1px 5px',
                                        borderRadius: '6px'
                                    }}>{tab.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {liveActionItems[activeList] && liveActionItems[activeList].length > 0 ? (
                            liveActionItems[activeList].map((item: any) => (
                                <div
                                    key={item.id}
                                    className="candidate-item"
                                    onClick={() => {
                                        if (item.candidate) {
                                            if (activeList === 'tickets') {
                                                onOpenTicketModal && onOpenTicketModal(item.candidate);
                                            } else {
                                                navigate(`/candidates?id=${item.candidate._id}`);
                                            }
                                        }
                                    }}
                                    style={{
                                        borderLeft: `4px solid ${item.color}`,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                                        cursor: item.candidate ? 'pointer' : 'default'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: `${item.color}12`,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '32px'
                                    }}>
                                        <item.icon size={16} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{item.subtitle}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{item.time}</div>
                                            <span style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                color: item.color,
                                                background: `${item.color}12`,
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.2px',
                                                display: 'inline-block'
                                            }}>{item.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-placeholder" style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                <ClockIcon size={40} style={{ marginBottom: '1rem' }} />
                                <p>No items found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidate Summary Widget */}
                <CandidateSummaryCard
                    total={stats?.counters?.totalCandidates ?? 0}
                    scheduled={stats?.counters?.interviewedCount ?? 0}
                    shortlisted={stats?.counters?.shortlistedCount ?? 0}
                    joined={stats?.counters?.joinedCount ?? 0}
                />

                {/* Team Pulse Sidebar Card */}
                <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px' }}>
                    <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                                <UsersIcon size={18} />
                            </span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Team Pulse</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span>All normal</span>
                        </div>
                    </div>

                    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
                        {pulseTeam.map((emp: any, index: number) => (
                            <EmployeeCard key={index} employee={emp} />
                        ))}
                    </div>

                    {/* Sidebar Footer */}
                    <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                        <span
                            onClick={onOpenTeamDrawer}
                            style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            View full team <span style={{ fontSize: '10px' }}>→</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardManager;
