import { useState, useEffect } from 'react';
import { api, BASE_URL } from '../services/api';
import {
    SearchIcon, BriefcaseIcon, ChevronDownIcon, GripVerticalIcon, FileTextIcon, EditIcon
} from '../icons';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useRef } from 'react';

const isCrtOrExpAlert = (dateStr: string) => {
    if (!dateStr) return false;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const today = new Date();
        const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const diffTime = dToday.getTime() - dDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return diffDays >= 0 && diffDays <= 2;
    } catch (e) {
        return false;
    }
};

const OperationDesk = () => {
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);
    const { showToast } = useToast();
    const [jobs, setJobs] = useState<any[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingOperation, setEditingOperation] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showCompanyMenu, setShowCompanyMenu] = useState(false);
    const companyMenuRef = useRef<HTMLDivElement>(null);

    const [operationFormData, setOperationFormData] = useState({
        companies: [] as string[],
        tickets: [] as any[],
        date: new Date().toISOString().split('T')[0],
        verify: '',
        noPoachInCV: '',
        removeNoPoach: '',
        readyToMove: '',
        vehicle: '',
        graduation: '',
        degreeCertificate: '',
        rehiring: '',
        remark: ''
    });

    const fetchData = async () => {
        try {
            const data = await api.getOperations();
            setOperations(data);
        } catch (error) {
            console.error("Failed to fetch operations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const data = await api.getJobs({ status: 'Open' });
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchJobs();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (companyMenuRef.current && !companyMenuRef.current.contains(event.target as Node)) {
                setShowCompanyMenu(false);
            }
        };
        if (showCompanyMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCompanyMenu]);

    const handleEditClick = (op: any) => {
        setEditingOperation(op);
        const candidateTickets = op.candidateId?.tickets || [];
        const initialTickets = (op.companies || []).map((comp: string) => {
            const existing = candidateTickets.find((t: any) => t.companyName === comp);
            if (existing) return existing;

            const job = jobs.find(j => j.company === comp);
            const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
            const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

            const uploadDate = new Date();

            const expDate = new Date(uploadDate);
            expDate.setDate(expDate.getDate() + expiryDays);

            const crtDate = new Date(uploadDate);
            crtDate.setDate(crtDate.getDate() + crtDays);

            return {
                companyName: comp,
                uploaddate: uploadDate.toISOString().split('T')[0],
                crtdate: crtDate.toISOString().split('T')[0],
                expdate: expDate.toISOString().split('T')[0],
                type: 'Banca',
                portalStatus: 'Pending'
            };
        });

        setOperationFormData({
            companies: op.companies || [],
            tickets: initialTickets,
            date: op.date ? new Date(op.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            verify: op.verify || '',
            noPoachInCV: op.noPoachInCV || '',
            removeNoPoach: op.removeNoPoach || '',
            readyToMove: op.readyToMove || '',
            vehicle: op.vehicle || '',
            graduation: op.graduation || '',
            degreeCertificate: op.degreeCertificate || '',
            rehiring: op.rehiring || '',
            remark: op.remark || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingOperation) return;
        setSubmitting(true);
        try {
            const payload = {
                candidateId: editingOperation.candidateId._id,
                ...operationFormData,
                tickets: operationFormData.tickets
            };
            await api.assignToOperation(payload);
            showToast('Operation record updated successfully', 'success');
            setShowEditModal(false);
            fetchData();
        } catch (error: any) {
            console.error("Save error:", error);
            showToast(error.message || 'Failed to update record', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredOperations = operations.filter(op => {
        if (!op.candidateId) return false;
        const candidateName = op.candidateId.name?.toLowerCase() || '';
        const companyList = (op.companies || []).join(' ').toLowerCase();
        return candidateName.includes(searchQuery.toLowerCase()) || companyList.includes(searchQuery.toLowerCase());
    });

    const renderYesNoBadge = (value: string) => {
        if (value === 'Yes') {
            return <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Yes</span>;
        } else if (value === 'No') {
            return <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>No</span>;
        }
        return '-';
    };

    const handleTicketStatusChange = async (candidateId: string, ticketNo: string, newStatus: string) => {
        try {
            setOperations(prevOps => prevOps.map(op => {
                if (op.candidateId?._id === candidateId) {
                    const updatedCandidate = {
                        ...op.candidateId,
                        tickets: op.candidateId.tickets.map((t: any) =>
                            t.ticketNo === ticketNo ? { ...t, portalStatus: newStatus } : t
                        )
                    };
                    return { ...op, candidateId: updatedCandidate };
                }
                return op;
            }));

            const candidate = operations.find(op => op.candidateId?._id === candidateId)?.candidateId;
            if (!candidate) return;

            const updatedTickets = candidate.tickets.map((t: any) =>
                t.ticketNo === ticketNo ? { ...t, portalStatus: newStatus } : t
            );

            await api.updateCandidate(candidateId, { tickets: updatedTickets });
            showToast('Ticket status updated', 'success');
        } catch (error: any) {
            fetchData();
            showToast(error.message || 'Failed to update ticket status', 'error');
        }
    };

    const pendingAlertTickets = operations.flatMap(op => op.candidateId?.tickets || []).filter((t: any) => {
        const isTicketEmpty = !t.ticketNo?.trim();
        const isDateMatch = isCrtOrExpAlert(t.crtdate) || isCrtOrExpAlert(t.expdate);
        const isNotUpdated = t.portalStatus !== 'Complete' && t.portalStatus !== 'Completed';
        return isTicketEmpty || (isDateMatch && isNotUpdated);
    });

    return (
        <div className="page-container fade-in">
            {pendingAlertTickets.length > 0 && (
                <div className="ticket-warning-banner" style={{
                    margin: '0 0 1.5rem 0',
                    padding: '1rem 1.25rem',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#fee2e2', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#ef4444', flexShrink: 0
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#991b1b' }}>
                            Pending Tickets Attention Required ({pendingAlertTickets.length})
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                            Some tickets have empty numbers or dates matching/approaching today. Admin, managers, team leads, and recruiters should update them immediately.
                        </p>
                    </div>
                </div>
            )}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <div className="page-title-icon">
                            <BriefcaseIcon size={24} />
                        </div>
                        Operation Desk
                    </h1>
                    <p className="page-subtitle">Centralized management for candidate operational assignments</p>
                </div>

                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search by candidate or company..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card zoom-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="modern-table-container" style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            CANDIDATE
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            ASSIGNMENT DETAILS
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th style={{ minWidth: '220px' }}>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            ACTIVE TICKETS
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            CHECKLIST
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            ASSIGNMENT INFO
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">DOCUMENTS</div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                                        <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Syncing operations data...</div>
                                    </td>
                                </tr>
                            ) : filteredOperations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📂</div>
                                        <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>No results found</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{searchQuery ? `Try adjusting your search for "${searchQuery}"` : 'Ops queue is currently empty.'}</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOperations.map(op => {
                                    const candidate = op.candidateId || {};
                                    const initials = candidate.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

                                    return (
                                        <tr key={op._id}>
                                            <td style={{ paddingLeft: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="candidate-avatar-mini">
                                                        {candidate.photograph?.fileUrl ? (
                                                            <img
                                                                src={candidate.photograph.fileUrl.startsWith('http') ? candidate.photograph.fileUrl : `${BASE_URL}${candidate.photograph.fileUrl}`}
                                                                alt={candidate.name}
                                                                className="candidate-avatar-img"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : initials}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{candidate.name || '-'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {candidate.phone || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Date Filed:</span>
                                                    <span style={{ fontWeight: 600 }}>{new Date(op.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {op.companies?.map((c: string, i: number) => (
                                                        <span key={i} className="company-tag-mini">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                                    {candidate.tickets?.filter((t: any) => op.companies?.includes(t.companyName)).length > 0 ? (
                                                        candidate.tickets.filter((t: any) => op.companies?.includes(t.companyName)).map((t: any, i: number) => {
                                                            const statusColor = t.portalStatus === 'Completed' ? '#10b981' : t.portalStatus === 'Duplicate' ? '#6366f1' : '#f59e0b';
                                                            return (
                                                                <div key={i} className="ticket-card-mini">
                                                                    {/* Status strip */}
                                                                    <div className="ticket-status-strip" style={{ background: statusColor }}></div>

                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                                        <div>
                                                                            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>{t.ticketNo}</div>
                                                                            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem' }}>{t.companyName}</div>
                                                                        </div>
                                                                        <select
                                                                            value={t.portalStatus || 'Pending'}
                                                                            onChange={(e) => handleTicketStatusChange(candidate._id, t.ticketNo, e.target.value)}
                                                                            className="ticket-status-select"
                                                                        >
                                                                            <option value="Pending">Pending</option>
                                                                            <option value="Completed">Completed</option>
                                                                            <option value="Duplicate">Duplicate</option>
                                                                        </select>
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                            <span>Upload:</span>
                                                                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{t.uploaddate ? new Date(t.uploaddate).toLocaleDateString() : '-'}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                            <span>Expiry:</span>
                                                                            <span style={{ color: t.expdate && new Date(t.expdate) < new Date() ? '#ef4444' : 'var(--text-main)', fontWeight: 500 }}>{t.expdate ? new Date(t.expdate).toLocaleDateString() : '-'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>No active tickets</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Verify Field:</span>
                                                        {renderYesNoBadge(op.verify)}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Ready Move:</span>
                                                        {renderYesNoBadge(op.readyToMove)}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
                                                        {renderYesNoBadge(op.vehicle)}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Graduation:</span>
                                                        {renderYesNoBadge(op.graduation)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remark</div>
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-main)',
                                                        maxWidth: '180px',
                                                        lineHeight: '1.4',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: '2',
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }} title={op.remark}>
                                                        {op.remark || '-'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>By:</span>
                                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{op.assignedBy?.name || 'System'}</span>
                                                </div>
                                            </td>
                                            <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleEditClick(op)}
                                                        className="icon-btn-modern"
                                                        title="Edit Assignment"
                                                    >
                                                        <EditIcon size={18} />
                                                    </button>
                                                    {candidate.offerLetter && (
                                                        <button
                                                            onClick={() => setPreviewDoc({ url: `${BASE_URL}${candidate.offerLetter.fileUrl}`, name: candidate.offerLetter.fileName })}
                                                            className="icon-btn-modern"
                                                            title="Experience Letter"
                                                        >
                                                            <FileTextIcon size={18} />
                                                        </button>
                                                    )}
                                                    {candidate.relativeLetter && (
                                                        <button
                                                            onClick={() => setPreviewDoc({ url: `${BASE_URL}${candidate.relativeLetter.fileUrl}`, name: candidate.relativeLetter.fileName })}
                                                            className="icon-btn-modern secondary"
                                                            title="Relieving Letter"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                        </button>
                                                    )}
                                                    {!candidate.offerLetter && !candidate.relativeLetter && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No Files</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url}
                    fileName={previewDoc.name}
                />
            )}

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Operation Ticket Management - ${editingOperation?.candidateId?.name}`}
                maxWidth="900px"
                footer={
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', width: 'auto' }} onClick={() => setShowEditModal(false)} disabled={submitting}>Cancel</button>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', width: 'auto' }} onClick={handleSaveEdit} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                }
            >
                {editingOperation && (
                    <div className="fade-in" style={{ padding: '0.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }} ref={companyMenuRef}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>COMPANY (MULTI-SELECT)</label>
                                <div
                                    onClick={(e) => { e.stopPropagation(); setShowCompanyMenu(!showCompanyMenu); }}
                                    style={{
                                        borderRadius: '6px', minHeight: '38px', padding: '5px 10px',
                                        background: '#fff', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'space-between',
                                        border: '1px solid #d1d5db'
                                    }}
                                >
                                    <span style={{ color: operationFormData.companies.length === 0 ? '#9ca3af' : '#1e293b', fontSize: '0.875rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                                        {operationFormData.companies.length === 0 ? 'Select companies...' : operationFormData.companies.join(', ')}
                                    </span>
                                    <ChevronDownIcon size={16} />
                                </div>
                                {showCompanyMenu && (
                                    <>
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                            marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)', padding: '6px'
                                        }}>
                                            {[...new Set(jobs.filter(j => j.status === 'Open').map(j => j.company))].filter(Boolean).sort().map(company => (
                                                <div
                                                    key={company}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const companyName = company;
                                                        if (!operationFormData.companies.includes(companyName)) {
                                                            const existingT = (editingOperation.candidateId?.tickets || []).find((t: any) => t.companyName === companyName);

                                                            const job = jobs.find(j => j.company === companyName);
                                                            const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
                                                            const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

                                                            const uploadDate = new Date();

                                                            const expDate = new Date(uploadDate);
                                                            expDate.setDate(expDate.getDate() + expiryDays);

                                                            const crtDate = new Date(uploadDate);
                                                            crtDate.setDate(crtDate.getDate() + crtDays);

                                                            setOperationFormData(p => ({
                                                                ...p,
                                                                companies: [...p.companies, companyName],
                                                                tickets: existingT ? [...p.tickets, existingT] : [...p.tickets, {
                                                                    companyName,
                                                                    uploaddate: uploadDate.toISOString().split('T')[0],
                                                                    crtdate: crtDate.toISOString().split('T')[0],
                                                                    expdate: expDate.toISOString().split('T')[0],
                                                                    type: 'Banca',
                                                                    portalStatus: 'Pending'
                                                                }]
                                                            }));
                                                        } else {
                                                            setOperationFormData(p => ({
                                                                ...p,
                                                                companies: p.companies.filter(x => x !== companyName),
                                                                tickets: p.tickets.filter(t => t.companyName !== companyName)
                                                            }));
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '9px 12px', fontSize: '0.875rem', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        borderRadius: '6px',
                                                        background: operationFormData.companies.includes(company) ? '#eff6ff' : 'transparent',
                                                        color: operationFormData.companies.includes(company) ? '#3b82f6' : '#1e293b',
                                                        fontWeight: operationFormData.companies.includes(company) ? '600' : 'normal'
                                                    }}
                                                >
                                                    {company}
                                                    {operationFormData.companies.includes(company) && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>DATE FILED</label>
                                <input
                                    type="date" className="input-field"
                                    style={{ border: '1px solid #d1d5db', borderRadius: '6px', height: '38px' }}
                                    value={operationFormData.date}
                                    onChange={e => setOperationFormData({ ...operationFormData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Tickets Management */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                <FileTextIcon size={15} />
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Tickets Management </span>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(80px, 1fr) minmax(130px, 1.3fr) minmax(105px, 1fr) minmax(105px, 1fr) minmax(105px, 1fr) minmax(80px, 0.8fr) minmax(120px, 1.2fr) minmax(40px, 0.4fr)',
                                    background: '#f8fafc', padding: '8px 12px',
                                    borderBottom: '1px solid #e2e8f0', gap: '8px'
                                }}>
                                    {['TICKET NO', 'COMPANY', 'UPLOAD DATE', 'EXP. DATE', 'CRT DATE', 'TYPE', 'STATUS CHANGES', ''].map((h, i) => (
                                        <span key={i} style={{ fontSize: '0.64rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</span>
                                    ))}
                                </div>
                                {/* Rows */}
                                {operationFormData.companies.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        No tickets to manage. Select a company first.
                                    </div>
                                ) : (
                                    operationFormData.companies.map((company) => {
                                        const tIdx = operationFormData.tickets.findIndex(t => t.companyName === company);
                                        const ticket = tIdx >= 0 ? operationFormData.tickets[tIdx] : {
                                            ticketNo: '', companyName: company, uploaddate: new Date().toISOString().split('T')[0], expdate: '', crtdate: new Date().toISOString().split('T')[0], type: 'Banca', portalStatus: 'Pending'
                                        };
                                        const inputStyle: React.CSSProperties = { padding: '4px 7px', border: '1px solid #e2e8f0', borderRadius: '5px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' };

                                        const updateField = (field: string, val: string) => {
                                            const newTickets = [...operationFormData.tickets];
                                            const idx = newTickets.findIndex(t => t.companyName === company);
                                            if (idx >= 0) {
                                                newTickets[idx] = { ...newTickets[idx], [field]: val };
                                            } else {
                                                newTickets.push({ ...ticket, [field]: val });
                                            }
                                            setOperationFormData({ ...operationFormData, tickets: newTickets });
                                        };

                                        const isTicketEmpty = !ticket.ticketNo?.trim();
                                        const isExpDateAlert = isCrtOrExpAlert(ticket.expdate);
                                        const isCrtDateAlert = isCrtOrExpAlert(ticket.crtdate);
                                        const isDateMatch = isExpDateAlert || isCrtDateAlert;
                                        const isNotUpdated = ticket.portalStatus !== 'Complete' && ticket.portalStatus !== 'Completed';
                                        const isAlertRow = isDateMatch && isNotUpdated;

                                        const rowStyle: React.CSSProperties = {
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(80px, 1fr) minmax(130px, 1.3fr) minmax(105px, 1fr) minmax(105px, 1fr) minmax(105px, 1fr) minmax(80px, 0.8fr) minmax(120px, 1.2fr) minmax(40px, 0.4fr)',
                                            padding: '8px 12px',
                                            gap: '8px',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                            margin: (isTicketEmpty || isAlertRow) ? '6px 4px' : '0',
                                            border: isTicketEmpty
                                                ? '1px solid #ef4444'
                                                : (isAlertRow ? '1px solid #ef4444' : '1px solid transparent'),
                                            borderBottom: (isTicketEmpty || isAlertRow) ? '1px solid #ef4444' : '1px solid #f1f5f9',
                                            borderRadius: (isTicketEmpty || isAlertRow) ? '8px' : '0',
                                            background: isTicketEmpty ? '#fef2f2' : '#ffffff'
                                        };

                                        return (
                                            <div key={company} style={rowStyle}>
                                                <input
                                                    type="text"
                                                    value={ticket.ticketNo || ''}
                                                    onChange={e => updateField('ticketNo', e.target.value)}
                                                    placeholder="TKT-001"
                                                    style={{
                                                        ...inputStyle,
                                                        border: isTicketEmpty ? '1px solid #ef4444' : '1px solid #e2e8f0'
                                                    }}
                                                />

                                                <div style={{ padding: '4px 7px', background: '#eff6ff', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.companyName}>{ticket.companyName}</div>

                                                <input type="date" value={ticket.uploaddate || ''} onChange={e => {
                                                    const uploadDateStr = e.target.value;
                                                    const job = jobs.find(j => j.company === ticket.companyName);

                                                    const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
                                                    const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

                                                    let expDateStr = ticket.expdate || '';
                                                    let crtDateStr = ticket.crtdate || '';

                                                    if (uploadDateStr) {
                                                        const date = new Date(uploadDateStr);

                                                        // Calculate Expiry Date
                                                        const expDate = new Date(date);
                                                        expDate.setDate(expDate.getDate() + expiryDays);
                                                        expDateStr = expDate.toISOString().split('T')[0];

                                                        // Calculate CRT Date
                                                        const crtDate = new Date(date);
                                                        crtDate.setDate(crtDate.getDate() + crtDays);
                                                        crtDateStr = crtDate.toISOString().split('T')[0];
                                                    }

                                                    const newTickets = [...operationFormData.tickets];
                                                    const idx = newTickets.findIndex(t => t.companyName === company);
                                                    if (idx >= 0) {
                                                        newTickets[idx] = { ...newTickets[idx], uploaddate: uploadDateStr, expdate: expDateStr, crtdate: crtDateStr };
                                                    } else {
                                                        newTickets.push({ ...ticket, uploaddate: uploadDateStr, expdate: expDateStr, crtdate: crtDateStr });
                                                    }
                                                    setOperationFormData({ ...operationFormData, tickets: newTickets });
                                                }} style={inputStyle} />

                                                <input
                                                    type="date"
                                                    value={ticket.expdate || ''}
                                                    readOnly
                                                    style={{
                                                        ...inputStyle,
                                                        background: '#f1f5f9',
                                                        color: ticket.expdate && new Date(ticket.expdate) < new Date() ? '#ef4444' : '#64748b',
                                                        cursor: 'not-allowed',
                                                        border: isExpDateAlert ? '1px solid #ef4444' : '1px solid #e2e8f0'
                                                    }}
                                                />

                                                <input
                                                    type="date"
                                                    value={ticket.crtdate || ''}
                                                    onChange={e => updateField('crtdate', e.target.value)}
                                                    style={{
                                                        ...inputStyle,
                                                        border: isCrtDateAlert ? '1px solid #ef4444' : '1px solid #e2e8f0'
                                                    }}
                                                />

                                                <select value={ticket.type || 'Banca'} onChange={e => updateField('type', e.target.value)} style={{ ...inputStyle, padding: '4px 18px 4px 5px' }}>
                                                    <option value="Banca">Banca</option>
                                                    <option value="Agency">Agency</option>
                                                    <option value="Direct">Direct</option>
                                                </select>

                                                <select value={ticket.portalStatus || 'Pending'} onChange={e => updateField('portalStatus', e.target.value)} style={{ ...inputStyle, padding: '4px 18px 4px 5px' }}>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Complete">Complete</option>
                                                    <option value="Duplicate">Duplicate</option>
                                                </select>

                                                <div style={{ textAlign: 'center' }}>
                                                    <button type="button" onClick={() => {
                                                        setOperationFormData(p => ({
                                                            ...p,
                                                            companies: p.companies.filter(c => c !== ticket.companyName),
                                                            tickets: p.tickets.filter(t => t.companyName !== company)
                                                        }));
                                                    }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>×</button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Fulfillment Checklist */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Fulfillment Checklist</div>
                            <div className="checklist-grid">
                                {[
                                    { key: 'verify', label: 'Verify Field' },
                                    { key: 'noPoachInCV', label: 'No Poach in CV' },
                                    { key: 'removeNoPoach', label: 'Remove No Poach' },
                                    { key: 'readyToMove', label: 'Ready to Move' },
                                    { key: 'vehicle', label: 'Vehicle' },
                                    { key: 'graduation', label: 'Graduation' },
                                    { key: 'degreeCertificate', label: 'Degree Certificate' },
                                    { key: 'rehiring', label: 'Rehiring' }
                                ].map(field => (
                                    <div key={field.key} className="checklist-item">
                                        <div className="checklist-label">{field.label}</div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            {['Yes', 'No'].map(v => (
                                                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>
                                                    <input
                                                        type="radio"
                                                        name={`edit_op_${field.key}`}
                                                        value={v}
                                                        checked={(operationFormData as any)[field.key] === v}
                                                        onChange={() => setOperationFormData({ ...operationFormData, [field.key]: v })}
                                                        style={{ accentColor: '#3b82f6' }}
                                                    />
                                                    {v}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operation Remark */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>OPERATION REMARK</label>
                            <textarea
                                className="input-field"
                                placeholder="Add any operational notes here..."
                                style={{ height: '80px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                value={operationFormData.remark}
                                onChange={e => setOperationFormData({ ...operationFormData, remark: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                .icon-btn-modern {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    border: 1px solid rgba(0, 120, 198, 0.2);
                    background: rgba(0, 120, 198, 0.05);
                    color: var(--primary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn-modern:hover {
                    background: var(--primary);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 120, 198, 0.2);
                }
                .icon-btn-modern.secondary {
                    border-color: rgba(100, 116, 139, 0.2);
                    background: rgba(100, 116, 139, 0.05);
                    color: #64748b;
                }
                .icon-btn-modern.secondary:hover {
                    background: #64748b;
                    color: white;
                    border-color: #64748b;
                    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2);
                }
                .support-link:hover {
                    color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
};

export default OperationDesk;
