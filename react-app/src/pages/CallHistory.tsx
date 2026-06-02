import React, { useState, useEffect } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Papa from 'papaparse';
import {
    PhoneIcon, PlusIcon, SearchIcon,
    TrashIcon, EditIcon, XIcon, MapPinIcon,
    UploadIcon, ChevronDownIcon, ClockIcon
} from '../icons';
import Tooltip from '../components/Tooltip';
import { ModernStatsCard } from '../components/DashboardWidgets';

interface CallRecord {
    _id: string;
    date: string;
    name: string;
    candidateName?: string;
    phone: string;
    companyName?: string;
    profileName?: string;
    ctc?: string;
    experience?: string;
    location?: string;
    remark?: string;
    duration?: number;
    recordingUrl?: string;
    callType?: 'Incoming' | 'Outgoing' | 'Missed';
    status?: string;
    callStartTime?: string;
    createdBy?: any;
    linkedEmployeeId?: any;
}

const CallHistory = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [showImportDrawer, setShowImportDrawer] = useState(false);
    const [splitButtonOpen, setSplitButtonOpen] = useState(false);
    const [editingCall, setEditingCall] = useState<CallRecord | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        candidateName: user?.name || '',
        phone: '',
        companyName: '',
        profileName: '',
        ctc: '',
        experience: '',
        location: '',
        remark: '',
        duration: '',
        callType: 'Outgoing',
        status: 'Connected',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchCalls = async () => {
        setLoading(true);
        try {
            const data = await api.getCallHistory();
            setCalls(data);
        } catch (error) {
            showToast('Failed to load call history', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);
        try {
            if (editingCall) {
                await api.updateCall(editingCall._id, formData);
                showToast('Call record updated successfully', 'success');
            } else {
                await api.createCall(formData);
                showToast('Call record created successfully', 'success');
            }
            setShowDrawer(false);
            setEditingCall(null);
            resetForm();
            fetchCalls();
        } catch (error) {
            showToast('Failed to save record', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            candidateName: user?.name || '',
            phone: '',
            companyName: '',
            profileName: '',
            ctc: '',
            experience: '',
            location: '',
            remark: '',
            duration: '',
            callType: 'Outgoing',
            status: 'Connected',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.deleteCall(id);
            showToast('Deleted successfully', 'success');
            fetchCalls();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const handleEdit = (record: CallRecord) => {
        setEditingCall(record);
        setFormData({
            name: record.name,
            candidateName: user?.name || record.candidateName || '',
            phone: record.phone,
            companyName: record.companyName || '',
            profileName: record.profileName || '',
            ctc: record.ctc || '',
            experience: record.experience || '',
            location: record.location || '',
            remark: record.remark || '',
            duration: record.duration?.toString() || '',
            callType: record.callType || 'Outgoing',
            status: record.status || 'Connected',
            date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowDrawer(true);
    };

    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data.map((row: any) => ({
                        date: row.Date || row.date || new Date().toISOString(),
                        name: row.Name || row.name || '',
                        candidateName: row.CandidateName || row['Name'] || row.candidateName || '',
                        phone: row.Number || row.phone || row.Phone || '',
                        companyName: row.CompanyName || row['Company Name'] || row.companyName || '',
                        profileName: row.ProfileName || row['Profile Name'] || row.profileName || '',
                        ctc: row.CTC || row.ctc || '',
                        experience: row.Experience || row.experience || '',
                        location: row.Location || row.location || '',
                        remark: row.Remark || row.remark || ''
                    }));

                    const validData = data.filter(item => item.name && item.phone);
                    if (validData.length === 0) {
                        showToast('No valid records found in CSV', 'error');
                        return;
                    }

                    await api.bulkCreateCalls(validData);
                    showToast(`Successfully imported ${validData.length} records`, 'success');
                    fetchCalls();
                } catch (error) {
                    showToast('Failed to import CSV', 'error');
                } finally {
                    setImportLoading(false);
                    e.target.value = '';
                }
            }
        });
    };

    const filteredCalls = calls.filter(call =>
        call.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone.includes(searchTerm) ||
        call.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Call Stats
    const totalCalls = filteredCalls.length;
    const connectedCalls = filteredCalls.filter(c => c.status === 'Connected').length;
    const missedCalls = filteredCalls.filter(c => c.callType === 'Missed').length;
    const avgDuration = filteredCalls.length > 0
        ? Math.round(filteredCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / filteredCalls.length)
        : 0;

    return (
        <div className="call-history-dashboard fade-in">
            <div className="attendance-header-section">
                <div className="header-content">
                    <h1 className="page-main-title">Call History & Logs</h1>
                    <p className="page-subtitle">Track outbound activity and candidate engagement logs.</p>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <SearchIcon size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="action-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => { resetForm(); setEditingCall(null); setShowDrawer(true); }}
                            className="btn-primary-indigo"
                        >
                            <PlusIcon size={18} />
                            <span>Add Call Log</span>
                        </button>

                        <div className="dropdown-container" style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSplitButtonOpen(!splitButtonOpen); }}
                                className="toggle-btn"
                                style={{ height: '100%', padding: '0 0.5rem' }}
                            >
                                <ChevronDownIcon size={18} className={splitButtonOpen ? 'rotate-180' : ''} />
                            </button>

                            {splitButtonOpen && (
                                <div className="modern-dropdown-menu" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    zIndex: 100,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.75rem',
                                    marginTop: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    minWidth: '180px',
                                    overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => { setShowImportDrawer(true); setSplitButtonOpen(false); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#475569',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <UploadIcon size={16} />
                                        Import CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                <ModernStatsCard
                    title="Total Calls"
                    value={totalCalls}
                    percent="+18.4"
                    icon={PhoneIcon}
                    chartData={[30, 45, 40, 55, 60, 50, 65]}
                    color="#6366f1"
                />
                <ModernStatsCard
                    title="Connected"
                    value={connectedCalls}
                    percent="+12.5"
                    icon={PlusIcon}
                    chartData={[20, 35, 30, 45, 50, 40, 55]}
                    color="#10b981"
                />
                <ModernStatsCard
                    title="Missed"
                    value={missedCalls}
                    percent="-2.4"
                    icon={XIcon}
                    chartData={[10, 8, 12, 5, 8, 10, 4]}
                    color="#f43f5e"
                />
                <ModernStatsCard
                    title="Avg. Duration"
                    value={`${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`}
                    percent="+5.1"
                    icon={ClockIcon}
                    chartData={[120, 150, 180, 200, 190, 210, 220]}
                    color="#3b82f6"
                />
            </div>

            <div className="table-wrapper">
                <table className="modern-data-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>CANDIDATE</th>
                            <th>PHONE / INFO</th>
                            <th>COMPANY / LOCATION</th>
                            <th>TYPE / STATUS</th>
                            <th>DURATION</th>
                            <th>RECORDING</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="loading-state">Syncing call records...</td></tr>
                        ) : filteredCalls.length > 0 ? (
                            filteredCalls.map((call) => (
                                <tr key={call._id}>
                                    <td className="date-cell">
                                        <div className="main-date">{new Date(call.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>
                                        <div className="sub-year">{new Date(call.date).getFullYear()}</div>
                                    </td>
                                    <td>
                                        <div className="candidate-cell">
                                            <div className="candidate-name">{call.name}</div>
                                            <div className="candidate-meta">By {call.candidateName || 'System'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            <div className="phone-num">{call.phone}</div>
                                            <div className="profile-badge">{call.profileName || 'General Query'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="location-info">
                                            <div className="comp-name">{call.companyName || 'Private'}</div>
                                            <div className="loc-text">
                                                <MapPinIcon size={12} />
                                                {call.location || 'Unknown'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="call-status">
                                            <span className={`type-pill ${call.callType?.toLowerCase()}`}>
                                                {call.callType || 'Outgoing'}
                                            </span>
                                            <div className="status-text">{call.status}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="duration-tag">
                                            {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '0s'}
                                        </div>
                                    </td>
                                    <td>
                                        {call.recordingUrl ? (
                                            <div className="audio-player-mini">
                                                <audio controls>
                                                    <source src={`${BASE_URL}${call.recordingUrl}`} type="audio/mpeg" />
                                                </audio>
                                            </div>
                                        ) : (
                                            <span className="no-recording">No Record</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <Tooltip text="Edit Record">
                                                <button className="icon-btn edit" onClick={() => handleEdit(call)}>
                                                    <EditIcon size={16} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip text="Delete Record">
                                                <button className="icon-btn delete" onClick={() => handleDelete(call._id)}>
                                                    <TrashIcon size={16} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={8} className="empty-state">No call records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Drawer */}
            {showDrawer && (
                <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <h2>{editingCall ? 'Edit Call Record' : 'New Call Entry'}</h2>
                                <p>{editingCall ? 'Update existing engagement details.' : 'Log a new candidate interaction.'}</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowDrawer(false)}>
                                <XIcon size={24} />
                            </button>
                        </div>

                        <div className="drawer-body">
                            <form id="callForm" onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
                                <div className="form-section">
                                    <h3>Candidate Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Candidate Name</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. John Doe" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="e.g. +91 98765 43210" required />
                                        </div>
                                        <div className="form-group">
                                            <label>Logged By</label>
                                            <input type="text" name="candidateName" value={formData.candidateName} className="disabled-input" disabled />
                                        </div>
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input type="date" name="date" value={formData.date} onChange={handleFormChange} required />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Professional Details</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Company Name</label>
                                            <input type="text" name="companyName" value={formData.companyName} onChange={handleFormChange} placeholder="Current Company" />
                                        </div>
                                        <div className="form-group">
                                            <label>Profile / Designation</label>
                                            <input type="text" name="profileName" value={formData.profileName} onChange={handleFormChange} placeholder="e.g. React Developer" />
                                        </div>
                                        <div className="form-group">
                                            <label>Expected CTC</label>
                                            <input type="text" name="ctc" value={formData.ctc} onChange={handleFormChange} placeholder="e.g. 12 LPA" />
                                        </div>
                                        <div className="form-group">
                                            <label>Experience</label>
                                            <input type="text" name="experience" value={formData.experience} onChange={handleFormChange} placeholder="e.g. 5 Years" />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Location</label>
                                            <input type="text" name="location" value={formData.location} onChange={handleFormChange} placeholder="City, Country" />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Call Configuration</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Call Type</label>
                                            <select name="callType" value={formData.callType} onChange={handleFormChange}>
                                                <option value="Outgoing">Outgoing</option>
                                                <option value="Incoming">Incoming</option>
                                                <option value="Missed">Missed</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select name="status" value={formData.status} onChange={handleFormChange}>
                                                <option value="Connected">Connected</option>
                                                <option value="No Answer">No Answer</option>
                                                <option value="Busy">Busy</option>
                                                <option value="Wrong Number">Wrong Number</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Duration (Seconds)</label>
                                            <input type="number" name="duration" value={formData.duration} onChange={handleFormChange} placeholder="0" />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Remarks</label>
                                            <textarea name="remark" value={formData.remark} onChange={handleFormChange} rows={3} placeholder="Add any important notes..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="drawer-footer">
                            <button type="button" className="cancel-btn" onClick={() => setShowDrawer(false)}>Cancel</button>
                            <button type="submit" form="callForm" className="save-btn">
                                {editingCall ? 'Update Record' : 'Save Call Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Drawer */}
            {showImportDrawer && (
                <div className="drawer-overlay" onClick={() => setShowImportDrawer(false)}>
                    <div className="drawer-content import-drawer" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <h2>Import Call History</h2>
                                <p>Upload a CSV file to bulk import call records.</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowImportDrawer(false)}>
                                <XIcon size={24} />
                            </button>
                        </div>
                        <div className="drawer-body">
                            <div className="import-zone">
                                <UploadIcon size={48} color="#6366f1" />
                                <h3>Select CSV File</h3>
                                <p>Drag and drop your file here or click to browse.</p>
                                <input type="file" accept=".csv" onChange={handleCsvImport} disabled={importLoading} />
                                {importLoading && <div className="loader">Processing file...</div>}
                            </div>
                            <div className="import-instructions">
                                <h4>CSV Format Requirements:</h4>
                                <ul>
                                    <li>Columns: Date, Name, Number, CompanyName, ProfileName, CTC, Experience, Location, Remark</li>
                                    <li>Date format: YYYY-MM-DD</li>
                                    <li>Phone number is required for each record.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .call-history-dashboard {
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

                .toggle-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    border: none;
                    background: #f1f5f9;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .table-wrapper {
                    background: white;
                    border-radius: 1rem;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .modern-data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .modern-data-table th {
                    background: #f8fafc;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                }

                .modern-data-table td {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .date-cell .main-date {
                    font-weight: 700;
                    color: #1e293b;
                }

                .date-cell .sub-year {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .candidate-name {
                    font-weight: 700;
                    color: #1e293b;
                }

                .candidate-meta {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .phone-num {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 600;
                    color: #475569;
                }

                .profile-badge {
                    display: inline-block;
                    font-size: 0.7rem;
                    background: #f1f5f9;
                    color: #475569;
                    padding: 1px 6px;
                    border-radius: 4px;
                    margin-top: 2px;
                }

                .comp-name {
                    font-weight: 600;
                    color: #475569;
                }

                .loc-text {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .type-pill {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .type-pill.outgoing { background: #dcfce7; color: #166534; }
                .type-pill.incoming { background: #e0e7ff; color: #3730a3; }
                .type-pill.missed { background: #fee2e2; color: #991b1b; }

                .status-text {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 2px;
                }

                .duration-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 600;
                    color: #1e293b;
                }

                .audio-player-mini audio {
                    height: 28px;
                    width: 140px;
                }

                .row-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .icon-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn.edit { color: #6366f1; }
                .icon-btn.edit:hover { background: #eef2ff; }
                .icon-btn.delete { color: #f43f5e; }
                .icon-btn.delete:hover { background: #fff1f2; }

                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    justify-content: flex-end;
                    animation: fadeIn 0.2s ease-out;
                }

                .drawer-content {
                    width: 500px;
                    background: white;
                    height: 100%;
                    box-shadow: -10px 0 25px -5px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideInRight 0.3s ease-out;
                }

                .drawer-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .drawer-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .drawer-header p {
                    margin: 0;
                    font-size: 0.8125rem;
                    color: #64748b;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }

                .close-btn:hover { background: #f1f5f9; color: #64748b; }

                .drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                    overflow-x: hidden !important;
                }

                .form-section {
                    margin-bottom: 2rem;
                }

                .form-section h3 {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #1e293b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.25rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group.full-width { grid-column: span 2; }

                .form-group label {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: #475569;
                }

                .form-group input, .form-group select, .form-group textarea {
                    padding: 0.625rem 0.875rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.625rem;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .disabled-input {
                    background: #f8fafc;
                    color: #94a3b8;
                    cursor: not-allowed;
                }

                .drawer-footer {
                    padding: 1.5rem 2rem;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 1rem;
                    background: #f8fafc;
                }

                .cancel-btn {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                }

                .save-btn {
                    flex: 2;
                    padding: 0.75rem;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
                }

                .import-zone {
                    border: 2px dashed #e2e8f0;
                    border-radius: 1rem;
                    padding: 3rem 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .import-zone:hover { border-color: #6366f1; background: #f8fafc; }

                .import-zone input {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
        </div>
    );
};

export default CallHistory;
