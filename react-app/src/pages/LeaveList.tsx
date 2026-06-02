import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { CheckIcon, TrashIcon, SearchIcon, GripVerticalIcon, ChevronDownIcon, PlusIcon } from '../icons';
import Pagination from '../components/Pagination';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const HighlightText = ({ text, highlight }: { text: string | number, highlight: string }) => {
    const stringText = text?.toString() || '';
    if (!highlight.trim()) return <>{stringText}</>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = stringText.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="search-highlight">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const LeaveList = () => {
    const { user, activeRole } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [balances, setBalances] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Delete/Action Confirmation State
    const [deletingLeaveId, setDeletingLeaveId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string, status: string } | null>(null);
    const [wasValidated, setWasValidated] = useState(false);

    const canViewAll = user?.role === 'Admin' || user?.role === 'HR' || activeRole?.permissions?.leaves?.view === true;
    const canManage = user?.role === 'Admin' || user?.role === 'HR' || activeRole?.permissions?.leaves?.edit === true;

    const [formData, setFormData] = useState({
        type: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        fetchData();
        if (viewMode === 'my') fetchBalance();
    }, [viewMode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (canViewAll && viewMode === 'all') {
                const data = await api.getLeaves();
                setLeaves(data);
            } else {
                const data = await api.getMyLeaves();
                setLeaves(data);
            }
        } catch (error) {
            showToast('Failed to fetch leaves', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const data = await api.getLeaveBalance();
            setBalances(data);
        } catch (error) {
            console.error('Failed to fetch balance');
        }
    };

    const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);

        try {
            await api.applyLeave(formData);
            showToast('Leave applied successfully', 'success');
            setIsModalOpen(false);
            fetchData();
            setFormData({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    // Calculate today's date in YYYY-MM-DD for the min attribute
    const todayStr = new Date().toISOString().split('T')[0];

    const handleStatusUpdate = (id: string, status: string) => {
        setConfirmAction({ id, status });
    };

    const confirmStatusUpdate = async () => {
        if (!confirmAction) return;
        try {
            await api.updateLeaveStatus(confirmAction.id, { status: confirmAction.status });
            showToast(`Leave ${confirmAction.status} `, 'success');
            fetchData();
            setConfirmAction(null);
        } catch (error: any) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingLeaveId(id);
    };

    const confirmDelete = async () => {
        if (!deletingLeaveId) return;
        try {
            await api.deleteLeave(deletingLeaveId);
            showToast('Leave request deleted', 'success');
            fetchData();
            setDeletingLeaveId(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete leave', 'error');
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        const query = searchQuery.toLowerCase();
        return (
            leave.userId?.name?.toLowerCase().includes(query) ||
            leave.type?.toLowerCase().includes(query) ||
            leave.status?.toLowerCase().includes(query) ||
            leave.reason?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const counts = useMemo(() => {
        return {
            total: filteredLeaves.length,
            pending: filteredLeaves.filter(l => l.status === 'Pending').length,
            approved: filteredLeaves.filter(l => l.status === 'Approved').length,
            rejected: filteredLeaves.filter(l => l.status === 'Rejected').length
        };
    }, [filteredLeaves]);

    const totalColumns = viewMode === 'all' || canManage ? (viewMode === 'all' ? 8 : 7) : 7;

    return (
        <div className="candidate-list-page">
            {canViewAll && (
                <div className="candidate-list-tabs">
                    <button
                        onClick={() => setViewMode('my')}
                        className={`candidate-tab-btn ${viewMode === 'my' ? 'active' : ''}`}
                    >
                        My Leaves
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`candidate-tab-btn ${viewMode === 'all' ? 'active' : ''}`}
                    >
                        All Requests
                    </button>
                </div>
            )}

            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        Leave Management
                        <span className="total-badge">
                            {counts.total} Total
                        </span>
                        {canManage && viewMode === 'all' && counts.pending > 0 && (
                            <span className="total-badge warning">
                                {counts.pending} Pending
                            </span>
                        )}
                    </h3>
                    <p>Apply and manage leave requests for yourself or your team.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search leaves..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <PlusIcon size={18} className="mr-8" /> Apply Leave
                    </button>
                </div>
            </div>

            {/* Balances Section */}
            {viewMode === 'my' && balances && (
                <div className="leave-balances-grid">
                    <BalanceCard title="Casual Leave" used={balances.used.casualLeave} total={balances.casualLeave} />
                    <BalanceCard title="Sick Leave" used={balances.used.sickLeave} total={balances.sickLeave} />
                    <BalanceCard title="Earned Leave" used={balances.used.earnedLeave} total={balances.earnedLeave} />
                </div>
            )}

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            {viewMode === 'all' && (
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            Employee
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            )}
                            <th>
                                <div className="modern-th-content">
                                    <div className="modern-th-label">
                                        <GripVerticalIcon size={12} className="grip-icon" />
                                        Type
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
                                        From
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
                                        To
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
                                        Days
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
                                        Reason
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
                                        Status
                                    </div>
                                    <div className="th-actions-right">
                                        <button className="header-menu-trigger">
                                            <ChevronDownIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </th>
                            {(viewMode === 'all' || canManage) && (
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">Actions</div>
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={totalColumns} className="loading-container">Loading...</td></tr>
                        ) : paginatedLeaves.length === 0 ? (
                            <tr><td colSpan={totalColumns} className="empty-state-message">
                                {searchQuery ? `No leaves matching "${searchQuery}"` : 'No leave records found.'}
                            </td></tr>
                        ) : paginatedLeaves.map(leave => (
                            <tr key={leave._id}>
                                {viewMode === 'all' && (
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">
                                                {leave.userId?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="employee-name">
                                                <HighlightText text={leave.userId?.name} highlight={searchQuery} />
                                            </div>
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <div className="leave-type-text">
                                        <HighlightText text={leave.type} highlight={searchQuery} />
                                    </div>
                                </td>
                                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                                <td>{leave.daysCount}</td>
                                <td className="leave-reason-cell">
                                    <HighlightText text={leave.reason} highlight={searchQuery} />
                                </td>
                                <td>
                                    <div className={`status-badge ${leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}`}>
                                        <div className="status-indicator"></div>
                                        <HighlightText text={leave.status} highlight={searchQuery} />
                                    </div>
                                </td>
                                {(viewMode === 'all' || canManage) && (
                                    <td className="sticky-last">
                                        <div className="flex-row-gap-center">
                                            {leave.status === 'Pending' && viewMode === 'all' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} className="action-btn" title="Approve"><CheckIcon size={16} /></button>
                                                    <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} className="action-btn action-btn--delete" title="Reject"><TrashIcon size={16} /></button>
                                                </>
                                            )}
                                            {leave.status === 'Pending' && (
                                                <button onClick={() => handleDelete(leave._id)} className="action-btn action-btn--delete" title="Delete Request">
                                                    <TrashIcon size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Apply for Leave"
                subtitle="Submit a new leave request"
                size="md"
                footer={
                    <>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button form="leave-form" type="submit" className="btn btn-primary">Submit Request</button>
                    </>
                }
            >
                <form id="leave-form" onSubmit={handleApply} className={`modal-form-grid ${wasValidated ? 'was-validated' : ''}`} noValidate>
                    <div className="input-group full-width">
                        <label className="input-label">Leave Type</label>
                        <select
                            className="input-field"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option>Casual Leave</option>
                            <option>Sick Leave</option>
                            <option>Earned Leave</option>
                            <option>Comp Off</option>
                            <option>Maternity Leave</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.startDate}
                            min={todayStr}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">End Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.endDate}
                            min={formData.startDate || todayStr}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group full-width">
                        <label className="input-label">Reason for Absence</label>
                        <textarea
                            className="input-field"
                            style={{ minHeight: '100px' }}
                            placeholder="Please provide a brief reason for your leave request..."
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            required
                        ></textarea>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmationModal
                isOpen={!!deletingLeaveId}
                onClose={() => setDeletingLeaveId(null)}
                onConfirm={confirmDelete}
                itemName="this leave request"
                itemType="leave request"
            />

            <DeleteConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmStatusUpdate}
                itemName={`this leave request as ${confirmAction?.status}`}
                itemType="leave status update"
            />
        </div>
    );
};

const BalanceCard = ({ title, used, total }: { title: string, used: number, total: number }) => (
    <div className="glass-card leave-balance-card">
        <div className="leave-balance-title">{title}</div>
        <div className="leave-balance-value">{total - used}</div>
        <div className="leave-balance-footer">Total: {total}</div>
    </div>
);

export default LeaveList;
