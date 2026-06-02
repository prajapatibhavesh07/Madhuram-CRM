import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DatabaseIcon, DownloadIcon, SaveIcon, SlidersIcon, ChevronDownIcon, ClockIcon, TrashIcon, CopyIcon } from '../icons';
import Tooltip from '../components/Tooltip';
import { api } from '../services/api';
import { exportToCSV, parseCSV } from '../utils/csvHelper';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface ImportLog {
    timestamp: string;
    type: string;
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

const ImportExport = () => {
    const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'offers' | 'users'>('candidates');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        location: '',
        designation: '',
        totalWorkExp: '',
        recruiterId: '',
        teamLeadId: '',
        managerId: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();

    const fetchDataForCounter = async (type: string) => {
        setIsDataLoading(true);
        try {
            let data = [];
            switch (type) {
                case 'candidates': data = await api.getCandidates(); break;
                case 'jobs': data = await api.getJobs(); break;
                case 'offers': data = await api.getOffers(); break;
                case 'users': data = await api.getUsers(); break;
            }
            setAllData(data || []);
        } catch (e) {
            console.error('Failed to fetch count data', e);
            setAllData([]);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        api.getUsers().then(setUsers).catch(console.error);
        const savedLogs = localStorage.getItem('import_logs');
        if (savedLogs) {
            try { setImportLogs(JSON.parse(savedLogs)); } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        fetchDataForCounter(activeTab);
    }, [activeTab]);

    const filteredData = useMemo(() => {
        if (!allData || allData.length === 0) return [];
        if (activeTab !== 'candidates') return allData;

        return allData.filter((c: any) => {
            if (filters.location && !c.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
            if (filters.designation && !c.designation?.toLowerCase().includes(filters.designation.toLowerCase())) return false;
            if (filters.totalWorkExp && parseFloat(c.totalWorkExp) < parseFloat(filters.totalWorkExp)) return false;

            if (filters.recruiterId && c.createdBy !== filters.recruiterId && c.createdBy?._id !== filters.recruiterId) return false;

            if (filters.teamLeadId || filters.managerId) {
                const creator = users.find(u => u._id === (c.createdBy?._id || c.createdBy));
                if (filters.teamLeadId && creator?.teamLeadId?._id !== filters.teamLeadId && creator?.teamLeadId !== filters.teamLeadId) return false;
                if (filters.managerId && creator?.managerId?._id !== filters.managerId && creator?.managerId !== filters.managerId) return false;
            }
            return true;
        });
    }, [allData, filters, activeTab, users]);

    const addLog = (log: ImportLog) => {
        const updatedLogs = [log, ...importLogs].slice(0, 10);
        setImportLogs(updatedLogs);
        localStorage.setItem('import_logs', JSON.stringify(updatedLogs));
    };

    const handleExport = async () => {
        if (filteredData.length === 0) {
            showToast('No data matches current filters', 'info');
            return;
        }
        setIsProcessing(true);
        setStatusMessage(`Preparing ${activeTab} data...`);
        try {
            exportToCSV(filteredData, `${activeTab}_export_${new Date().toISOString().split('T')[0]}`);
            showToast(`Successfully exported ${filteredData.length} records`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Export failed', 'error');
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const normalizeData = (row: any, type: string) => {
        const d = { ...row };

        // 1. Generic Cleaning
        Object.keys(d).forEach(key => {
            if (typeof d[key] === 'string') d[key] = d[key].trim();
            if (d[key] === '') d[key] = undefined;
        });

        if (type === 'candidates') {
            // Date Parsing helper
            const parseDate = (val: string) => {
                if (!val) return undefined;
                const parts = val.split(/[/-]/);
                if (parts.length === 3) {
                    if (parts[2].length === 4) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD-MM-YYYY
                    if (parts[0].length === 4) return new Date(val); // YYYY-MM-DD
                }
                const date = new Date(val);
                return isNaN(date.getTime()) ? undefined : date;
            };

            // Number Parsing helper (strip "yrs", "month", etc)
            const parseNum = (val: any) => {
                if (val === undefined || val === null || val === '') return undefined;
                const match = String(val).match(/(\d+(\.\d+)?)/);
                return match ? parseFloat(match[1]) : undefined;
            };

            // User ID Lookup helper
            const findUserId = (val: string) => {
                if (!val || typeof val !== 'string' || val.trim() === '') return currentUser?._id;
                if (/^[0-9a-fA-F]{24}$/.test(val)) return val;
                const found = users.find(u => 
                    u.name.toLowerCase().includes(val.toLowerCase()) || 
                    u.username.toLowerCase() === val.toLowerCase()
                );
                return found ? found._id : currentUser?._id;
            };

            // Apply conversions
            d.dob = parseDate(d.dob);
            d.doj = parseDate(d.doj);
            d.age = parseNum(d.age);
            d.totalWorkExp = parseNum(d.totalWorkExp);
            d.currentCTC = parseNum(d.currentCTC);
            d.totalSalesExp = parseNum(d.totalSalesExp);
            d.bfsiExp = parseNum(d.bfsiExp);
            
            d.createdBy = findUserId(d.createdBy);
            d.approvedBy = findUserId(d.approvedBy);
            
            // Boolean parsing for isApproved
            if (d.isApproved !== undefined) {
               d.isApproved = String(d.isApproved).toLowerCase() === 'true' || d.isApproved === '1' || String(d.isApproved).toLowerCase() === 'yes';
            }

            // Wrap tickets string into object if it looks like a ticket no, otherwise delete it
            if (typeof d.tickets === 'string' && d.tickets.length > 3) {
                d.tickets = [{ ticketNo: d.tickets, companyName: 'Imported', type: 'Others' }];
            } else if (d.tickets === '' || typeof d.tickets !== 'object') {
                delete d.tickets;
            }

            // Helper to clean enum values
            const cleanEnum = (val: any, validValues: string[], defaultValue?: string) => {
                if (!val || typeof val !== 'string') return defaultValue;
                const match = validValues.find(v => v.toLowerCase() === val.toLowerCase());
                return match || defaultValue;
            };

            d.channel = cleanEnum(d.channel, ["Banca", "Agency", "Direct", "Referral", "Internal", "Job Portal", "Other"]);
            d.sector = cleanEnum(d.sector, ["BFSI", "Insurance", "Banking", "IT", "Service", "EdTech", "Manufacturing", "Other"]);
            d.assessment = cleanEnum(d.assessment, ["Clear", "Not Clear", "Pending"], "Pending");
            d.offerStatus = cleanEnum(d.offerStatus, ['Accepted', 'Rejected', 'Pending'], "Pending");
            d.isResigned = cleanEnum(d.isResigned, ['Yes', 'No'], "No");
            d.leadTag = cleanEnum(d.leadTag, ['Hot Lead', 'Warm Lead', 'Jobseeker', 'Immediate Join'], "Jobseeker");
            d.recruitmentStatus = cleanEnum(d.recruitmentStatus, ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined'], "Applied");
            d.gender = cleanEnum(d.gender, ["Male", "Female", "Other"]);

            // Cleanup unwanted strings in object paths that cause Cast to embedded/document errors
            ['extractedEducation', 'extractedExperience', 'timeline', 'jobId', '_id'].forEach(key => {
                if (d[key] === undefined || d[key] === null || (typeof d[key] === 'string' && d[key].trim() === '')) {
                    delete d[key];
                }
            });
            delete d._id;
        }

        return d;
    };

    const handleDownloadSample = () => {
        let sampleRow: any = {};

        switch (activeTab) {
            case 'candidates':
                sampleRow = {
                    name: 'John Doe',
                    gender: 'Male',
                    dob: '15-08-1990',
                    age: '33',
                    phone: '9876543210',
                    whatsapp: '9876543210',
                    email: 'john@example.com',
                    location: 'Mumbai',
                    pan: 'ABCDE1234F',
                    designation: 'Software Engineer',
                    totalWorkExp: '5',
                    currentCTC: '1200000',
                    channel: 'Direct',
                    sector: 'IT',
                    recruitmentStatus: 'Applied',
                    createdBy: 'Kajal' // Example of name usage
                };
                break;
            case 'jobs':
                sampleRow = {
                    title: 'Senior Developer',
                    company: 'Tech Corp',
                    location: 'Remote',
                    type: 'Full-time',
                    experienceMin: '5',
                    experienceMax: '10',
                    salaryMin: '1500000',
                    salaryMax: '2500000',
                    description: 'Technical lead position',
                    createdBy: 'Dipen Sir' // Example of name usage
                };
                break;
            case 'users':
                sampleRow = {
                    name: 'New Recruiter',
                    email: 'recruiter@example.com',
                    username: 'recruiter01',
                    password: 'password123',
                    role: 'Recruiter'
                };
                break;
            default:
                sampleRow = { title: 'Sample' };
        }

        exportToCSV([sampleRow], `${activeTab}_sample_format`);
        showToast('Sample format downloaded', 'success');
    };

    const processFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Please select a valid CSV file', 'error');
            return;
        }

        setIsProcessing(true);
        setStatusMessage(`Parsing CSV file...`);
        const errors: string[] = [];

        try {
            const rawData = await parseCSV(file);
            if (!rawData || rawData.length === 0) throw new Error('No valid data found in CSV');

            setStatusMessage(`Importing ${rawData.length} records...`);
            let successCount = 0;
            let failureCount = 0;

            for (const row of rawData) {
                try {
                    const normalized = normalizeData(row, activeTab);
                    switch (activeTab) {
                        case 'candidates': await api.createCandidate(normalized); break;
                        case 'jobs': await api.createJob(normalized); break;
                        case 'offers': await api.createOffer(normalized); break;
                        case 'users': await api.register(normalized); break;
                    }
                    successCount++;
                } catch (err: any) {
                    failureCount++;
                    // Extract granular error if available
                    const errMsg = err.response?.data?.error || err.message || 'Validation failed';
                    errors.push(`Row ${successCount + failureCount}: ${errMsg}`);
                }
                if (successCount % 10 === 0) setStatusMessage(`Importing... (${successCount}/${rawData.length})`);
            }

            addLog({
                timestamp: new Date().toLocaleString(),
                type: activeTab,
                total: rawData.length,
                success: successCount,
                failed: failureCount,
                errors: errors // Store all errors
            });

            showToast(`Import completed: ${successCount} success, ${failureCount} failed`, successCount > 0 ? 'success' : 'error');
            fetchDataForCounter(activeTab);
        } catch (error: any) {
            showToast(error.message || 'Import failed', 'error');
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const handleImportBtnClick = () => {
        const file = fileInputRef.current?.files?.[0];
        if (file) processFile(file);
        else showToast('Please select a CSV file first', 'error');
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const recruiters = users.filter(u => u.role === 'Recruiter');
    const teamLeads = users.filter(u => u.role === 'Team Lead');
    const managers = users.filter(u => u.role === 'Manager');

    const tabs = [
        { id: 'candidates', label: 'Candidates' },
        { id: 'jobs', label: 'Jobs' },
        { id: 'offers', label: 'Offers' },
        { id: 'users', label: 'Users' },
    ];

    const deleteLog = (idx: number) => {
        if (!window.confirm('Remove this transaction from history?')) return;
        const newLogs = [...importLogs];
        newLogs.splice(idx, 1);
        setImportLogs(newLogs);
        localStorage.setItem('import_logs', JSON.stringify(newLogs));
        showToast('Transaction removed from history', 'success');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Errors copied to clipboard', 'success');
    };

    return (
        <div className="fade-in">
            {/* Standardized Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ marginTop: '0rem', marginBottom: '0' }} className="text-dark">Data Management</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0' }}>Export reports and bulk import system data.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: '12px', color: 'white', display: 'flex' }}>
                        <DatabaseIcon size={20} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '2rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '0.75rem 0.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Export Card */}
                <div className="modern-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DownloadIcon size={20} color="var(--primary)" /> Export Data
                        </h4>
                        {activeTab === 'candidates' && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center', gap: '4px', fontWeight: '500'
                                }}
                            >
                                <SlidersIcon size={14} />
                                {showFilters ? 'Hide Filters' : 'Add Filters'}
                                <span style={{ display: 'inline-flex', transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                                    <ChevronDownIcon size={14} />
                                </span>
                            </button>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                            Generate <strong style={{ color: 'var(--text-main)' }}>{activeTab}</strong> reports.
                        </p>
                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                            {isDataLoading ? 'Loading...' : `${filteredData.length} Records Found`}
                        </div>
                    </div>

                    {showFilters && activeTab === 'candidates' && (
                        <div style={{
                            background: 'var(--bg-muted)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid var(--border)'
                        }} className="fade-in">
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Location</label>
                                <input type="text" className="input-field" style={{ padding: '0.6rem' }} placeholder="City name..." value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Designation</label>
                                <input type="text" className="input-field" style={{ padding: '0.6rem' }} placeholder="Role name..." value={filters.designation} onChange={e => setFilters({ ...filters, designation: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Min Experience (Years)</label>
                                <input type="number" className="input-field" style={{ padding: '0.6rem' }} value={filters.totalWorkExp} onChange={e => setFilters({ ...filters, totalWorkExp: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Recruiter</label>
                                <select className="input-field" style={{ padding: '0.6rem' }} value={filters.recruiterId} onChange={e => setFilters({ ...filters, recruiterId: e.target.value })}>
                                    <option value="">All Recruiters</option>
                                    {recruiters.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Team Lead</label>
                                <select className="input-field" style={{ padding: '0.6rem' }} value={filters.teamLeadId} onChange={e => setFilters({ ...filters, teamLeadId: e.target.value })}>
                                    <option value="">All Team Leads</option>
                                    {teamLeads.map(tl => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem' }}>Manager</label>
                                <select className="input-field" style={{ padding: '0.6rem' }} value={filters.managerId} onChange={e => setFilters({ ...filters, managerId: e.target.value })}>
                                    <option value="">All Managers</option>
                                    {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="action-link" style={{ fontSize: '0.75rem', fontWeight: 'bold' }} onClick={() => setFilters({ location: '', designation: '', totalWorkExp: '', recruiterId: '', teamLeadId: '', managerId: '' })}>Reset Filters</button>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                        <button
                            onClick={handleExport}
                            className="modern-primary-btn"
                            disabled={isProcessing || isDataLoading}
                        >
                            <DownloadIcon size={18} />
                            {isProcessing ? 'Processing...' : `Export ${filteredData.length} Records to CSV`}
                        </button>
                    </div>
                </div>

                {/* Import Card */}
                <div className="modern-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <SaveIcon size={20} color="var(--primary)" /> Import Data
                        </h4>
                        <button 
                            onClick={handleDownloadSample}
                            className="action-link"
                            style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                            <DownloadIcon size={14} style={{ marginRight: '4px' }} />
                            Download Sample
                        </button>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Bulk upload <strong style={{ color: 'var(--text-main)' }}>{activeTab}</strong> using CSV.
                    </p>

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(37, 99, 235, 0.2)'}`,
                            borderRadius: '16px',
                            padding: '3rem 1.5rem',
                            textAlign: 'center',
                            background: isDragging ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.03)',
                            marginBottom: '1.5rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: isDragging ? '0 0 20px rgba(37, 99, 235, 0.1)' : 'none'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: 'var(--primary)'
                        }}>
                            <SaveIcon size={24} />
                        </div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{isDragging ? 'Drop file now' : 'Drag & drop CSV file here'}</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            or click to browse from device
                        </p>
                        <input
                            type="file" accept=".csv" ref={fileInputRef} hidden
                            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        />
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <button
                            onClick={handleImportBtnClick}
                            className="modern-secondary-btn"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Importing Data...' : 'Start Manual Import'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            {isProcessing && (
                <div style={{
                    marginBottom: '1.5rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '12px',
                    color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(37, 99, 235, 0.1)'
                }} className="fade-in">
                    <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(37, 99, 235, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
                    <span style={{ fontWeight: '600' }}>{statusMessage || 'Syncing data...'}</span>
                </div>
            )}

            {/* History Logs */}
            <div className="modern-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-muted)' }}>
                    <div style={{ padding: '6px', background: 'white', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <ClockIcon size={16} />
                    </div>
                    <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Transaction History</h4>
                </div>
                <div className="modern-table-container" style={{ maxHeight: '400px' }}>
                    <table className="modern-table">
                        <thead>
                            <tr><th>Timestamp</th><th>Type</th><th>Status</th><th>Success</th><th>Failed</th><th>Error Details</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {importLogs.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No recent activity to display.</td></tr>
                            ) : importLogs.map((log, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                                            <td style={{ textTransform: 'capitalize', fontWeight: '700', color: 'var(--text-main)' }}>{log.type}</td>
                                            <td>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: log.failed === 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                    color: log.failed === 0 ? '#16a34a' : '#dc2626'
                                                }}>
                                                    {log.failed === 0 ? 'Completed' : 'Issues Found'}
                                                </div>
                                            </td>
                                            <td style={{ color: '#16a34a', fontWeight: '700' }}>{log.success}</td>
                                            <td style={{ color: '#dc2626', fontWeight: '700' }}>{log.failed}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div
                                                        style={{
                                                            fontSize: '0.8125rem',
                                                            color: log.failed > 0 ? '#dc2626' : 'var(--text-muted)',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {log.errors.length > 0 ? (
                                                            <Tooltip text={log.errors.join(' | ')}>
                                                                <span style={{ cursor: 'help' }}>{log.errors.join(', ')}</span>
                                                            </Tooltip>
                                                        ) : 'None'}
                                                    </div>
                                                    {log.errors.length > 0 && (
                                                        <button
                                                            onClick={() => copyToClipboard(log.errors.join('\n'))}
                                                            className="action-link"
                                                            style={{ padding: '2px' }}
                                                            title="Copy Errors"
                                                        >
                                                            <CopyIcon size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => deleteLog(idx)}
                                                    className="action-link"
                                                    style={{ color: '#ef4444' }}
                                                    title="Delete Log"
                                                >
                                                    <TrashIcon size={18} />
                                                </button>
                                            </td>
                                        </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner { animation: spin 1s linear infinite; }
                .modern-primary-btn {
                    width: 100%; height: 50px; border-radius: 12px; border: none;
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white; font-weight: 700; display: flex; align-items: center;
                    justify-content: center; gap: 0.75rem; cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
                }
                .modern-primary-btn:hover { 
                    transform: scale(1.01); 
                    box-shadow: 0 6px 15px rgba(37, 99, 235, 0.35); 
                    background: linear-gradient(135deg, #3b82f6, #1e40af);
                }
                .modern-primary-btn:active { transform: scale(0.99); }
                .modern-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

                .modern-secondary-btn {
                    width: 100%; height: 50px; border-radius: 12px;
                    border: 1.5px solid var(--primary); background: transparent;
                    color: var(--primary); font-weight: 700; cursor: pointer;
                    transition: all 0.2s ease;
                }
                .modern-secondary-btn:hover { 
                    background: rgba(37, 99, 235, 0.05); 
                    border-color: #1e40af;
                    color: #1e40af;
                }
                .modern-secondary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default ImportExport;
