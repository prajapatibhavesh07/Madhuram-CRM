// Version: 1.0.1 - Cleaning up legacy code
import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { EditIcon, GridIcon, ListIcon, TrashIcon, MailIcon, MapPinIcon, UserIcon, BriefcaseIcon, EyeIcon, SparklesIcon, SendIcon, PlusIcon, MoreVerticalIcon, GripVerticalIcon, ChevronDownIcon, SearchIcon, SettingsIcon, CheckCircleIcon } from '../icons';

import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Drawer from '../components/Drawer';
import JobForm from './JobForm';

interface JobQuestion {
    question: string;
    questionType: string;
    options: string[];
}

interface JobManager {
    name: string;
    email: string;
    phone: string;
    title: string;
    department: string;
    channel: string;
    openPosition: string;
    noOfCandidates: string;
    status: string;
    expiryDays: string;
    ctc: string;
    description: string;
    fls: string;
    nfls: string;
    vacancyQuestions: JobQuestion[];
}

interface Job {
    _id: string;
    uniqueId: string;
    displayId?: string;
    company: string;
    logo?: string;
    location: string;
    branch?: string;
    date: string;
    managers?: JobManager[];
    postedBy: { name: string };
    createdAt: string;
    candidateCount?: number;
    hrEmail?: string;
    type: string;
    status: string;
    title: string;
    openPosition: string;
    managerName?: string;
    department?: string;
    channel?: string;
    ctc?: string;
    managerIndex?: number;
}

interface Ticket {
    ticketNo: string;
    companyName: string;
    uploaddate: string;
    expdate: string;
    crtdate: string;
    type: string;
    banca?: string;
    agency?: string;
    direct?: string;
}

interface Candidate {
    _id: string;
    name: string;
    gender: string;
    dob: string;
    age: string;
    phone: string;
    whatsapp: string;
    email: string;
    location: string;
    currentCompany: string;
    currentProfile: string;
    designation: string;
    currentCTC: number;
    channel: string;
    sector: string;
    totalWorkExp: number;
    totalSalesExp: number;
    bfsiExp: number;
    qualification: string;
    pan: string;
    assessment: string;
    recruitmentStatus: string;
    remark: string;
    createdAt: string;
    tickets: Ticket[];
    resume?: { fileUrl: string; fileName: string };
    photograph?: { fileUrl: string; fileName: string };
    isApproved?: boolean;
    createdBy?: string | { _id: string, name: string };
    offerStatus?: string;
    doj?: string;
    noticePeriod?: string;
    jobId?: string | { _id: string; title: string };
}

const HighlightText = ({ text, highlight }: { text: string | number, highlight: string }) => {
    const stringText = text?.toString() || '';
    if (!highlight.trim()) return <>{stringText}</>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = stringText.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="text-highlight">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
};

