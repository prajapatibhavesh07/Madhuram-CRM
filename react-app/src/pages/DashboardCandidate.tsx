import { UserIcon, ChevronRightIcon, FileTextIcon, CheckIcon, SparklesIcon, CalendarIcon, ClockIcon } from '../icons';

const DashboardCandidate = ({ stats }: { stats: any }) => {
    const candidate = stats?.candidate;
    const interviews = stats?.interviews || [];

    if (!candidate) {
        return (
            <div className="fade-in empty-dashboard" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <UserIcon size={40} color="#94a3b8" />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Profile Not Found</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0.5rem auto' }}>We couldn't find a candidate profile matching your account. Please reach out to your recruitment manager.</p>
            </div>
        );
    }

    const steps = [
        { label: 'Application', status: 'completed', date: candidate.createdAt },
        { label: 'Screening', status: candidate.recruitmentStatus !== 'Applied' ? 'completed' : 'active' },
        { label: 'Interview', status: ['Interviewed', 'Offered', 'Joined'].includes(candidate.recruitmentStatus) ? 'completed' : (candidate.recruitmentStatus === 'Shortlisted' ? 'active' : 'upcoming') },
        { label: 'Offer', status: ['Offered', 'Joined'].includes(candidate.recruitmentStatus) ? 'completed' : (candidate.recruitmentStatus === 'Interviewed' ? 'active' : 'upcoming') },
        { label: 'Onboarding', status: candidate.recruitmentStatus === 'Joined' ? 'completed' : (candidate.recruitmentStatus === 'Offered' ? 'active' : 'upcoming') },
    ];

    return (
        <div className="fade-in dashboard-layout">
            <div className="dashboard-main-content">
                <div className="stats-row">
                    <div className="widget-card profile-banner" style={{ border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', minHeight: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255, 255, 255, 0.4)' }}>
                                    <UserIcon size={36} color="white" />
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#10b981', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #4f46e5' }}></div>
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Hi, {candidate.name}!</h2>
                                <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Application ID: {candidate.applicationId || 'GEN-8492'}</p>
                                <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                    <SparklesIcon size={12} />
                                    {candidate.recruitmentStatus}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="widget-card next-action-card" style={{ border: 'none', background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', minHeight: 'auto' }}>
                        <div className="widget-header">
                            <h3 style={{ color: '#1e293b', fontSize: '1rem' }}>Next Milestone</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '12px', color: '#0ea5e9' }}>
                                <CalendarIcon size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                                    {candidate.recruitmentStatus === 'Offered' ? 'Accept Offer Letter' : 
                                     candidate.recruitmentStatus === 'Interviewed' ? 'Awaiting Final Review' : 
                                     candidate.recruitmentStatus === 'Shortlisted' ? 'Interview Schedule' : 'Application Review'}
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem', lineHeight: '1.4' }}>
                                    {candidate.recruitmentStatus === 'Offered' ? 'Congratulations! Please review and sign your offer.' : 'Your application is progressing well. We will notify you of any updates.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="widget-card">
                        <div className="widget-header">
                            <h3>Hiring Progress</h3>
                        </div>
                        <div style={{ padding: '2rem 1rem' }}>
                            <div className="modern-timeline">
                                {steps.map((step, index) => (
                                    <div key={index} className={`timeline-node ${step.status}`}>
                                        <div className="node-marker">
                                            {step.status === 'completed' ? <CheckIcon size={14} /> : <div className="node-pulse"></div>}
                                        </div>
                                        <div className="node-info">
                                            <div className="node-title">{step.label}</div>
                                            {step.date && <div className="node-sub">{new Date(step.date).toLocaleDateString()}</div>}
                                        </div>
                                        {index < steps.length - 1 && <div className="node-connector"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="widget-card widget-card--span-2">
                        <div className="widget-header">
                            <h3>Upcoming Events</h3>
                        </div>
                        <div className="event-list custom-scrollbar widget-scroll-container" style={{ padding: '0.5rem 0' }}>
                            {interviews.length > 0 ? interviews.map((int: any) => (
                                <div key={int._id} className="event-item" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', minWidth: '65px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{new Date(int.date).getDate()}</div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{new Date(int.date).toLocaleString('default', { month: 'short' })}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{int.type} Interview</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <ClockIcon size={12} />
                                            {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>
                                            {int.mode || 'Video Call'}
                                        </div>
                                    </div>
                                    <button className="icon-btn-sm" style={{ alignSelf: 'center' }}>
                                        <ChevronRightIcon size={16} />
                                    </button>
                                </div>
                            )) : (
                                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                                    <CalendarIcon size={32} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No interviews scheduled at this moment</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="widget-card" style={{ marginTop: '2rem', minHeight: 'auto' }}>
                    <div className="widget-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3>Document Center</h3>
                            <span className="status-badge success" style={{ fontSize: '10px' }}>Secure</span>
                        </div>
                    </div>
                    <div className="document-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem' }}>
                        {[
                            { name: 'Resume / CV', exists: !!candidate.resume?.fileUrl },
                            { name: 'PAN Card', exists: !!candidate.panCard?.fileUrl },
                            { name: 'Aadhaar Card', exists: !!candidate.aadhaarCard?.fileUrl },
                            { name: 'Education Docs', exists: !!candidate.educationProof?.fileUrl },
                        ].map(doc => (
                            <div key={doc.name} className="doc-item" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ color: doc.exists ? '#6366f1' : '#94a3b8' }}>
                                        <FileTextIcon size={28} />
                                    </div>
                                    {doc.exists && <div style={{ color: '#10b981' }}><CheckIcon size={18} /></div>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{doc.name}</div>
                                    <div style={{ fontSize: '12px', color: doc.exists ? '#10b981' : '#ef4444', marginTop: '2px', fontWeight: 600 }}>
                                        {doc.exists ? 'Verification Pending' : 'Upload Required'}
                                    </div>
                                </div>
                                {!doc.exists && (
                                    <button style={{ marginTop: '0.5rem', width: '100%', padding: '8px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: 'transparent', fontSize: '12px', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                                        Choose File
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <style>{`
                    .modern-timeline {
                        display: flex;
                        justify-content: space-between;
                        position: relative;
                    }
                    .timeline-node {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        flex: 1;
                        position: relative;
                        z-index: 1;
                    }
                    .node-marker {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: #ffffff;
                        border: 2px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 0.75rem;
                        transition: all 0.3s ease;
                    }
                    .timeline-node.completed .node-marker {
                        background: #10b981;
                        border-color: #10b981;
                        color: white;
                    }
                    .timeline-node.active .node-marker {
                        border-color: #6366f1;
                        background: #6366f1;
                        color: white;
                        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
                    }
                    .node-pulse {
                        width: 8px;
                        height: 8px;
                        background: #6366f1;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    }
                    .node-connector {
                        position: absolute;
                        top: 16px;
                        left: 50%;
                        right: -50%;
                        height: 2px;
                        background: #f1f5f9;
                        z-index: -1;
                    }
                    .timeline-node.completed .node-connector {
                        background: #10b981;
                    }
                    .node-title {
                        font-size: 13px;
                        font-weight: 700;
                        color: #1e293b;
                        text-align: center;
                    }
                    .node-sub {
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 2px;
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                    }
                    .doc-item:hover {
                        background: #ffffff !important;
                        border-color: #6366f1 !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
                        transform: translateY(-2px);
                    }
                `}</style>
            </div>
        </div>
    );
};

export default DashboardCandidate;
