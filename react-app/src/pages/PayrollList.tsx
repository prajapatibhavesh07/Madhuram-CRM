import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { EyeIcon, CheckIcon, DownloadIcon, TrashIcon, SearchIcon, GripVerticalIcon, ChevronDownIcon, PlusIcon } from '../icons';
import Pagination from '../components/Pagination';
import Tooltip from '../components/Tooltip';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

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

const PayrollList = () => {
    const { user, activeRole } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [viewPayroll, setViewPayroll] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [wasValidated, setWasValidated] = useState(false);
    const itemsPerPage = 10;
    const canManagePayroll = user?.role === 'Admin' || user?.role === 'HR' || activeRole?.permissions?.payroll?.edit === true;

    // Confirmation State
    const [deletingPayrollId, setDeletingPayrollId] = useState<string | null>(null);
    const [confirmMarkPaidId, setConfirmMarkPaidId] = useState<string | null>(null);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');

    // Initial state for generating payroll
    const [formData, setFormData] = useState({
        userId: '',
        month: currentMonth,
        year: currentYear,
        basic: 0,
        hra: 0,
        allowances: 0,
        incentives: 0
    });

    useEffect(() => {
        fetchData();
    }, [filterMonth, filterYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.getPayrolls({
                month: filterMonth,
                year: filterYear
            });
            setPayrolls(data);
        } catch (error) {
            showToast('Failed to fetch payrolls', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterMonth, filterYear]);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error: any) {
            console.error('Failed to fetch users');
        }
    };

    const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);
        try {
            const payload = {
                userId: formData.userId,
                month: Number(formData.month),
                year: Number(formData.year),
                salaryComponents: {
                    basic: Number(formData.basic),
                    hra: Number(formData.hra),
                    allowances: Number(formData.allowances),
                    incentives: Number(formData.incentives)
                }
            };
            await api.generatePayroll(payload);
            showToast('Payroll generated successfully', 'success');
            setIsGenerateModalOpen(false);
            fetchData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleMarkPaid = async (id: string) => {
        setConfirmMarkPaidId(id);
    };

    const confirmMarkPaid = async () => {
        if (!confirmMarkPaidId) return;
        try {
            await api.updatePayrollStatus(confirmMarkPaidId, { status: 'Paid' });
            showToast('Marked as Paid', 'success');
            fetchData();
            setConfirmMarkPaidId(null);
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingPayrollId(id);
    };

    const confirmDelete = async () => {
        if (!deletingPayrollId) return;
        try {
            await api.deletePayroll(deletingPayrollId);
            showToast('Payroll record deleted', 'success');
            fetchData();
            setDeletingPayrollId(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete payroll', 'error');
        }
    };

    const handleDownloadPdf = async (pay: any) => {
        try {
            const blob = await api.downloadPayrollPdf(pay._id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip_${pay.userId.name}_${pay.month}_${pay.year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('Payslip downloaded successfully', 'success');
        } catch (error) {
            showToast('Failed to download payslip', 'error');
        }
    };

    const filteredPayrolls = payrolls.filter(pay => {
        const query = searchQuery.toLowerCase();
        return (
            pay.userId?.name?.toLowerCase().includes(query) ||
            pay.status?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
    const paginatedPayrolls = filteredPayrolls.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Removal of Access Denied block

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        Payroll Management
                        <span className="total-badge">
                            {filteredPayrolls.length} Total
                        </span>
                    </h3>
                    <p>Generate and manage monthly payrolls for employees.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search by employee or status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>

                    <div className="payroll-filters">
                        <select
                            className="input-field payroll-filter-select"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">All Months</option>
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            className="input-field payroll-filter-select payroll-filter-select--year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="">All Years</option>
                            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <button className="btn btn-primary" onClick={() => setIsGenerateModalOpen(true)}>
                        <PlusIcon size={18} className="mr-8" /> Generate Payroll
                    </button>
                </div>
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>
                                <div className="modern-th-content">
                                    <div className="modern-th-label">
                                        <GripVerticalIcon size={12} className="grip-icon" />
                                        MONTH / YEAR
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
                                        EMPLOYEE
                                    </div>
                                    <div className="th-actions-right">
                                        <button className="header-menu-trigger">
                                            <ChevronDownIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </th>
                            <th className="text-center">
                                <div className="modern-th-content" style={{ justifyContent: 'center' }}>
                                    <div className="modern-th-label" style={{ flex: 'none' }}>
                                        <GripVerticalIcon size={12} className="grip-icon" />
                                        DAYS
                                    </div>
                                </div>
                            </th>
                            <th className="text-right">
                                <div className="modern-th-content" style={{ justifyContent: 'flex-end' }}>
                                    <div className="modern-th-label" style={{ flex: 'none' }}>
                                        <GripVerticalIcon size={12} className="grip-icon" />
                                        NET SALARY
                                    </div>
                                </div>
                            </th>
                            <th>
                                <div className="modern-th-content">
                                    <div className="modern-th-label">
                                        <GripVerticalIcon size={12} className="grip-icon" />
                                        STATUS
                                    </div>
                                    <div className="th-actions-right">
                                        <button className="header-menu-trigger">
                                            <ChevronDownIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </th>
                            <th className="sticky-last">
                                <div className="modern-th-content">
                                    <div className="modern-th-label">ACTIONS</div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="loading-container">Loading...</td></tr>
                        ) : paginatedPayrolls.length === 0 ? (
                            <tr><td colSpan={6} className="empty-state-message">
                                {searchQuery ? `No payrolls matching "${searchQuery}"` : 'No payroll records found.'}
                            </td></tr>
                        ) : paginatedPayrolls.map(pay => (
                             <tr key={pay._id}>
                                <td>
                                    <div className="payroll-month-year text-semibold">
                                        {MONTHS[pay.month - 1].substring(0, 3)} {pay.year}
                                    </div>
                                </td>
                                <td>
                                    <div className="candidate-name-cell">
                                        <div className="candidate-avatar-mini">
                                            {pay.userId?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="candidate-name-link">
                                            <HighlightText text={pay.userId?.name} highlight={searchQuery} />
                                        </div>
                                    </div>
                                </td>
                                <td className="text-center">{pay.presentDays}</td>
                                <td className="text-right text-semibold text-blue">₹{pay.netSalary.toLocaleString()}</td>
                                <td>
                                    <div className={`status-badge ${pay.status === 'Paid' ? 'success' : 'warning'}`}>
                                        <div className="status-dot"></div>
                                        {pay.status}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex-row-gap-center">
                                        <Tooltip text="View Details"><button onClick={() => setViewPayroll(pay)} className="action-link"><EyeIcon size={18} /></button></Tooltip>
                                        <Tooltip text="Download Payslip"><button onClick={() => handleDownloadPdf(pay)} className="action-link action-link--primary"><DownloadIcon size={18} /></button></Tooltip>
                                        {canManagePayroll && pay.status !== 'Paid' && (
                                            <Tooltip text="Mark as Paid"><button onClick={() => handleMarkPaid(pay._id)} className="action-link action-link--success"><CheckIcon size={18} /></button></Tooltip>
                                        )}
                                        {canManagePayroll && (
                                            <Tooltip text="Delete Record">
                                                <button onClick={() => handleDelete(pay._id)} className="action-link action-link--danger">
                                                    <TrashIcon size={18} />
                                                </button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </td>
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

            {/* Generate Modal */}
            <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Payroll">
                <form onSubmit={handleGenerate} className={`compact-grid ${wasValidated ? 'was-validated' : ''}`} noValidate>
                    <div className="input-group full-width">
                        <label className="input-label">Select Employee</label>
                        <select
                            className="input-field"
                            value={formData.userId}
                            onChange={e => setFormData({ ...formData, userId: e.target.value })}
                            required
                        >
                            <option value="">Choose an employee...</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Month</label>
                        <select
                            className="input-field"
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: Number(e.target.value) })}
                            required
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Year</label>
                        <select
                            className="input-field"
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                            required
                        >
                            {Array.from({ length: 11 }, (_, i) => currentYear + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="full-width-section-header">
                        <h4 className="salary-components-title">Salary Components</h4>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Basic Pay</label>
                        <input type="number" className="input-field" value={formData.basic} onChange={e => setFormData({ ...formData, basic: Number(e.target.value) })} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">HRA</label>
                        <input type="number" className="input-field" value={formData.hra} onChange={e => setFormData({ ...formData, hra: Number(e.target.value) })} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Allowances</label>
                        <input type="number" className="input-field" value={formData.allowances} onChange={e => setFormData({ ...formData, allowances: Number(e.target.value) })} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Incentives</label>
                        <input type="number" className="input-field" value={formData.incentives} onChange={e => setFormData({ ...formData, incentives: Number(e.target.value) })} required />
                    </div>

                    <div className="form-footer-actions">
                        <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="btn btn-secondary modal-btn-auto">Cancel</button>
                        <button type="submit" className="btn btn-primary modal-btn-auto">Generate Statement</button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={!!viewPayroll}
                onClose={() => setViewPayroll(null)}
                title="Employee Payslip"
                footer={
                    <div className="modal-footer-actions full-width">
                        <button
                            onClick={() => handleDownloadPdf(viewPayroll)}
                            className="btn btn-primary flex-1-btn"
                        >
                            <DownloadIcon size={18} style={{ marginRight: '8px' }} />
                            Download Payslip
                        </button>
                        <button
                            onClick={() => setViewPayroll(null)}
                            className="btn btn-secondary modal-btn-auto"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {viewPayroll && (
                    <div className="flex-col-gap-125">
                        <div className="payslip-summary-box">
                            <div>
                                <label className="payslip-label">Employee Name</label>
                                <div className="payslip-value">{viewPayroll.userId?.name}</div>
                            </div>
                            <div className="text-right">
                                <label className="payslip-label">Payout Period</label>
                                <div className="payslip-value--bold">{MONTHS[viewPayroll.month - 1]} {viewPayroll.year}</div>
                            </div>
                            <div>
                                <label className="payslip-label">Total Present Days</label>
                                <div className="payslip-value--bold">{viewPayroll.presentDays} Days</div>
                            </div>
                            <div className="text-right">
                                <label className="payslip-label">Payment Status</label>
                                <div className={`payslip-value status-${viewPayroll.status.toLowerCase()}`}>{viewPayroll.status}</div>
                            </div>
                        </div>

                        <div className="compact-grid">
                            <div className="full-width">
                                <h4 className="payslip-section-title">Earnings Breakdown</h4>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">Basic Salary</span>
                                <span className="font-600">₹{viewPayroll.salaryComponents.basic.toLocaleString()}</span>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">HRA</span>
                                <span className="font-600">₹{viewPayroll.salaryComponents.hra.toLocaleString()}</span>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">Allowances</span>
                                <span className="font-600">₹{viewPayroll.salaryComponents.allowances.toLocaleString()}</span>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">Incentives</span>
                                <span className="font-600">₹{(viewPayroll.salaryComponents.incentives || 0).toLocaleString()}</span>
                            </div>
                            <div className="full-width payslip-row--total">
                                <span>Gross Earnings</span>
                                <span className="text-primary">₹{(viewPayroll.salaryComponents.basic + viewPayroll.salaryComponents.hra + viewPayroll.salaryComponents.allowances + (viewPayroll.salaryComponents.incentives || 0)).toLocaleString()}</span>
                            </div>

                            <div className="full-width payslip-section-divider">
                                <h4 className="payslip-section-title payslip-section-title--deductions">Deductions</h4>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">Provident Fund (PF)</span>
                                <span className="font-600 text-danger">₹{viewPayroll.deductions.pf.toLocaleString()}</span>
                            </div>
                            <div className="payslip-row">
                                <span className="text-muted">ESI</span>
                                <span className="font-600 text-danger">₹{viewPayroll.deductions.esi.toLocaleString()}</span>
                            </div>
                            <div className="full-width payslip-row--total">
                                <span>Total Deductions</span>
                                <span className="text-danger">₹{(viewPayroll.deductions.pf + viewPayroll.deductions.esi + (viewPayroll.deductions.tds || 0)).toLocaleString()}</span>
                            </div>

                            <div className="full-width payslip-net-box">
                                <span className="payslip-net-label">Net Payable Amount</span>
                                <span className="payslip-net-value">₹{viewPayroll.netSalary.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <DeleteConfirmationModal
                isOpen={!!deletingPayrollId}
                onClose={() => setDeletingPayrollId(null)}
                onConfirm={confirmDelete}
                itemName="this payroll record"
                itemType="payroll record"
            />

            <DeleteConfirmationModal
                isOpen={!!confirmMarkPaidId}
                onClose={() => setConfirmMarkPaidId(null)}
                onConfirm={confirmMarkPaid}
                itemName="this payroll as PAID"
                itemType="payroll payment"
            />
        </div>
    );
};

export default PayrollList;