const JobList = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage, setJobsPerPage] = useState(10);
    const { showToast } = useToast();

    const { user, activeRole } = useAuth();
    const canDelete = user?.role === 'Super Admin' || activeRole?.permissions?.jobs?.delete === true;
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, job: Job } | null>(null);
    const [groupBy, setGroupBy] = useState<'status' | 'company'>('status');
    const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
    const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Email Modal State
    const [emailModalJobId, setEmailModalJobId] = useState<string | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('all');
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
    const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<string>('custom');

    // Job Drawer State
    const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);
    const [editingManagerIndex, setEditingManagerIndex] = useState<number | undefined>(undefined);
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

    // Share with HR State
    const [shareModalJobId, setShareModalJobId] = useState<string | null>(null);
    const [hrEmailAddress, setHrEmailAddress] = useState('');
    const [isSharingHR, setIsSharingHR] = useState(false);
    const [hrSubject, setHrSubject] = useState('');
    const [hrMessage, setHrMessage] = useState('');
    const [selectedHrTemplateId, setSelectedHrTemplateId] = useState<string>('custom');
    const [defaultHrSubject, setDefaultHrSubject] = useState('');
    const [defaultHrMessage, setDefaultHrMessage] = useState('');

    useEffect(() => {
        const fetchEmailTemplates = async () => {
            try {
                const data = await api.getTemplates();
                const filtered = (data || []).filter((t: any) => t.type === 'Email');
                setEmailTemplates(filtered);
            } catch (err) {
                console.error('Failed to load email templates', err);
            }
        };
        fetchEmailTemplates();
    }, []);

    useEffect(() => {
        if (!emailModalJobId) {
            setSelectedRecipientId('all');
            setSelectedCandidateIds([]);
            setSelectedEmailTemplateId('custom');
            setEmailSubject('');
            setEmailMessage('');
        }
    }, [emailModalJobId]);

    useEffect(() => {
        if (!shareModalJobId) {
            setSelectedHrTemplateId('custom');
            setHrEmailAddress('');
            setHrSubject('');
            setHrMessage('');
            setDefaultHrSubject('');
            setDefaultHrMessage('');
        }
    }, [shareModalJobId]);

    const openShareModal = (job: Job) => {
        setShareModalJobId(job._id);
        setHrEmailAddress(job.hrEmail || '');
        
        const initialSubject = `Candidates List: ${job.title}`;
        const initialMessage = `Please find below the details of the candidates who applied for the ${job.title} position.`;
        
        setHrSubject(initialSubject);
        setHrMessage(initialMessage);
        setDefaultHrSubject(initialSubject);
        setDefaultHrMessage(initialMessage);
        
        setSelectedHrTemplateId('custom');
        setActiveMenu(null);
    };

    // Advanced Filters State
    const [activeFilters, setActiveFilters] = useState<{ id: string, field: string, operator: string, value: string }[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<Record<string, { operator: string, value: string }>>({});

    const JOB_FILTER_COLUMNS = [
        { key: 'company', label: 'Company', type: 'select' },
        { key: 'location', label: 'Location', type: 'select' },
        { key: 'title', label: 'Designation', type: 'select' },
        { key: 'manager', label: 'Manager', type: 'select' },
        { key: 'channel', label: 'Channel', type: 'select' },
        { key: 'fls', label: 'FLS', type: 'text' },
        { key: 'nfls', label: 'NFLS', type: 'text' },
        { key: 'ctc', label: 'CTC', type: 'text' }
    ];

    const masterData = useMemo(() => {
        const data = {
            company: new Set<string>(),
            location: new Set<string>(),
            title: new Set<string>(),
            manager: new Set<string>(),
            channel: new Set<string>()
        };

        jobs.forEach(job => {
            if (job.company) data.company.add(job.company);
            if (job.location) data.location.add(job.location);
            if (job.title) data.title.add(job.title);
            job.managers?.forEach(m => {
                if (m.name) data.manager.add(m.name);
                if (m.channel) data.channel.add(m.channel);
                if (m.title) data.title.add(m.title);
            });
        });

        return {
            company: Array.from(data.company).sort(),
            location: Array.from(data.location).sort(),
            title: Array.from(data.title).sort(),
            manager: Array.from(data.manager).sort(),
            channel: Array.from(data.channel).sort()
        };
    }, [jobs]);

    // Delete Confirmation State
    const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenu(null);
            setContextMenu(null);
        };
        if (activeMenu || contextMenu) {
            window.addEventListener('click', handleClickOutside);
            window.addEventListener('contextmenu', handleClickOutside);
            window.addEventListener('scroll', handleClickOutside);
        }
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('contextmenu', handleClickOutside);
            window.removeEventListener('scroll', handleClickOutside);
        };
    }, [activeMenu, contextMenu]);

    const handleContextMenu = (e: React.MouseEvent, job: Job) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            job
        });
        setActiveMenu(null);
    };

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const [jobsData, candidatesData] = await Promise.all([
                api.getJobs(),
                api.getCandidates()
            ]);
            setCandidates(candidatesData || []);
            const processedJobs: any[] = [];
            jobsData.forEach((job: any) => {
                const jobManagers = job.managers || [];
                if (jobManagers.length === 0) {
                    processedJobs.push({
                        ...job,
                        uniqueId: job._id,
                        displayId: job._id,
                        managerName: '-',
                        department: '-',
                        channel: '-',
                        ctc: '-',
                        status: job.status || 'Open',
                        title: job.title || 'Untitled Job',
                        location: job.location || 'TBD',
                        company: job.company || 'Private Company',
                        type: job.type || 'Full-time',
                        branch: job.branch || '-',
                        candidateCount: job.candidateCount || 0
                    });
                } else {
                    jobManagers.forEach((m: any, index: number) => {
                        processedJobs.push({
                            ...job,
                            uniqueId: `${job._id}-${index}`,
                            displayId: job._id,
                            managerName: m.name || '-',
                            department: m.department || '-',
                            channel: m.channel || '-',
                            ctc: m.ctc || '-',
                            status: m.status || job.status || 'Open',
                            title: job.title || m.title || 'Untitled Job',
                            location: job.location || 'TBD',
                            company: job.company || 'Private Company',
                            type: job.type || 'Full-time',
                            branch: job.branch || '-',
                            candidateCount: job.candidateCount || 0,
                            managerIndex: index
                        });
                    });
                }
            });
            setJobs(processedJobs);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredJobs = jobs.filter(job => {
        const query = searchQuery.toLowerCase();
        if (query) {
            const matchesSearch = [
                job.title,
                job.company,
                job.location,
                job.managerName,
                job.department,
                job.channel,
                job.type,
                job.status
            ].some(field => field?.toLowerCase().includes(query));

            if (!matchesSearch) return false;
        }

        if (activeFilters.length > 0) {
            return activeFilters.every(filter => {
                const jobValue = String((job as any)[filter.field] || '').toLowerCase();
                const searchVal = filter.value.toLowerCase();
                switch (filter.operator) {
                    case 'contains': return jobValue.includes(searchVal);
                    case 'equals': return jobValue === searchVal;
                    case 'startsWith': return jobValue.startsWith(searchVal);
                    case 'endsWith': return jobValue.endsWith(searchVal);
                    default: return true;
                }
            });
        }
        return true;
    });

    const groupedJobs = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        filteredJobs.forEach(job => {
            const company = job.company || 'Private Company';
            if (!groups[company]) groups[company] = [];
            groups[company].push(job);
        });
        return groups;
    }, [filteredJobs]);
    const handleGenerateDraft = async () => {
        if (!emailSubject.trim()) {
            showToast('Please enter a subject first to generate a relevant draft.', 'error');
            return;
        }
        setIsGeneratingDraft(true);
        try {
            const prompt = `Write a professional email draft for the subject: "${emailSubject}". Use the following exact tags where appropriate: @name (Candidate Name), @email (Candidate's Email), @phone (Candidate's Phone), @company (Current Company), @designation (Applied Designation), @location (Location). Keep it concise and professional. Return ONLY the email body.`;
            const response = await api.askAssistant(prompt);
            setEmailMessage(response.data?.answer || response.answer || '');
        } catch (error) {
            console.error('Failed to generate AI draft', error);
            showToast('Failed to generate AI draft. Please try again.', 'error');
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailModalJobId) return;
        if (!emailSubject.trim() || !emailMessage.trim()) {
            showToast('Subject and message are required', 'error');
            return;
        }

        if (selectedRecipientId === 'custom' && selectedCandidateIds.length === 0) {
            showToast('Please select at least one candidate to email', 'warning');
            return;
        }

        setSendingEmail(true);
        try {
            const payload: any = {
                subject: emailSubject,
                message: emailMessage
            };
            if (selectedRecipientId === 'custom') {
                payload.candidateIds = selectedCandidateIds;
            } else if (selectedRecipientId !== 'all') {
                payload.candidateId = selectedRecipientId;
            }
            const res = await api.emailCandidatesForJob(emailModalJobId, payload);
            showToast(res.message || 'Emails sent successfully', 'success');
            setEmailModalJobId(null);
            setEmailSubject('');
            setEmailMessage('');
            setSelectedRecipientId('all');
            setSelectedCandidateIds([]);
        } catch (error) {
            console.error(error);
            showToast('Failed to send emails', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleShareWithHR = async () => {
        if (!shareModalJobId) return;
        if (!hrEmailAddress.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hrEmailAddress)) {
            showToast('Please enter a valid HR email address', 'error');
            return;
        }
        if (!hrSubject.trim()) {
            showToast('Subject is required', 'error');
            return;
        }

        setIsSharingHR(true);
        try {
            const res = await api.shareCandidatesWithHR(shareModalJobId, {
                hrEmail: hrEmailAddress,
                subject: hrSubject,
                message: hrMessage
            });
            showToast(res.message || 'Candidates shared with HR successfully', 'success');
            setShareModalJobId(null);
            setHrEmailAddress('');
            setHrSubject('');
            setHrMessage('');
        } catch (error) {
            console.error(error);
            showToast('Failed to share candidates with HR', 'error');
        } finally {
            setIsSharingHR(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingJobId(id);
    };

    const confirmDelete = async () => {
        if (!deletingJobId) return;
        try {
            await api.deleteJob(deletingJobId);
            showToast('Job deleted successfully', 'success');
            fetchJobs();
            setSelectedIds(prev => prev.filter(item => item !== deletingJobId));
            setDeletingJobId(null);
        } catch (error) {
            showToast('Failed to delete job', 'error');
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = async () => {
        try {
            await api.bulkDeleteJobs(selectedIds);
            showToast(`${selectedIds.length} jobs deleted successfully`, 'success');
            fetchJobs();
            setSelectedIds([]);
            setIsBulkDeleting(false);
        } catch (error) {
            showToast('Failed to delete jobs', 'error');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedJobs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedJobs.map(job => job._id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleDragStart = (e: React.DragEvent, id: string, managerIndex?: number) => {
        setDraggedJobId(id);
        e.dataTransfer.setData('jobId', id);
        if (managerIndex !== undefined) {
            e.dataTransfer.setData('managerIndex', managerIndex.toString());
        }
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverStatus(status);
    };

    const handleDragEnd = () => {
        setDraggedJobId(null);
        setDragOverStatus(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData('jobId');
        const managerIndexStr = e.dataTransfer.getData('managerIndex');
        const managerIndex = managerIndexStr ? parseInt(managerIndexStr, 10) : undefined;

        setDragOverStatus(null);
        setDraggedJobId(null);

        if (jobId) {
            handleStatusChange(jobId, newStatus, managerIndex);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string, managerIndex?: number) => {
        try {
            const jobToUpdate = jobs.find(j => j._id === id);
            if (!jobToUpdate) return;

            const updatedManagers = [...(jobToUpdate.managers || [])];

            if (managerIndex !== undefined && updatedManagers[managerIndex]) {
                updatedManagers[managerIndex] = { ...updatedManagers[managerIndex], status: newStatus };
            } else if (updatedManagers.length > 0) {
                updatedManagers[0] = { ...updatedManagers[0], status: newStatus };
            }

            // Optimistic update of the exploded state
            setJobs(prevJobs => prevJobs.map(job => {
                if (job._id === id) {
                    // Update all exploded entries for this jobId to have the new manager data
                    // but the flat 'status' field only for the specific manager row being changed
                    const isCorrectManager = managerIndex !== undefined ? job.managerIndex === managerIndex : true;

                    return {
                        ...job,
                        managers: updatedManagers,
                        status: isCorrectManager ? newStatus : job.status
                    };
                }
                return job;
            }));

            await api.updateJob(id, { managers: updatedManagers });
            showToast('Status updated successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to update status', 'error');
            fetchJobs(); // Rollback
        }
    };

    const handleOpenJobDrawer = () => {
        setEditingJobId(null);
        setIsJobDrawerOpen(true);
    };


    const openFilterModal = () => {
        const initialLocal: any = {};
        activeFilters.forEach(f => {
            initialLocal[f.field] = { operator: f.operator, value: f.value };
        });
        setLocalFilters(initialLocal);
        setIsFilterModalOpen(true);
    };

    const applyClassicFilters = () => {
        const newFiltersArray = [];
        for (const [field, data] of Object.entries(localFilters)) {
            if (data.value) {
                newFiltersArray.push({
                    id: Math.random().toString(36).substr(2, 9),
                    field,
                    operator: data.operator,
                    value: data.value
                });
            }
        }
        setActiveFilters(newFiltersArray);
        setIsFilterModalOpen(false);
        setCurrentPage(1);
    };

    const removeFilter = (id: string) => {
        setActiveFilters(activeFilters.filter(f => f.id !== id));
    };

    const handleResetFilters = () => {
        setActiveFilters([]);
        setLocalFilters({});
        setSearchQuery('');
        setCurrentPage(1);
    };



    const handleEditJob = (id: string, managerIndex?: number) => {
        setEditingJobId(id);
        setEditingManagerIndex(managerIndex);
        setIsJobDrawerOpen(true);
    };


    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * jobsPerPage,
        currentPage * jobsPerPage
    );

    const selectedJob = jobs.find(j => j._id === emailModalJobId);
    const jobCandidates = useMemo(() => {
        if (!emailModalJobId) return [];
        return candidates.filter(c => c.jobId === emailModalJobId || (c.jobId as any)?._id === emailModalJobId);
    }, [candidates, emailModalJobId]);

    return (
        <div className="candidate-list-page">
            <div className="job-list-header">
                <div className="header-title">
                    <h3>
                        Job Postings
                        <span className="total-badge">
                            {filteredJobs.length} Total
                        </span>
                    </h3>
                    <p>Manage open positions and recruitment requirements.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>

                    <button
                        className={`btn ${activeFilters.length > 0 ? 'btn-primary' : 'btn-outline'}`}
                        onClick={openFilterModal}
                        title="Advanced Filters"
                    >
                        <SettingsIcon size={18} className={activeFilters.length > 0 ? '' : 'mr-8'} />
                        {activeFilters.length === 0 && "Filters"}
                        {activeFilters.length > 0 && <span className="ml-8">({activeFilters.length})</span>}
                    </button>


                    <div className="view-mode-toggle shadow-sm">
                        <button
                            onClick={() => { setViewMode('table'); setGroupBy('company'); }}
                            className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                            title="Table View"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => { setViewMode('kanban'); setGroupBy('status'); }}
                            className={`mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                            title="Kanban Board"
                        >
                            <GridIcon size={18} />
                        </button>
                    </div>

                    {canDelete && selectedIds.length > 0 && (
                        <button
                            className="btn btn-danger"
                            onClick={handleBulkDelete}
                        >
                            <TrashIcon size={18} className="mr-8" /> Delete ({selectedIds.length})
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleOpenJobDrawer}
                    >
                        <PlusIcon size={18} className="mr-8" /> Post New Job
                    </button>
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className="active-filters-bar mb-16" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0 1.5rem' }}>
                    {activeFilters.map(filter => (
                        <div key={filter.id} className="advanced-filter-pill" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.8rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            color: 'var(--primary)'
                        }}>
                            <span style={{ fontWeight: 600 }}>{JOB_FILTER_COLUMNS.find(c => c.key === filter.field)?.label}:</span>
                            <span>{filter.value}</span>
                            <button
                                onClick={() => removeFilter(filter.id)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    display: 'flex',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                <TrashIcon size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleResetFilters}
                        style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Clear All
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-state">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
                <div className="empty-state">
                    {searchQuery ? `No jobs matching "${searchQuery}"` : 'No jobs found.'}
                </div>
            ) : viewMode === 'table' ? (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                {canDelete && (
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selectedIds.length === filteredJobs.length && filteredJobs.length > 0}
                                            className="checkbox-input"
                                        />
                                    </th>
                                )}
                                <th style={{ width: '250px' }}>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            JOB TITLE
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
                                            <MapPinIcon size={12} className="grip-icon" />
                                            LOCATION
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
                                            <GridIcon size={12} className="grip-icon" />
                                            DEPT / CHANNEL
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <UserIcon size={12} className="grip-icon" />
                                            MANAGER
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            TYPE
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
                                            OPENINGS
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
                                            STATUS
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
                                            APPLICANTS
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th style={{ width: '150px' }}>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            POSTED DATE
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupBy === 'status' ? (
                                paginatedJobs.map(job => (
                                    <tr
                                        key={job.uniqueId}
                                        className={`${selectedIds.includes(job._id) ? 'selected-row' : ''} table-row-clickable`}
                                        onDoubleClick={() => handleEditJob(job._id, job.managerIndex)}
                                        onContextMenu={(e) => handleContextMenu(e, job)}
                                    >
                                        {canDelete && (
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(job._id)}
                                                    onChange={() => toggleSelect(job._id)}
                                                    className="checkbox-input"
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <div className="job-title-cell flex-align-center gap-12">
                                                <div style={{ flex: 1 }}>
                                                    <HighlightText text={job.title} highlight={searchQuery} />
                                                </div>
                                                <div className="kanban-card__menu-container">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(activeMenu === job.uniqueId ? null : String(job.uniqueId));
                                                        }}
                                                        className="kanban-card__menu-btn"
                                                    >
                                                        <MoreVerticalIcon size={16} />
                                                    </button>
                                                    {activeMenu === job.uniqueId && (
                                                        <div className="kanban-card__menu" style={{ right: 0, top: '100%' }}>
                                                            <div onClick={(e) => { e.stopPropagation(); handleEditJob(job._id, job.managerIndex); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                <EditIcon size={14} /> Edit
                                                            </div>
                                                            <div onClick={(e) => { e.stopPropagation(); setEmailModalJobId(job._id); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                <MailIcon size={14} /> Email Candidates
                                                            </div>
                                                            <div onClick={(e) => { e.stopPropagation(); openShareModal(job); }} className="kanban-card__menu-item">
                                                                <SendIcon size={14} /> Send to HR
                                                            </div>
                                                            {canDelete && (
                                                                <div onClick={(e) => { e.stopPropagation(); handleDelete(job._id); setActiveMenu(null); }} className="kanban-card__menu-item kanban-card__menu-item--danger">
                                                                    <TrashIcon size={14} /> Delete
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="location-cell">
                                                <MapPinIcon size={14} />
                                                <HighlightText text={`${job.location}${job.branch !== '-' ? ` (${job.branch})` : ''}`} highlight={searchQuery} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs font-semibold text-gray-500">
                                                {job.department} / {job.channel}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs font-medium text-gray-700">
                                                {job.managerName}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="type-badge">
                                                <HighlightText text={job.type || 'Full-time'} highlight={searchQuery} />
                                            </span>
                                        </td>
                                        <td>
                                            <div className="openings-count">
                                                <HighlightText text={job.openPosition} highlight={searchQuery} />
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                value={job.status}
                                                onChange={(e) => handleStatusChange(job._id, e.target.value, job.managerIndex)}
                                                className={`status-select ${job.status === 'Open' ? 'status-select--open' :
                                                    job.status === 'Closed' ? 'status-select--closed' :
                                                        job.status === 'Draft' ? 'status-select--draft' : 'status-select--hold'
                                                    }`}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="Closed">Closed</option>
                                                <option value="Draft">Draft</option>
                                                <option value="Hold">Hold</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="applicant-badge">
                                                <UserIcon size={12} className="mr-6" />
                                                {job.candidateCount || 0} Applied
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                {formatDate(job.createdAt)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                Object.entries(groupedJobs).map(([company, jobs]) => (
                                    <Fragment key={company}>
                                        <tr className="group-header-row">
                                            <td colSpan={12} className="bg-gray-50/80 backdrop-blur-sm py-3 px-6">
                                                <div className="flex-align-center gap-12">
                                                    <BriefcaseIcon size={16} className="text-blue-600" />
                                                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{company}</span>
                                                    <span className="count-badge-modern">{jobs.length} Positions</span>

                                                    <div className="kanban-card__menu-container">
                                                        <button
                                                            className="kanban-card__menu-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenu(activeMenu === company ? null : company);
                                                            }}
                                                        >
                                                            <MoreVerticalIcon size={16} />
                                                        </button>
                                                        {activeMenu === company && (
                                                            <div className="kanban-card__menu" style={{ left: 0, top: '100%', minWidth: '160px' }}>
                                                                <div className="kanban-card__menu-item" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}>
                                                                    <MailIcon size={14} /> Email Group
                                                                </div>
                                                                <div className="kanban-card__menu-item" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}>
                                                                    <SendIcon size={14} /> Export Group
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {jobs.map(job => (
                                            <tr
                                                key={job.uniqueId}
                                                className={`${selectedIds.includes(job._id) ? 'selected-row' : ''} table-row-clickable`}
                                                onDoubleClick={() => handleEditJob(job._id, job.managerIndex)}
                                                onContextMenu={(e) => handleContextMenu(e, job)}
                                            >
                                                {canDelete && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(job._id)}
                                                            onChange={() => toggleSelect(job._id)}
                                                            className="checkbox-input"
                                                        />
                                                    </td>
                                                )}
                                                <td>
                                                    <div className="job-title-cell flex-align-center gap-12">
                                                        <div style={{ flex: 1 }}>
                                                            <HighlightText text={job.title} highlight={searchQuery} />
                                                        </div>
                                                        <div className="kanban-card__menu-container">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenu(activeMenu === job.uniqueId ? null : String(job.uniqueId));
                                                                }}
                                                                className="kanban-card__menu-btn"
                                                            >
                                                                <MoreVerticalIcon size={16} />
                                                            </button>
                                                            {activeMenu === job.uniqueId && (
                                                                <div className="kanban-card__menu" style={{ right: 0, top: '100%' }}>
                                                                    <div onClick={(e) => { e.stopPropagation(); handleEditJob(job._id, job.managerIndex); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                        <EditIcon size={14} /> Edit
                                                                    </div>
                                                                    <div onClick={(e) => { e.stopPropagation(); setEmailModalJobId(job._id); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                        <MailIcon size={14} /> Email Candidates
                                                                    </div>
                                                                    <div onClick={(e) => { e.stopPropagation(); openShareModal(job); }} className="kanban-card__menu-item">
                                                                        <SendIcon size={14} /> Send to HR
                                                                    </div>
                                                                    {canDelete && (
                                                                        <div onClick={(e) => { e.stopPropagation(); handleDelete(job._id); setActiveMenu(null); }} className="kanban-card__menu-item kanban-card__menu-item--danger">
                                                                            <TrashIcon size={14} /> Delete
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="location-cell">
                                                        <MapPinIcon size={14} />
                                                        <HighlightText text={`${job.location}${job.branch !== '-' ? ` (${job.branch})` : ''}`} highlight={searchQuery} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-semibold text-gray-500">
                                                        {job.department} / {job.channel}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-medium text-gray-700">
                                                        {job.managerName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="type-badge">
                                                        <HighlightText text={job.type} highlight={searchQuery} />
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="openings-count">
                                                        <HighlightText text={job.openPosition} highlight={searchQuery} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <select
                                                        value={job.status}
                                                        onChange={(e) => handleStatusChange(job._id, e.target.value, job.managerIndex)}
                                                        className={`status-select ${job.status === 'Open' ? 'status-select--open' :
                                                            job.status === 'Closed' ? 'status-select--closed' :
                                                                job.status === 'Draft' ? 'status-select--draft' : 'status-select--hold'
                                                            }`}
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="Closed">Closed</option>
                                                        <option value="Draft">Draft</option>
                                                        <option value="Hold">Hold</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <div className="applicant-badge">
                                                        <UserIcon size={12} className="mr-6" />
                                                        {job.candidateCount} Applied
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="date-cell">
                                                        {formatDate(job.createdAt)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="pagination-wrapper-modern">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredJobs.length}
                            itemsPerPage={jobsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={(newLimit) => {
                                setJobsPerPage(newLimit);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            ) : viewMode === 'kanban' ? (
                <div className="kanban-board custom-scrollbar">
                    {(groupBy === 'status' ? ['Open', 'Hold', 'Closed', 'Draft'] : Object.keys(groupedJobs)).map(columnKey => {
                        const columnJobs = groupBy === 'status'
                            ? filteredJobs.filter(j => j.status === columnKey)
                            : groupedJobs[columnKey];

                        return (
                            <div
                                key={columnKey}
                                className="kanban-column"
                                onDragOver={(e) => handleDragOver(e, columnKey)}
                                onDrop={(e) => handleDrop(e, columnKey)}
                            >
                                <div className="kanban-column__header">
                                    <div className="flex-align-center gap-8">
                                        {groupBy === 'status' ? (
                                            <div className={`status-dot status-dot--${columnKey.toLowerCase()}`}></div>
                                        ) : (
                                            <BriefcaseIcon size={14} className="text-blue-500" />
                                        )}
                                        <h3 className="kanban-column__title">{columnKey}</h3>
                                    </div>
                                    <span className="kanban-column__count">{columnJobs.length}</span>
                                </div>
                                <div className={`kanban-column__content ${dragOverStatus === columnKey ? 'kanban-column__content--dragover' : ''}`}>
                                    {columnJobs.length > 0 ? columnJobs.map(job => (
                                        <div
                                            key={job.uniqueId}
                                            className={`kanban-card kanban-card--${job.status.toLowerCase()} ${selectedIds.includes(job._id) ? 'kanban-card--selected' : ''} ${draggedJobId === job._id ? 'kanban-card--dragging' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, job._id, job.managerIndex)}
                                            onDragEnd={handleDragEnd}
                                            onDoubleClick={() => handleEditJob(job._id, job.managerIndex)}
                                        >
                                            <div className="kanban-card__header">
                                                <div className="kanban-card__logo-wrapper">
                                                    <div className="kanban-card__logo">
                                                        {job.logo ? (
                                                            <img
                                                                src={job.logo.startsWith('http') || job.logo.startsWith('data:') ? job.logo : `${BASE_URL}${job.logo.startsWith('/') ? '' : '/'}${job.logo}`}
                                                                alt={job.company}
                                                            />
                                                        ) : (
                                                            <BriefcaseIcon size={20} />
                                                        )}
                                                    </div>
                                                    <h4 className="kanban-card__title">
                                                        <HighlightText text={job.title} highlight={searchQuery} />
                                                    </h4>
                                                </div>
                                                <div className="kanban-card__menu-container">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(activeMenu === job.uniqueId ? null : String(job.uniqueId));
                                                        }}
                                                        className="kanban-card__menu-btn"
                                                    >
                                                        <MoreVerticalIcon size={16} />
                                                    </button>
                                                    {activeMenu === job.uniqueId && (
                                                        <div className="kanban-card__menu">
                                                            <div onClick={(e) => { e.stopPropagation(); handleEditJob(job._id, job.managerIndex); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                <EditIcon size={14} /> Edit
                                                            </div>
                                                            <div onClick={(e) => { e.stopPropagation(); setEmailModalJobId(job._id); setActiveMenu(null); }} className="kanban-card__menu-item">
                                                                <MailIcon size={14} /> Email Candidates
                                                            </div>
                                                            <div onClick={(e) => { e.stopPropagation(); openShareModal(job); }} className="kanban-card__menu-item">
                                                                <SendIcon size={14} /> Send to HR
                                                            </div>
                                                            {canDelete && (
                                                                <div onClick={(e) => { e.stopPropagation(); handleDelete(job._id); setActiveMenu(null); }} className="kanban-card__menu-item kanban-card__menu-item--danger">
                                                                    <TrashIcon size={14} /> Delete
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="kanban-card__info">
                                                <div className="kanban-card__info-item" title="Company">
                                                    <BriefcaseIcon size={14} />
                                                    <HighlightText text={job.company} highlight={searchQuery} />
                                                </div>
                                                <div className="kanban-card__info-item" title="Location & Branch">
                                                    <MapPinIcon size={14} />
                                                    <HighlightText text={`${job.location}${job.branch !== '-' ? ` (${job.branch})` : ''}`} highlight={searchQuery} />
                                                </div>
                                                <div className="kanban-card__info-item" title="Dept / Channel">
                                                    <GridIcon size={14} />
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {job.department} • {job.channel}
                                                    </span>
                                                </div>
                                                {job.managerName !== '-' && (
                                                    <div className="kanban-card__info-item" title="Manager">
                                                        <UserIcon size={14} />
                                                        <span className="text-xs text-gray-600">{job.managerName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="kanban-card__tags">
                                                <span className="kanban-card__tag kanban-card__tag--primary">
                                                    <span className="kanban-card__tag--primary-dot"></span>
                                                    {job.type}
                                                </span>
                                                {job.ctc !== '-' && (
                                                    <span className="kanban-card__tag kanban-card__tag--success">
                                                        ₹ {job.ctc} LPA
                                                    </span>
                                                )}
                                                {job.openPosition && (
                                                    <span className="kanban-card__tag kanban-card__tag--warning">
                                                        {job.openPosition} Openings
                                                    </span>
                                                )}
                                            </div>

                                            <div className="kanban-card__footer">
                                                <div className="apps-count">
                                                    <UserIcon size={14} />
                                                    {job.candidateCount || 0} Apps
                                                </div>
                                                <div className="posted-date">
                                                    {formatDate(job.createdAt)}
                                                </div>
                                            </div>

                                        </div>
                                    ))
                                        : (
                                            <div className="kanban-empty-state">No jobs</div>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}
            <Modal
                isOpen={!!emailModalJobId}
                onClose={() => setEmailModalJobId(null)}
                title={`Email Applicants - ${selectedJob?.title || ''}`}
                footer={
                    <div className="flex justify-end gap-12">
                        <button className="btn-secondary" onClick={() => setEmailModalJobId(null)}>Cancel</button>
                        <button className="btn-primary flex-align-center gap-8" onClick={handleSendEmail} disabled={sendingEmail}>
                            {sendingEmail ? 'Sending...' : (
                                <>
                                    <MailIcon size={16} /> 
                                    {selectedRecipientId === 'all' 
                                        ? 'Send to All Applicants' 
                                        : selectedRecipientId === 'custom' 
                                            ? `Send to ${selectedCandidateIds.length} Candidate(s)` 
                                            : 'Send Email'}
                                </>
                            )}
                        </button>
                    </div>
                }
            >
                <div className="modal-form-container">
                    <div className="input-group">
                        <label className="input-label">To</label>
                        <div className="tab-nav mb-12" style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedRecipientId('all')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    background: selectedRecipientId === 'all' ? '#ffffff' : 'transparent',
                                    color: selectedRecipientId === 'all' ? 'var(--primary)' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: selectedRecipientId === 'all' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                All Applicants ({jobCandidates.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedRecipientId('custom')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    background: selectedRecipientId === 'custom' ? '#ffffff' : 'transparent',
                                    color: selectedRecipientId === 'custom' ? 'var(--primary)' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: selectedRecipientId === 'custom' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Select Candidates ({selectedCandidateIds.length})
                            </button>
                        </div>

                        {selectedRecipientId === 'custom' && (
                            <div className="candidate-selector-list" style={{
                                maxHeight: '180px',
                                overflowY: 'auto',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                marginTop: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                                    <input
                                        type="checkbox"
                                        id="select-all-candidates"
                                        checked={selectedCandidateIds.length === jobCandidates.length && jobCandidates.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCandidateIds(jobCandidates.map(c => c._id));
                                            } else {
                                                setSelectedCandidateIds([]);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label htmlFor="select-all-candidates" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
                                        Select All Candidates
                                    </label>
                                </div>
                                {jobCandidates.map(c => {
                                    const isChecked = selectedCandidateIds.includes(c._id);
                                    return (
                                        <div 
                                            key={c._id} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '10px', 
                                                padding: '6px 8px', 
                                                borderRadius: '6px',
                                                background: isChecked ? 'rgba(0, 84, 141, 0.04)' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`candidate-chk-${c._id}`}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCandidateIds(prev => [...prev, c._id]);
                                                    } else {
                                                        setSelectedCandidateIds(prev => prev.filter(id => id !== c._id));
                                                    }
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label htmlFor={`candidate-chk-${c._id}`} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', margin: 0, flex: 1 }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email} • {c.phone}</span>
                                            </label>
                                        </div>
                                    );
                                })}
                                {jobCandidates.length === 0 && (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        No applicants found for this vacancy.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="input-group">
                        <label className="input-label">Select Template</label>
                        <select
                            className="input-field"
                            value={selectedEmailTemplateId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedEmailTemplateId(val);
                                if (val === 'custom') {
                                    setEmailSubject('');
                                    setEmailMessage('');
                                } else {
                                    const selected = emailTemplates.find(t => t._id === val);
                                    if (selected) {
                                        setEmailSubject(selected.subject || '');
                                        setEmailMessage(selected.body || '');
                                    }
                                }
                            }}
                        >
                            <option value="custom">Custom Message (No Template)</option>
                            {emailTemplates.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Interview Schedule for @designation"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            disabled={selectedEmailTemplateId !== 'custom'}
                        />
                    </div>
                    <div className="input-group">
                        <div className="modal-form__header-row">
                            <label className="modal-form__label--no-margin">Message Body</label>
                            <button
                                type="button"
                                onClick={handleGenerateDraft}
                                disabled={isGeneratingDraft || !emailSubject.trim() || selectedEmailTemplateId !== 'custom'}
                                className="ai-magic-btn"
                            >
                                <SparklesIcon size={14} />
                                {isGeneratingDraft ? 'Drafting...' : 'AI Draft'}
                            </button>
                        </div>
                        <textarea
                            className="input-field h-100"
                            placeholder="Dear @name,\n\nWe are pleased to inform you that your application for @designation has been shortlisted..."
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            disabled={selectedEmailTemplateId !== 'custom'}
                        />
                    </div>
                    <div className="modal-info-box">
                        <strong>Available Dynamic Tags:</strong>
                        <ul className="modal-info-box__list">
                            <li><code>@name</code> - Candidate's Full Name</li>
                            <li><code>@email</code> - Candidate's Email</li>
                            <li><code>@phone</code> - Candidate's Phone</li>
                            <li><code>@designation</code> - Applied Designation</li>
                            <li><code>@company</code> - Current Company</li>
                            <li><code>@location</code> - Candidate Location</li>
                        </ul>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={!!shareModalJobId}
                onClose={() => setShareModalJobId(null)}
                title="Share with HR"
                subtitle="Send applicant details via email"
                size="md"
                footer={
                    <div className="flex justify-end gap-12">
                        <button className="btn-secondary" onClick={() => setShareModalJobId(null)}>Cancel</button>
                        <button className="btn-primary flex-align-center gap-8" onClick={handleShareWithHR} disabled={isSharingHR}>
                            {isSharingHR ? 'Sending...' : <><SendIcon size={16} /> Send to HR</>}
                        </button>
                    </div>
                }
            >
                <div className="modal-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                        <label className="input-label">HR Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="hr@company.com"
                            value={hrEmailAddress}
                            onChange={(e) => setHrEmailAddress(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Select Template</label>
                        <select
                            className="input-field"
                            value={selectedHrTemplateId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedHrTemplateId(val);
                                if (val === 'custom') {
                                    setHrSubject(defaultHrSubject);
                                    setHrMessage(defaultHrMessage);
                                } else {
                                    const selected = emailTemplates.find(t => t._id === val);
                                    if (selected) {
                                        setHrSubject(selected.subject || '');
                                        setHrMessage(selected.body || '');
                                    }
                                }
                            }}
                        >
                            <option value="custom">Custom Message (No Template)</option>
                            {emailTemplates.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Subject</label>
                        <input
                            type="text"
                            className="input-field"
                            value={hrSubject}
                            onChange={(e) => setHrSubject(e.target.value)}
                            disabled={selectedHrTemplateId !== 'custom'}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Message Body</label>
                        <textarea
                            className="input-field h-100"
                            rows={4}
                            placeholder="Please find below the candidate details..."
                            value={hrMessage}
                            onChange={(e) => setHrMessage(e.target.value)}
                            disabled={selectedHrTemplateId !== 'custom'}
                        />
                    </div>
                    <div className="modal-info-box">
                        <p className="text-muted mb-0" style={{ fontSize: '0.8125rem' }}>
                            A detailed table of all applicants (including names, contact details, experience, CTC, and resume downloads) will be appended automatically at the bottom of this email.
                        </p>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={!!viewingCandidate}
                onClose={() => setViewingCandidate(null)}
                title="Candidate Details"
                subtitle={viewingCandidate?.name}
                size="lg"
                footer={<button className="btn btn-primary" onClick={() => setViewingCandidate(null)}>Close</button>}
            >
                {viewingCandidate && (
                    <div className="candidate-detail-modal-wrapper">
                        <div className="candidate-detail-header-premium">
                            <div className="candidate-avatar-large">
                                {viewingCandidate.photograph ? (
                                    <img src={viewingCandidate.photograph.fileUrl.startsWith('http') ? viewingCandidate.photograph.fileUrl : `${BASE_URL}${viewingCandidate.photograph.fileUrl}`} alt="" className="candidate-avatar-img" />
                                ) : (
                                    viewingCandidate.name[0].toUpperCase()
                                )}
                            </div>
                            <div className="candidate-info-premium">
                                <h3 className="candidate-name-premium">{viewingCandidate.name}</h3>
                                <div className="candidate-meta-premium">
                                    <span>UID: {viewingCandidate._id.slice(-6).toUpperCase()}</span>
                                    <span className="separator">•</span>
                                    <span>Applied: {new Date(viewingCandidate.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="candidate-status-badge-premium">
                                {viewingCandidate.recruitmentStatus || 'Applied'}
                            </div>
                        </div>

                        <div className="candidate-grid-premium">
                            <div className="candidate-section-premium">
                                <div className="section-title-premium"><UserIcon size={18} /> Personal Information</div>
                                <div className="data-row-premium">
                                    <span className="label">Email:</span>
                                    <span className="value">{viewingCandidate.email}</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">Phone:</span>
                                    <span className="value">{viewingCandidate.phone}</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">Location:</span>
                                    <span className="value">{viewingCandidate.location}</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">CTC:</span>
                                    <span className="value highlight-success">₹ {viewingCandidate.currentCTC} LPA</span>
                                </div>
                            </div>

                            <div className="candidate-section-premium">
                                <div className="section-title-premium"><BriefcaseIcon size={18} /> Professional Details</div>
                                <div className="data-row-premium">
                                    <span className="label">Current Company:</span>
                                    <span className="value font-bold">{viewingCandidate.currentCompany}</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">Current Role:</span>
                                    <span className="value">{viewingCandidate.designation}</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">Total Experience:</span>
                                    <span className="value">{viewingCandidate.totalWorkExp} Years</span>
                                </div>
                                <div className="data-row-premium">
                                    <span className="label">BFSI Exp:</span>
                                    <span className="value">{viewingCandidate.bfsiExp} Years</span>
                                </div>
                            </div>
                        </div>

                        {viewingCandidate.resume && (
                            <div className="candidate-actions-premium">
                                <a
                                    href={`${BASE_URL}${viewingCandidate.resume.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    <EyeIcon size={18} /> View Resume
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <DeleteConfirmationModal
                isOpen={!!deletingJobId}
                onClose={() => setDeletingJobId(null)}
                onConfirm={confirmDelete}
                itemName={jobs.find(j => j._id === deletingJobId)?.title || 'this job'}
                itemType="job"
            />

            <DeleteConfirmationModal
                isOpen={isBulkDeleting}
                onClose={() => setIsBulkDeleting(false)}
                onConfirm={confirmBulkDelete}
                itemName={`${selectedIds.length} selected jobs`}
                itemType="bulk jobs"
            />

            <Drawer
                isOpen={isJobDrawerOpen}
                onClose={() => setIsJobDrawerOpen(false)}
                title={editingJobId ? 'Edit Job Posting' : 'Create New Job'}
                width="550px"
            >
                <JobForm
                    editId={editingJobId}
                    initialManagerIndex={editingManagerIndex}
                    onClose={() => setIsJobDrawerOpen(false)}
                    onSuccess={fetchJobs}
                    hideHeader={true}
                />
            </Drawer>

            {/* Advanced Filter Modal */}
            {isFilterModalOpen && (
                <Modal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    title="ADVANCED JOB FILTERS"
                    maxWidth="750px"
                >
                    <div className="custom-scrollbar" style={{ padding: '1rem', overflowY: 'auto', maxHeight: '70vh' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {JOB_FILTER_COLUMNS.map((col) => {
                                const currentData = localFilters[col.key] || { operator: 'contains', value: '' };

                                return (
                                    <div key={col.key} className="filter-item-modern">
                                        <label className="filter-label-modern" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                                            {col.label}
                                        </label>
                                        <div className="filter-input-wrapper" style={{ position: 'relative' }}>
                                            {col.type === 'select' ? (
                                                <select
                                                    className="filter-select-modern"
                                                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                                                    value={currentData.value}
                                                    onChange={(e) => {
                                                        setLocalFilters({
                                                            ...localFilters,
                                                            [col.key]: { operator: 'is', value: e.target.value }
                                                        });
                                                    }}
                                                >
                                                    <option value="">All {col.label}s</option>
                                                    {(masterData as any)[col.key]?.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="filter-input-modern"
                                                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                                                    placeholder={`Filter by ${col.label}...`}
                                                    value={currentData.value}
                                                    onChange={(e) => {
                                                        setLocalFilters({
                                                            ...localFilters,
                                                            [col.key]: { operator: 'contains', value: e.target.value }
                                                        });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="classic-filter-footer" style={{
                        padding: '1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc',
                        borderBottomLeftRadius: '12px',
                        borderBottomRightRadius: '12px'
                    }}>
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setLocalFilters({})}
                                className="btn btn-outline"
                                style={{ color: '#ef4444', border: 'none' }}
                            >
                                Clear All
                            </button>
                            <button
                                onClick={applyClassicFilters}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                Apply Filters <CheckCircleIcon size={18} />
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {contextMenu && (
                <div
                    className="kanban-card__menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 9999,
                        display: 'block',
                        minWidth: '180px'
                    }}
                >
                    <div onClick={(e) => { e.stopPropagation(); handleEditJob(contextMenu.job._id, contextMenu.job.managerIndex); setContextMenu(null); }} className="kanban-card__menu-item">
                        <EditIcon size={14} /> Edit
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); setEmailModalJobId(contextMenu.job._id); setContextMenu(null); }} className="kanban-card__menu-item">
                        <MailIcon size={14} /> Email Candidates
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); openShareModal(contextMenu.job); setContextMenu(null); }} className="kanban-card__menu-item">
                        <SendIcon size={14} /> Send to HR
                    </div>
                    {canDelete && (
                        <div onClick={(e) => { e.stopPropagation(); handleDelete(contextMenu.job._id); setContextMenu(null); }} className="kanban-card__menu-item kanban-card__menu-item--danger">
                            <TrashIcon size={14} /> Delete
                        </div>
                    )}
                </div>
            )}
        </div >
    );
};

export default JobList;
