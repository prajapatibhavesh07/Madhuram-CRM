import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRightIcon, CheckIcon, DownloadIcon,
    ClockIcon, ListIcon, AlertCircleIcon, BellIcon, SparklesIcon
} from '../icons';
import CandidateSummaryCard from '../components/CandidateSummaryCard';
import { ModernStatsCard } from '../components/DashboardWidgets';

const DashboardManager = ({ stats }: { stats: any }) => {
    const navigate = useNavigate();
    const [activeList, setActiveList] = React.useState<'reminders' | 'tickets' | 'assessment' | 'newlyAssigned'>('reminders');

    // Trend simulation
    const getTrendData = (baseVal: number) => {
        const factor = baseVal > 0 ? baseVal / 10 : 5;
        return [
            Math.round(factor * 0.4 + Math.random() * factor),
            Math.round(factor * 0.8 + Math.random() * factor),
            Math.round(factor * 0.5 + Math.random() * factor),
            Math.round(factor * 1.2 + Math.random() * factor),
            Math.round(factor * 0.7 + Math.random() * factor),
            Math.round(factor * 1.5 + Math.random() * factor),
            baseVal || 0
        ];
    };

    return (
        <div className="fade-in dashboard-layout">
            <div className="dashboard-main-content">
                <div className="stats-row">
                    <ModernStatsCard
                        title="Ready To Move"
                        value={stats?.operations?.readyToMove || '0'}
                        percent="15"
                        icon={ChevronRightIcon}
                        chartData={getTrendData(parseInt(stats?.operations?.readyToMove || 10))}
                        color="#4f46e5"
                    />
                    <ModernStatsCard
                        title="Vehicle Available"
                        value={stats?.operations?.vehicleAvailable || '0'}
                        percent="10"
                        icon={CheckIcon}
                        chartData={getTrendData(parseInt(stats?.operations?.vehicleAvailable || 8))}
                        color="#10b981"
                    />
                    <ModernStatsCard
                        title="Verified Docs"
                        value={stats?.operations?.verified || '0'}
                        percent="12"
                        icon={CheckIcon}
                        chartData={getTrendData(parseInt(stats?.operations?.verified || 15))}
                        color="#f59e0b"
                    />
                    <ModernStatsCard
                        title="Poach Warnings"
                        value={stats?.operations?.poachWarning || '0'}
                        percent="-5"
                        icon={AlertCircleIcon}
                        chartData={getTrendData(parseInt(stats?.operations?.poachWarning || 5))}
                        color="#ef4444"
                    />
                </div>

                <div className="dashboard-grid">
                    {/* Actionable Items Widget */}
                    <div className="widget-card widget-card--span-2">
                        <div className="widget-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3>Operation Center</h3>
                                <SparklesIcon size={14} color="#f59e0b" />
                            </div>
                            <div className="tab-nav">
                                {[
                                    { id: 'reminders', label: 'Reminders', icon: ClockIcon, count: stats?.counters?.remindersCount },
                                    { id: 'tickets', label: 'Tickets', icon: ListIcon, count: stats?.counters?.pendingTicketsCount },
                                    { id: 'assessment', label: 'Assessment', icon: AlertCircleIcon, count: stats?.counters?.assessmentPendingCount },
                                    { id: 'newlyAssigned', label: 'New', icon: BellIcon, count: stats?.counters?.newAssignedCount }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveList(tab.id as any)}
                                        className={`tab-btn ${activeList === tab.id ? 'active' : ''}`}
                                    >
                                        <tab.icon size={14} />
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && <span className="tab-count-badge">{tab.count}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="action-list-content custom-scrollbar widget-scroll-container">``
                            {activeList === 'reminders' && (
                                <div className="candidate-list">
                                    {stats?.reminders?.length > 0 ? stats.reminders.map((r: any) => (
                                        <div key={r._id} className="candidate-item" onClick={() => navigate(`/candidates?id=${r.candidate?._id}`)}>
                                            <div className="candidate-item-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
                                                <ClockIcon size={20} />
                                            </div>
                                            <div className="candidate-item-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="employee-name" style={{ fontSize: '14px', fontWeight: 600 }}>{r.title}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Candidate: {r.candidate?.name || 'N/A'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                                        {new Date(r.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className={`status-badge ${new Date(r.reminderTime).getTime() < new Date().getTime() ? 'danger' : 'pending'}`} style={{ fontSize: '10px' }}>
                                                        {new Date(r.reminderTime).getTime() < new Date().getTime() ? 'Overdue' : 'Due Today'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state-placeholder" style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                            <ClockIcon size={40} style={{ marginBottom: '1rem' }} />
                                            <p>No reminders for today</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeList === 'tickets' && (
                                <div className="candidate-list">
                                    {stats?.pendingTickets?.length > 0 ? stats.pendingTickets.map((c: any) => (
                                        <div key={c._id} className="candidate-item" onClick={() => navigate(`/candidates?id=${c._id}`)}>
                                            <div className="candidate-item-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                                                <ListIcon size={20} />
                                            </div>
                                            <div className="candidate-item-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="employee-name" style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {c.applicationId}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {c.tickets.map((t: any, idx: number) => (
                                                        <span key={idx} className={`status-badge ${t.portalStatus === 'Pending' ? 'pending' : 'danger'}`} style={{ fontSize: '10px' }}>
                                                            {t.portalStatus} Ticket
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state-placeholder" style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                            <ListIcon size={40} style={{ marginBottom: '1rem' }} />
                                            <p>No pending or expired tickets</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeList === 'assessment' && (
                                <div className="candidate-list">
                                    {stats?.assessmentPending?.length > 0 ? stats.assessmentPending.map((c: any) => (
                                        <div key={c._id} className="candidate-item" onClick={() => navigate(`/candidates?id=${c._id}`)}>
                                            <div className="candidate-item-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                                                <AlertCircleIcon size={20} />
                                            </div>
                                            <div className="candidate-item-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="employee-name" style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {c.applicationId}</div>
                                                </div>
                                                <div className="status-badge pending" style={{ fontSize: '10px' }}>Assessment Pending</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state-placeholder" style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                            <AlertCircleIcon size={40} style={{ marginBottom: '1rem' }} />
                                            <p>No assessment pending</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeList === 'newlyAssigned' && (
                                <div className="candidate-list">
                                    {stats?.newAssigned?.length > 0 ? stats.newAssigned.map((c: any) => (
                                        <div key={c._id} className="candidate-item" onClick={() => navigate(`/candidates?id=${c._id}`)}>
                                            <div className="candidate-item-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                                <BellIcon size={20} />
                                            </div>
                                            <div className="candidate-item-info" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="employee-name" style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {c.applicationId}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>NEW ASSIGNED</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state-placeholder" style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                            <BellIcon size={40} style={{ marginBottom: '1rem' }} />
                                            <p>No newly assigned candidates</p>
                                        </div>
                                    )}
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

                    <div className="widget-card">
                        <div className="widget-header">
                            <h3>Operations Insights</h3>
                        </div>
                        <div className="insights-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Relocation Readiness', value: `${stats?.operations?.readyToMove} Total`, color: '#4f46e5' },
                                { label: 'Logistics (Vehicle)', value: `${stats?.operations?.vehicleAvailable} Candidates`, color: '#10b981' },
                                { label: 'Verification Rate', value: `${(stats?.operations?.verified / stats?.counters?.totalCandidates * 100 || 0).toFixed(1)}% Success`, color: '#f59e0b' }
                            ].map((insight, idx) => (
                                <div key={idx} className="insights-item" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{insight.label}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: insight.color }}>{insight.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="download-data-footer" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <a href="#" style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>Export Operational Report</a>
                            <button className="icon-btn-sm">
                                <DownloadIcon size={14} color="#64748b" />
                            </button>
                        </div>
                    </div>

                    <div className="widget-card widget-card--span-2">
                        <div className="widget-header">
                            <h3>Team Pulse</h3>
                        </div>
                        <div className="team-activity-list custom-scrollbar">
                            {stats?.recentCandidates?.map((c: any) => (
                                <div key={c._id} className="candidate-item" style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', borderRadius: 0 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Added by {c.createdBy?.name || 'System'}</div>
                                    </div>
                                    <div className={`status-badge ${c.status === 1 ? 'success' : 'pending'}`} style={{ fontSize: '10px' }}>
                                        {c.status === 1 ? 'Active' : 'Pending'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardManager;
