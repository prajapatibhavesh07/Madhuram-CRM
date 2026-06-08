import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import Tooltip from '../components/Tooltip';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AddAttendanceModal from '../components/AddAttendanceModal';
import { EyeIcon, TrashIcon, PlusIcon, SearchIcon, GripVerticalIcon, ChevronDownIcon, ClockIcon } from '../icons';
import { ModernStatsCard } from '../components/DashboardWidgets';

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

const AttendanceList = () => {
    const { user, activeRole } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const itemsPerPage = 10;

    // Delete Confirmation State
    const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const canViewAll = user?.role === 'Admin' || activeRole?.permissions?.attendance?.view === true;
    const canCreate = user?.role === 'Admin' || user?.role === 'HR' || activeRole?.permissions?.attendance?.create === true;
    const canDelete = user?.role === 'Admin' || user?.role === 'HR' || activeRole?.permissions?.attendance?.delete === true;

    useEffect(() => {
        fetchData();
    }, [viewMode, selectedMonth, selectedYear]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const myHistory = await api.getMyAttendance();
            const todayStr = new Date().toDateString();
            const today = myHistory.find((r: any) => {
                const recordDate = r.inTime ? new Date(r.inTime) : new Date(r.date);
                return recordDate.toDateString() === todayStr;
            });
            setTodayRecord(today);

            if (canViewAll && viewMode === 'all') {
                const allData = await api.getAttendance({ month: selectedMonth, year: selectedYear });
                setRecords(allData);
            } else {
                const filteredHistory = await api.getMyAttendance({ month: selectedMonth, year: selectedYear });
                setRecords(filteredHistory);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch attendance data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePunchIn = async () => {
        try {
            await api.punchIn();
            showToast('Punched In successfully', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handlePunchOut = async () => {
        try {
            await api.punchOut();
            showToast('Punched Out successfully', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingRecordId(id);
    };

    const confirmDelete = async () => {
        if (!deletingRecordId) return;
        try {
            await api.deleteAttendance(deletingRecordId);
            showToast('Attendance record deleted', 'success');
            fetchData();
            setDeletingRecordId(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete record', 'error');
        }
    };

    const filteredRecords = records.filter(rec => {
        const query = searchQuery.toLowerCase();
        return (
            rec.userId?.name?.toLowerCase().includes(query) ||
            rec.status?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPresent = records.filter(r => r.status === 'Present' || r.inTime).length;
    const totalLate = records.filter(r => r.status === 'Late').length;
    const avgHours = records.length > 0
        ? (records.reduce((acc, r) => acc + (parseFloat(r.totalHours) || 0), 0) / records.length).toFixed(1)
        : '0';

    return (
        <div className="attendance-dashboard fade-in">
            <div className="attendance-header-section">
                <div className="header-content">
                    <h1 className="page-main-title">Attendance Dashboard</h1>
                    <p className="page-subtitle">Monitor employee presence, work hours, and punch logs.</p>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <SearchIcon size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <div className="select-wrapper">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="standard-select"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon size={14} className="select-arrow" />
                        </div>
                        <div className="select-wrapper">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="standard-select"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDownIcon size={14} className="select-arrow" />
                        </div>
                    </div>

                    {canViewAll && (
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'my' ? 'active' : ''}`}
                                onClick={() => setViewMode('my')}
                            >
                                My Logs
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                                onClick={() => setViewMode('all')}
                            >
                                All Records
                            </button>
                        </div>
                    )}

                    {canCreate && (
                        <button className="btn-primary-indigo" onClick={() => setIsAddModalOpen(true)}>
                            <PlusIcon size={18} />
                            <span>Add Entry</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                <ModernStatsCard
                    title="Total Records"
                    value={records.length}
                    percent="+12.5"
                    icon={GripVerticalIcon}
                    chartData={[40, 30, 45, 50, 65, 55, 70]}
                    color="#6366f1"
                />
                <ModernStatsCard
                    title="Present Days"
                    value={totalPresent}
                    percent="+8.2"
                    icon={EyeIcon}
                    chartData={[50, 60, 55, 70, 80, 75, 90]}
                    color="#10b981"
                />
                <ModernStatsCard
                    title="Late Entries"
                    value={totalLate}
                    percent="-5.4"
                    icon={ClockIcon}
                    chartData={[30, 25, 20, 15, 25, 20, 10]}
                    color="#f59e0b"
                />
                <ModernStatsCard
                    title="Avg. Hours"
                    value={`${avgHours}h`}
                    percent="+2.1"
                    icon={GripVerticalIcon}
                    chartData={[6, 7, 8, 8.5, 7.5, 8, 8.2]}
                    color="#3b82f6"
                />
            </div>

            <div className="punch-controls-bar">
                {!todayRecord ? (
                    <div className="punch-banner in">
                        <div className="punch-message">
                            <div className="pulse-indicator"></div>
                            <span>You haven't punched in today. Ready to start your shift?</span>
                        </div>
                        <button className="punch-action-btn in" onClick={handlePunchIn}>
                            <ClockIcon size={18} />
                            Punch In Now
                        </button>
                    </div>
                ) : !todayRecord.outTime ? (
                    <div className="punch-banner active">
                        <div className="punch-message">
                            <div className="status-badge">ACTIVE</div>
                            <span>Punched in at <strong>{new Date(todayRecord.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </div>
                        <button className="punch-action-btn out" onClick={handlePunchOut}>
                            <ClockIcon size={18} />
                            Punch Out
                        </button>
                    </div>
                ) : (
                    <div className="punch-banner completed">
                        <div className="punch-message">
                            <div className="status-badge green">COMPLETED</div>
                            <span>Today's shift: <strong>{todayRecord.totalHours || '0'} hrs</strong> completed. See you tomorrow!</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>EMPLOYEE DETAILS</th>
                            <th>EMP ID</th>
                            <th>STATUS</th>
                            <th>CLOCK IN</th>
                            <th>CLOCK OUT</th>
                            <th>TOTAL HRS</th>
                            {canDelete && <th>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="loading-container">Loading...</td></tr>
                        ) : paginatedRecords.length === 0 ? (
                            <tr><td colSpan={7} className="empty-state-message">
                                {searchQuery ? `No records matching "${searchQuery}"` : 'No attendance records found.'}
                            </td></tr>
                        ) : paginatedRecords.map(rec => (
                            <tr key={rec._id}>
                                <td>
                                    <div className="emp-profile-cell">
                                        <div className="emp-avatar">
                                            {rec.userId?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="emp-meta">
                                            <div className="emp-name">
                                                <HighlightText text={rec.userId?.name} highlight={searchQuery} />
                                            </div>
                                            <div className="emp-dept">{rec.userId?.department || 'General'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="emp-id-badge">{rec.userId?.employeeId || 'D00000'}</span>
                                </td>
                                <td>
                                    <div className={`status-pill ${rec.status === 'Present' ? 'present' : 'late'}`}>
                                        {rec.status}
                                    </div>
                                </td>
                                <td>
                                    <div className="time-display in">
                                        {rec.inTime ? new Date(rec.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                </td>
                                <td>
                                    <div className="time-display out">
                                        {rec.outTime ? new Date(rec.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                </td>
                                <td>
                                    <div className="hours-badge">{rec.totalHours || '0'} hrs</div>
                                </td>
                                {canDelete && (
                                    <td>
                                        <div className="row-actions">
                                            <Tooltip text="Delete Record">
                                                <button className="icon-btn delete" onClick={() => handleDelete(rec._id)}>
                                                    <TrashIcon size={16} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredRecords.length > itemsPerPage && (
                <div className="pagination-wrapper">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={!!deletingRecordId}
                onClose={() => setDeletingRecordId(null)}
                onConfirm={confirmDelete}
                itemName="this attendance record"
                itemType="Attendance Record"
            />

            <AddAttendanceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            <style>{`
                .attendance-dashboard {
                    padding: 1.5rem;
                    background: #f8fafc;
                    min-height: 100vh;
                }

                .attendance-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }

                .page-main-title {
                    font-size: 1.875rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.025em;
                }

                .page-subtitle {
                    color: #64748b;
                    margin-top: 0.25rem;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-box {
                    position: relative;
                    min-width: 300px;
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .search-box input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.75rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .filter-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .select-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .standard-select {
                    appearance: none;
                    padding: 0.625rem 2.25rem 0.625rem 1rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    min-width: 140px;
                }

                .select-arrow {
                    position: absolute;
                    right: 0.75rem;
                    color: #94a3b8;
                    pointer-events: none;
                }

                .view-toggle {
                    display: flex;
                    background: #f1f5f9;
                    padding: 0.25rem;
                    border-radius: 0.75rem;
                    gap: 0.25rem;
                }

                .toggle-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toggle-btn.active {
                    background: white;
                    color: #6366f1;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .btn-primary-indigo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #6366f1;
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary-indigo:hover {
                    background: #4f46e5;
                    transform: translateY(-1px);
                }

                .punch-controls-bar {
                    margin-bottom: 1.5rem;
                }

                .punch-banner {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-radius: 1rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .punch-banner.active {
                    background: #f0f9ff;
                    border-color: #bae6fd;
                }

                .punch-banner.completed {
                    background: #f0fdf4;
                    border-color: #bbf7d0;
                }

                .punch-message {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #475569;
                    font-size: 0.9375rem;
                }

                .status-badge {
                    background: #3b82f6;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                }

                .status-badge.green {
                    background: #10b981;
                }

                .pulse-indicator {
                    width: 10px;
                    height: 10px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .punch-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .punch-action-btn.in {
                    background: #ef4444;
                    color: white;
                }

                .punch-action-btn.out {
                    background: #64748b;
                    color: white;
                }

                .modern-table-container {
                    background: white;
                    border-radius: 1rem;
                    border: 1px solid #e2e8f0;
                    overflow: auto;
                    max-height: calc(100vh - 420px);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    position: relative;
                }

                .modern-table-container::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }

                .modern-table-container::-webkit-scrollbar-track {
                    background: transparent;
                }

                .modern-table-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }

                .modern-table-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .modern-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .modern-table thead th {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: #f8fafc;
                    padding: .5rem;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                }

                .modern-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: middle;
                }

                .emp-profile-cell {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .emp-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: #eef2ff;
                    color: #6366f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1rem;
                }

                .emp-name {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 0.9375rem;
                }

                .emp-dept {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.125rem;
                }

                .emp-id-badge {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #475569;
                    background: #f1f5f9;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.5rem;
                }

                .status-pill {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .status-pill.present { background: #dcfce7; color: #166534; }
                .status-pill.late { background: #fee2e2; color: #991b1b; }

                .time-display {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .time-display.in { color: #10b981; }
                .time-display.out { color: #64748b; }

                .hours-badge {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 0.9375rem;
                }

                .row-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn.delete { color: #f43f5e; }
                .icon-btn.delete:hover { background: #fff1f2; }

                .loading-container, .empty-state-message {
                    text-align: center;
                    padding: 4rem !important;
                    color: #94a3b8;
                    font-style: italic;
                }

                .search-highlight {
                    background: #fef08a;
                    color: #854d0e;
                    padding: 0 2px;
                    border-radius: 2px;
                }

                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AttendanceList;
