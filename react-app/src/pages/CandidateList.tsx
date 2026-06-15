import React, { useEffect, useState, useRef, useMemo } from 'react';
import { formatAppDate } from '../utils/helpers';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { EditIcon, EyeIcon, FileTextIcon, GridIcon, ListIcon, TrashIcon, SettingsIcon, ChevronDownIcon, SearchIcon, UsersIcon, MailIcon, PlusIcon, CheckCircleIcon, GripVerticalIcon, PinIcon, MoreVerticalIcon, CalendarIcon, RefreshIcon, PhoneIcon, SparklesIcon, CheckIcon, ChevronRightIcon, ArrowRightIcon, WhatsappIcon, MessageIcon, VideoIcon } from '../icons';
import InterviewList from './InterviewList';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Pagination from '../components/Pagination';
import EmailModal from '../components/EmailModal';
import Tooltip from '../components/Tooltip';
import CandidateDetailModal from '../components/CandidateDetailModal';
import Drawer from '../components/Drawer';
import CandidateForm from './CandidateForm';
import CandidateProfileView from '../components/CandidateProfileView';

interface User {
    _id: string;
    name: string;
    role: string;
    status?: string;
}
interface Ticket {
    ticketNo: string;
    companyName: string;
    uploaddate: string;
    expdate: string;
    crtdate: string;
    type: string;
    portalStatus: string;
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
    panCard?: { fileUrl: string; fileName: string };
    aadhaarCard?: { fileUrl: string; fileName: string };
    educationProof?: { fileUrl: string; fileName: string };
    offerLetter?: { fileUrl: string; fileName: string };
    relativeLetter?: { fileUrl: string; fileName: string };
    isApproved?: boolean;
    approvedBy?: string | { _id: string, name: string };
    approvedAt?: string;
    createdBy?: string | { _id: string, name: string };
    applicationId?: string;
    leadTag?: string;
    updatedAt?: string;
    updatedBy?: string | { _id: string, name: string };
    offerStatus?: string;
    isResigned?: string;
    resignationLetter?: { fileUrl: string, fileName: string };
    doj?: string;
    noticePeriod?: string;
    aiScore?: number;
    aiSummary?: string;
    aiMatchBasis?: string | {
        matchReason?: string;
        skillFit?: string;
        experienceGap?: string;
    };
    prLocation?: string;
    avatarUrl?: string;
    willingToRelocate?: boolean;
    assignedOperationManager?: { _id: string; name: string } | string;
}
// Helper functions defined at the top or inside if needed
const HighlightText = ({ text, highlight, maxLength }: { text: string | number, highlight: string, maxLength?: number }) => {
    let stringText = text?.toString() || '';
    if (maxLength && stringText.length > maxLength) {
        stringText = stringText.substring(0, maxLength) + '...';
    }
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
    return formatAppDate(dateString);
};


const CandidateList = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [unapprovedCandidates, setUnapprovedCandidates] = useState<Candidate[]>([]);
    const [unapprovedLoading, setUnapprovedLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { user, activeRole } = useAuth();
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [activeTab, setActiveTab] = useState<'Candidate' | 'Schedule' | 'Validation' | 'Lead'>('Candidate');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
    const [viewingTickets, setViewingTickets] = useState<Candidate | null>(null);
    const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [confirmBulkSwitchRecruiter, setConfirmBulkSwitchRecruiter] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);

    const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: string[] }>({
        currentCompany: [],
        currentProfile: [],
        designation: [],
        noticePeriod: ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days'],
        sector: ['BFSI', 'Insurance', 'Banking', 'Other'],
        qualification: ['Graduate', 'Post Graduate', 'MBA', 'Other'],
        channel: ['Banca', 'Agency', 'Direct', 'Other'],
        location: [],
        leadTag: [],
        recruitmentStatus: [],
        jobTitle: [],
        assessmentStatus: []
    });

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [options, jobsData] = await Promise.all([
                    api.getOptions(),
                    api.getJobs({ status: 'Open' })
                ]);

                setJobs(jobsData);
                const openCompanies = Array.from(new Set(jobsData.map((j: any) => j.company))).filter(Boolean) as string[];

                setDynamicOptions(prev => ({
                    ...prev,
                    ...options,
                    currentCompany: Array.from(new Set([...(options.currentCompany || []), ...openCompanies]))
                }));
            } catch (error) {
                console.error('Error fetching master data for filters:', error);
            }
        };
        fetchMasterData();
    }, []);

    const masterData = useMemo(() => {
        const data = {
            designation: new Set(dynamicOptions.designation || []),
            currentCompany: new Set(dynamicOptions.currentCompany || []),
            currentProfile: new Set(dynamicOptions.currentProfile || []),
            noticePeriod: new Set(dynamicOptions.noticePeriod || []),
            sector: new Set(dynamicOptions.sector || []),
            location: new Set(dynamicOptions.location || []),
            status: new Set(dynamicOptions.recruitmentStatus && dynamicOptions.recruitmentStatus.length > 0 ? dynamicOptions.recruitmentStatus : ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined']),
            gender: new Set(['Male', 'Female', 'Other']),
            channel: new Set(dynamicOptions.channel || []),
            assessment: new Set(dynamicOptions.assessmentStatus && dynamicOptions.assessmentStatus.length > 0 ? dynamicOptions.assessmentStatus : ['Clear', 'Not Clear', 'Pending']),
            qualification: new Set(dynamicOptions.qualification || [])
        };

        const all = [...candidates, ...unapprovedCandidates];
        all.forEach(c => {
            if (c.designation) data.designation.add(c.designation);
            if (c.currentCompany) data.currentCompany.add(c.currentCompany);
            if (c.currentProfile) data.currentProfile.add(c.currentProfile);
            if (c.noticePeriod) data.noticePeriod.add(c.noticePeriod);
            if (c.sector) data.sector.add(c.sector);
            if (c.location) data.location.add(c.location);
            if (c.recruitmentStatus) data.status.add(c.recruitmentStatus);
            if (c.gender) data.gender.add(c.gender);
            if (c.channel) data.channel.add(c.channel);
            // assessment is standardized, don't add from data
            if (c.qualification) data.qualification.add(c.qualification);
        });

        const final: any = {};
        Object.keys(data).forEach(key => {
            final[key] = Array.from((data as any)[key]).filter(Boolean).sort();
        });
        return final;
    }, [candidates, unapprovedCandidates, dynamicOptions]);

    // Hover Card Portal States
    const [hoveredCandidate, setHoveredCandidate] = useState<Candidate | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ top: number, left: number } | null>(null);
    const [hoverPlacement] = useState<'up' | 'down'>('down');

    const hoverTimeoutRef = useRef<any>(null);

    const handleNameMouseEnter = (e: React.MouseEvent<HTMLElement>, candidate: Candidate) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        let left = rect.left + scrollX;
        if (rect.left + 320 > window.innerWidth) {
            left = window.innerWidth - 340 + scrollX;
            if (left < 0) left = 10;
        }

        let top = rect.bottom + scrollY + 4;

        setHoverPosition({ top, left });
        setHoveredCandidate(candidate);
    };

    const handleNameMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredCandidate(null);
            setHoverPosition(null);
        }, 300);
    };

    const handleCardMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleCardMouseLeave = () => {
        handleNameMouseLeave();
    };

    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    // Candidate Form Drawer States
    const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [selectedActivityModal, setSelectedActivityModal] = useState<'Note' | 'Call' | 'Interview' | null>(null);

    useEffect(() => {
        if (location.state?.openForm) {
            handleAddNew();
            // Clear state so it doesn't reopen on every render
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    const handleAddNew = () => {
        setSelectedCandidateId(null);
        setIsFormDrawerOpen(true);
    };

    const handleEditCandidate = (id: string) => {
        setSelectedCandidateId(id);
        setIsFormDrawerOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormDrawerOpen(false);
        setSelectedCandidateId(null);
        fetchCandidates(); // Refresh list after save/edit
    };

    const handleOpenProfile = (id: string) => {
        setSelectedProfileId(id);
        setIsProfileDrawerOpen(true);
    };

    const handleCloseProfile = () => {
        setIsProfileDrawerOpen(false);
        setSelectedProfileId(null);
        setSelectedActivityModal(null);
    };

    // Scheduling & Modal States
    const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
    const [scheduleFormData, setScheduleFormData] = useState({
        date: '',
        time: '',
        mode: 'Video',
        status: 'Pending',
        stage: 'First Round',
        companyName: '',
        offers: 'No',
        shortlisted: 'No'
    });
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTarget, setEmailTarget] = useState<'selected' | 'all'>('selected');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [switchingCreatedBy, setSwitchingCreatedBy] = useState<Candidate | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [switchingLoading, setSwitchingLoading] = useState(false);
    const [bulkSwitchingLoading, setBulkSwitchingLoading] = useState(false);
    const [assigningOperation, setAssigningOperation] = useState<Candidate | null>(null);
    const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
    const [newRecruiterId, setNewRecruiterId] = useState('');
    const [operationFormData, setOperationFormData] = useState({
        companies: [] as string[],
        tickets: [] as Ticket[],
        date: new Date().toISOString().split('T')[0],
        filedDate: new Date().toISOString().split('T')[0],
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
    const [submittingOperation, setSubmittingOperation] = useState(false);
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

    const fetchJobs = async () => {
        try {
            const data = await api.getJobs({ status: 'Open' });
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Advanced Filtering States
    const [filters, setFilters] = useState<{ id: string, field: string, operator: string, value: string }[]>([]);
    const [filterStep, setFilterStep] = useState<'fields' | 'condition'>('fields');
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedOperator, setSelectedOperator] = useState<string>('is');
    const [filterSearchQuery, setFilterSearchQuery] = useState('');
    const [tempFilterValue, setTempFilterValue] = useState('');
    const filterPopoverRef = useRef<HTMLDivElement>(null);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [filterViewMode, setFilterViewMode] = useState<'compact' | 'classic'>('classic');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<Record<string, { operator: string, value: string }>>({});
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Candidate Fields', 'Activity Fields', 'System Fields']);

    const FIELD_GROUPS = [
        {
            name: 'Candidate Fields',
            keys: ['name', 'email', 'phone', 'whatsapp', 'gender', 'dob', 'age', 'location', 'qualification', 'pan', 'totalWorkExp', 'totalSalesExp', 'bfsiExp', 'currentCompany', 'designation', 'currentCTC', 'currentProfile', 'noticePeriod', 'sector']
        },
        {
            name: 'Activity Fields',
            keys: ['leads', 'tickets', 'assessment', 'status', 'applicationId', 'channel', 'remark', 'aiScore']
        },
        {
            name: 'System Fields',
            keys: ['createdAt', 'createdAtTime', 'createdBy', 'updatedAt', 'updatedBy']
        }
    ];
    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName)
                ? prev.filter(g => g !== groupName)
                : [...prev, groupName]
        );
    };

    const canCreate = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.candidates?.create === true;
    const canEdit = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.candidates?.edit === true;
    const canDelete = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.candidates?.delete === true;
    const canAssignToOperation = user?.role !== 'Normal User';
    const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Advanced Header states
    const [pinnedColumns, setPinnedColumns] = useState<{ left: string[], right: string[] }>(() => {
        const saved = localStorage.getItem('candidate_pinned_columns');
        return saved ? JSON.parse(saved) : { left: [], right: [] };
    });
    const [headerMenu, setHeaderMenu] = useState<{ key: string, x: number, y: number, submenu?: 'pin' | 'add' } | null>(null);
    const [rowMenu, setRowMenu] = useState<{ candidate: Candidate, x: number, y: number, type?: 'icon' | 'context', openUpward?: boolean } | null>(null);
    const [columnPicker, setColumnPicker] = useState<{ index: number, x: number, y: number } | null>(null);
    const [resizingCol, setResizingCol] = useState<string | null>(null);
    const [columnSearchQuery, setColumnSearchQuery] = useState('');

    const [candidatesPerPage, setCandidatesPerPage] = useState(25);

    // Helper: Status Color Mapping (Comprehensive)
    const getStatusColor = (status: string) => {
        if (!status) return 'var(--text-muted)';
        const s = status.toLowerCase();
        if (s === 'clear') return '#10b981';
        if (s === 'not clear') return '#ef4444';
        if (s === 'pending') return '#6b7280';
        if (s.includes('shortlist') || s === 'shortlisted') return '#3b82f6';
        if (s.includes('reject') || s === 'rejected') return '#ef4444';
        if (s.includes('hold')) return '#6b7280';
        if (s.includes('select') || s === 'selected' || s === 'joined') return '#10b981';
        if (s.includes('interview') || s === 'interviewed' || s === 'applied' || s === 'in progress') return '#6366f1';
        if (s.includes('schedule')) return '#8b5cf6';
        if (s.includes('offer') || s === 'offered') return '#ec4899';
        if (s.includes('lead')) return s.includes('hot') ? '#10b981' : '#3b82f6';
        if (s.includes('jobseeker')) return '#3b82f6';
        return 'var(--text-muted)';
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const data = await api.getCandidates(true);
            setCandidates(data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnapprovedCandidates = async () => {
        setUnapprovedLoading(true);
        try {
            const data = await api.getCandidates(false);
            setUnapprovedCandidates(data);
        } catch (error) {
            console.error('Error fetching unapproved candidates:', error);
        } finally {
            setUnapprovedLoading(false);
        }
    };
    const ALL_COLUMNS = [
        { key: 'name', label: 'Name' },
        { key: 'aiScore', label: 'AI Score' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'designation', label: 'Job Title' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'totalWorkExp', label: 'Experience' },
        { key: 'totalSalesExp', label: 'Sales Exp' },
        { key: 'bfsiExp', label: 'BFSI Exp' },
        { key: 'sector', label: 'Sector' },
        { key: 'noticePeriod', label: 'Notice' },
        { key: 'currentCTC', label: 'CTC' },
        { key: 'location', label: 'Location' },
        { key: 'gender', label: 'Gender' },
        { key: 'age', label: 'Age' },
        { key: 'dob', label: 'DOB' },
        { key: 'pan', label: 'PAN' },
        { key: 'channel', label: 'Channel' },
        { key: 'doj', label: 'DOJ' },
        { key: 'willingToRelocate', label: 'Relocate' },
        { key: 'applicationId', label: 'App ID' },
        { key: 'leads', label: 'Lead Status' },
        { key: 'assessment', label: 'Assessment' },
        { key: 'status', label: 'Recruitment Status' },
        { key: 'isApproved', label: 'Approved' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'assignedOperationManager', label: 'Operation Manager' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'updatedAt', label: 'Updated At' }
    ];

    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('candidate_column_order');
        const order = saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.key);
        // Reconcile new columns that are not in the saved list (e.g. after update)
        const orderSet = new Set(order);
        ALL_COLUMNS.forEach(c => {
            if (!orderSet.has(c.key)) {
                order.push(c.key);
            }
        });
        return [...new Set(order)] as string[];
    });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem('candidate_visible_columns');
        if (saved) {
            const visible = JSON.parse(saved) as string[];
            // If we have saved visibility, only add columns that are brand NEW (i.e. not present in the saved configuration at all)
            const savedOrderStr = localStorage.getItem('candidate_column_order');
            const savedOrder = savedOrderStr ? JSON.parse(savedOrderStr) : [];
            const newKeys = ALL_COLUMNS.map(c => c.key).filter(k => !savedOrder.includes(k));
            return [...new Set([...visible, ...newKeys])] as string[];
        } else {
            return ALL_COLUMNS.map(c => c.key);
        }
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('candidate_column_widths');
        return saved ? JSON.parse(saved) : {
            name: 250,
            aiScore: 100,
            email: 220,
            phone: 150,
            designation: 180,
            currentCompany: 180,
            location: 150,
            status: 160,
            leads: 160,
            applicationId: 130,
            gender: 90,
            age: 80,
            dob: 120,
            doj: 120,
            pan: 120,
            channel: 130,
            willingToRelocate: 110,
            isApproved: 110,
            createdBy: 140,
            createdAt: 130,
            updatedAt: 130
        };
    });
    const filteredCandidates = useMemo(() => {
        const baseCandidates = activeTab === 'Validation' ? unapprovedCandidates : candidates;
        return baseCandidates.filter(candidate => {
            if (activeTab === 'Lead') {
                if (!['Hot Lead', 'Immediate Join'].includes(candidate.leadTag || '')) return false;
            }
            if (filters.length > 0) {
                const matchesAllFilters = filters.every(filter => {
                    let fieldValue: any = (candidate as any)[filter.field];
                    if (filter.field === 'createdAt') {
                        fieldValue = candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '';
                    } else if (filter.field === 'updatedAt') {
                        fieldValue = candidate.updatedAt ? new Date(candidate.updatedAt).toLocaleDateString() : '';
                    } else if (filter.field === 'createdBy' || filter.field === 'updatedBy') {
                        fieldValue = typeof fieldValue === 'object' ? fieldValue?.name : fieldValue;
                    } else if (filter.field === 'tickets') {
                        return candidate.tickets?.some(t =>
                            t.ticketNo?.toLowerCase().includes(filter.value.toLowerCase()) ||
                            t.companyName?.toLowerCase().includes(filter.value.toLowerCase())
                        );
                    }
                    const val = fieldValue?.toString().toLowerCase() || '';
                    const searchVal = filter.value.toLowerCase();
                    switch (filter.operator) {
                        case 'is': return val === searchVal;
                        case 'is not': return val !== searchVal;
                        case 'contains': return val.includes(searchVal);
                        case 'does not contain': return !val.includes(searchVal);
                        case 'contains exact word': return new RegExp('\\b' + filter.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(fieldValue?.toString() || '');
                        case 'contains at least one': {
                            const words = searchVal.split(',').map(w => w.trim()).filter(Boolean);
                            return words.some(w => val.includes(w));
                        }
                        case 'begins with': return val.startsWith(searchVal);
                        case 'ends with': return val.endsWith(searchVal);
                        case 'has any value': return val.length > 0;
                        case 'is empty': return val.length === 0;
                        case 'is after': {
                            if (!fieldValue) return false;
                            const itemDate = new Date(fieldValue).getTime();
                            const filterDate = new Date(filter.value).getTime();
                            return itemDate > filterDate;
                        }
                        case 'is before': {
                            if (!fieldValue) return false;
                            const itemDate = new Date(fieldValue).getTime();
                            const filterDate = new Date(filter.value).getTime();
                            return itemDate < filterDate;
                        }
                        case 'is exact': {
                            if (!fieldValue) return false;
                            const itemDate = new Date(fieldValue).toISOString().split('T')[0];
                            const filterDate = new Date(filter.value).toISOString().split('T')[0];
                            return itemDate === filterDate;
                        }
                        default: return val.includes(searchVal);
                    }
                });
                if (!matchesAllFilters) return false;
            }
            const query = searchQuery.toLowerCase();
            if (!query) return true;
            const matchesBasic = [
                candidate.name,
                candidate.email,
                candidate.phone,
                candidate.whatsapp,
                candidate.location,
                candidate.designation,
                candidate.currentCompany,
                candidate.currentProfile,
                candidate.sector,
                candidate.channel,
                candidate.recruitmentStatus,
                candidate.remark,
                candidate.applicationId,
                candidate.leadTag
            ].some(field => field?.toString().toLowerCase().includes(query));
            if (matchesBasic) return true;
            return candidate.tickets?.some(ticket =>
                ticket.ticketNo?.toLowerCase().includes(query) ||
                ticket.companyName?.toLowerCase().includes(query)
            );
        }).sort((a, b) => {
            if (activeTab === 'Lead') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return 0;
        });
    }, [candidates, unapprovedCandidates, activeTab, filters, searchQuery]);

    // Sorting Logic
    const handleSort = (key: string, direction?: 'asc' | 'desc' | null) => {
        if (direction === null) {
            setSortConfig(null);
            return;
        }

        if (direction) {
            setSortConfig({ key, direction });
            return;
        }

        let newDir: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            newDir = 'desc';
        }
        setSortConfig({ key, direction: newDir });
    };

    const sortedCandidates = useMemo(() => {
        if (!sortConfig) return filteredCandidates;
        return [...filteredCandidates].sort((a, b) => {
            const aVal = (a as any)[sortConfig.key];
            const bVal = (b as any)[sortConfig.key];
            const aStr = aVal?.toString() || '';
            const bStr = bVal?.toString() || '';
            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredCandidates, sortConfig]);

    const paginatedCandidates = useMemo(() => {
        const start = (currentPage - 1) * candidatesPerPage;
        return sortedCandidates.slice(start, start + candidatesPerPage);
    }, [sortedCandidates, currentPage, candidatesPerPage]);

    const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);

    // Persistence & Reconciliation
    useEffect(() => {
        // Deduplicate columnOrder and visibleColumns in state if they contain duplicates
        const uniqueOrder = [...new Set(columnOrder)];
        if (uniqueOrder.length !== columnOrder.length) {
            setColumnOrder(uniqueOrder);
            return;
        }

        const uniqueVisible = [...new Set(visibleColumns)];
        if (uniqueVisible.length !== visibleColumns.length) {
            setVisibleColumns(uniqueVisible);
            return;
        }

        // Save to localStorage
        localStorage.setItem('candidate_column_order', JSON.stringify(columnOrder));
        localStorage.setItem('candidate_visible_columns', JSON.stringify(visibleColumns));
        localStorage.setItem('candidate_pinned_columns', JSON.stringify(pinnedColumns));
        localStorage.setItem('candidate_column_widths', JSON.stringify(columnWidths));
    }, [columnOrder, visibleColumns, pinnedColumns, columnWidths]);

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, colKey: string) => {
        e.dataTransfer.setData('colKey', colKey);
        e.dataTransfer.setData('text/plain', colKey); // Fallback
        e.dataTransfer.effectAllowed = 'move';

        // Add a class for styling
        const target = e.currentTarget as HTMLElement;
        target.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('dragging');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetColKey: string) => {
        e.preventDefault();
        const draggedColKey = e.dataTransfer.getData('colKey') || e.dataTransfer.getData('text/plain');
        if (!draggedColKey || draggedColKey === targetColKey) return;

        const newOrder = [...columnOrder];
        const draggedIdx = newOrder.indexOf(draggedColKey);
        const targetIdx = newOrder.indexOf(targetColKey);

        if (draggedIdx === -1 || targetIdx === -1) return;

        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedColKey);
        setColumnOrder(newOrder);
    };

    // Resizing Handlers
    const resizingRef = useRef<{ key: string, startX: number, startWidth: number, container?: HTMLElement | null } | null>(null);

    const startResizing = (e: React.MouseEvent, colKey: string) => {
        e.preventDefault();
        const startWidth = columnWidths[colKey] || (colKey === 'name' ? 250 : 150);
        resizingRef.current = { key: colKey, startX: e.pageX, startWidth };

        // Find the container once to avoid repeated DOM lookups
        const container = document.querySelector('.modern-table-container') as HTMLElement;
        if (container) {
            resizingRef.current.container = container;
            container.classList.add('column-resizing');
        }

        document.body.classList.add('column-resizing');
        document.addEventListener('mousemove', handleResizing);
        document.addEventListener('mouseup', stopResizing);
    };

    const handleResizing = (e: MouseEvent) => {
        if (!resizingRef.current || !resizingRef.current.container) return;
        const diff = e.pageX - resizingRef.current.startX;
        const newWidth = Math.max(80, resizingRef.current.startWidth + diff);

        // Premium performance: Update the CSS variable on the local container for 60fps
        resizingRef.current.container.style.setProperty(`--col-w-${resizingRef.current.key}`, `${newWidth}px`);
    };

    const stopResizing = () => {
        if (resizingRef.current) {
            const { key: colKey, container } = resizingRef.current;
            if (container) {
                const finalWidthStr = container.style.getPropertyValue(`--col-w-${colKey}`);
                const finalWidth = parseInt(finalWidthStr);
                if (!isNaN(finalWidth)) {
                    setColumnWidths(prev => ({ ...prev, [colKey]: finalWidth }));
                }
                container.classList.remove('column-resizing');
            }
        }
        setResizingCol(null);
        resizingRef.current = null;
        document.body.classList.remove('column-resizing');
        document.removeEventListener('mousemove', handleResizing);
        document.removeEventListener('mouseup', stopResizing);
    };

    const handlePinColumn = (key: string, side: 'left' | 'right' | 'none') => {
        setPinnedColumns(prev => {
            const newLeft = prev.left.filter(k => k !== key);
            const newRight = prev.right.filter(k => k !== key);
            if (side === 'left') newLeft.push(key);
            if (side === 'right') newRight.push(key);
            return { left: newLeft, right: newRight };
        });

        // Reorder columnOrder to move pinned columns to start/end
        setColumnOrder(prev => {
            const filtered = prev.filter(k => k !== key);
            if (side === 'left') return [key, ...filtered];
            if (side === 'right') return [...filtered, key];
            return prev; // 'none' logic could be more complex (restore original position), but simple append/prepend for now
        });

        setHeaderMenu(null);
    };


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (headerMenu || columnPicker || rowMenu) {
                const target = e.target as HTMLElement;
                if (!target.closest('.header-menu-container') && !target.closest('.column-picker-popover') && !target.closest('.header-menu-trigger') && !target.closest('.row-actions-container') && !target.closest('.row-actions-trigger')) {
                    setHeaderMenu(null);
                    setColumnPicker(null);
                    setRowMenu(null);
                }
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [headerMenu, columnPicker, rowMenu]);

    const renderCellContent = (candidate: Candidate, colKey: string) => {
        const col = ALL_COLUMNS.find(c => c.key === colKey);
        if (!col) return '-';

        const value = (candidate as any)[colKey];

        if (colKey === 'name') {
            const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const photoUrl = candidate.photograph?.fileUrl ? (candidate.photograph.fileUrl.startsWith('http') ? candidate.photograph.fileUrl : `${BASE_URL}${candidate.photograph.fileUrl}`) : null;

            return (
                <div className="candidate-name-cell">
                    <div className="candidate-avatar-mini">
                        {photoUrl ? <img src={photoUrl} className="candidate-avatar-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <span
                            className="candidate-name-link"
                            onClick={() => handleOpenProfile(candidate._id)}
                            onMouseEnter={(e) => handleNameMouseEnter(e, candidate)}
                            onMouseLeave={handleNameMouseLeave}
                        >
                            {candidate.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--table-text-muted)' }}>
                            ID: {candidate.applicationId || candidate._id.substring(0, 8)}
                        </span>
                    </div>
                    <div className="candidate-cell-actions">
                        <button
                            className="candidate-cell-action-btn"
                            onClick={(e) => { e.stopPropagation(); setViewingCandidate(candidate); }}
                            title="Quick View"
                        >
                            <EyeIcon size={14} />
                        </button>
                        <button
                            className="candidate-cell-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const openUpward = spaceBelow < 400;
                                setRowMenu({
                                    candidate,
                                    x: rect.left,
                                    y: openUpward ? rect.top : rect.bottom,
                                    type: 'icon',
                                    openUpward
                                });
                            }}
                            title="More Actions"
                        >
                            <MoreVerticalIcon size={14} />
                        </button>
                    </div>
                </div>
            );
        } else if (colKey === 'designation') {
            return (
                <div className="candidate-table-cell-text">
                    <HighlightText text={candidate.designation || 'Candidate'} highlight={searchQuery} />
                </div>
            );
        } else if (colKey === 'leads') {
            const options = ['Hot Lead', 'Warm Lead', 'Jobseeker', 'Immediate Join'];
            const currentVal = candidate.leadTag || 'Jobseeker';
            const isHot = currentVal === 'Immediate Join' || currentVal === 'Hot Lead';
            return (
                <select
                    value={currentVal}
                    onChange={(e) => handleUpdateStatus(candidate._id, 'leads', e.target.value)}
                    className={`candidate-lead-select ${isHot ? 'candidate-lead-select--hot' : 'candidate-lead-select--warm'}`}
                    disabled={!canEdit}
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        } else if (colKey === 'assessment') {
            const options = ['Clear', 'Not Clear', 'Pending'];
            const currentVal = candidate.assessment || 'Pending';
            return (
                <select
                    value={currentVal}
                    onChange={(e) => handleUpdateStatus(candidate._id, 'assessment', e.target.value)}
                    className="candidate-status-select"
                    style={{ color: getStatusColor(currentVal) }}
                    disabled={!canEdit}
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        } else if (colKey === 'status') {
            return (
                <div className="status-badge" style={{
                    backgroundColor: getStatusColor(candidate.recruitmentStatus) + '15',
                    color: getStatusColor(candidate.recruitmentStatus),
                    borderColor: getStatusColor(candidate.recruitmentStatus) + '30'
                }}>
                    <div className="status-indicator" style={{ backgroundColor: getStatusColor(candidate.recruitmentStatus) }}></div>
                    {candidate.recruitmentStatus}
                </div>
            );
        } else if (colKey === 'email') {
            return (
                <div className="candidate-table-cell-text candidate-table-cell-text--email">
                    <span style={{ marginRight: '6px', opacity: 0.6, display: 'inline-flex', verticalAlign: 'middle' }}>
                        <MailIcon size={14} />
                    </span>
                    <HighlightText text={candidate.email || '-'} highlight={searchQuery} />
                </div>
            );
        } else if (colKey === 'phone') {
            return (
                <div className="candidate-table-cell-text candidate-table-cell-text--phone">
                    <span style={{ marginRight: '6px', opacity: 0.6, display: 'inline-flex', verticalAlign: 'middle' }}>
                        <PhoneIcon size={14} />
                    </span>
                    <HighlightText text={candidate.phone || '-'} highlight={searchQuery} />
                </div>
            );
        } else if (colKey === 'whatsapp') {
            const phone = candidate.phone || candidate.whatsapp;
            if (!phone) return '-';
            const cleanPhone = phone.replace(/\D/g, '');
            return (
                <div className="candidate-table-cell-text">
                    <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#25D366',
                            textDecoration: 'none',
                            fontWeight: 500,
                            padding: '2px 8px',
                            background: '#25D36615',
                            borderRadius: '6px'
                        }}
                    >
                        <WhatsappIcon size={14} />
                        <span>Chat</span>
                    </a>
                </div>
            );
        } else if (colKey === 'aiScore') {
            const score = candidate.aiScore || 0;
            const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#ef4444';
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${color}`, fontSize: '0.7rem', fontWeight: 'bold', color
                    }}>
                        {score}%
                    </div>
                </div>
            );
        } else if (colKey === 'isApproved') {
            return (
                <div className={`pill ${candidate.isApproved ? 'status-green' : 'status-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {candidate.isApproved ? 'Approved' : 'Pending'}
                </div>
            );
        } else if (colKey === 'willingToRelocate') {
            return (
                <div className={`badge ${candidate.willingToRelocate ? 'badge-success' : 'badge-light'}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                    {candidate.willingToRelocate ? 'Yes' : 'No'}
                </div>
            );
        } else {
            let valStr = '-';
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                valStr = value.name || '-';
            } else if (['createdAt', 'updatedAt', 'dob', 'doj', 'createdBy', 'updatedBy'].includes(colKey)) {
                valStr = (colKey === 'createdBy' || colKey === 'updatedBy') ? (typeof value === 'object' ? value?.name : value) : formatDate(value);
            } else if (colKey === 'currentCTC') {
                valStr = value ? `₹${value} L` : '-';
            } else if (['totalWorkExp', 'totalSalesExp', 'bfsiExp'].includes(colKey)) {
                valStr = (value !== undefined && value !== null) ? `${value} Yrs` : '-';
            } else {
                valStr = value?.toString() || '-';
            }
            const isDark = ['currentCompany', 'designation', 'location', 'applicationId', 'pan'].includes(colKey);
            return (
                <div className={`candidate-table-cell-text ${isDark ? 'candidate-table-cell-text--dark' : ''}`}>
                    <HighlightText text={valStr} highlight={searchQuery} />
                </div>
            );
        }
    };

    const activeVisibleColumns = useMemo(() => {
        const order = columnOrder.filter(key =>
            visibleColumns.includes(key) &&
            ALL_COLUMNS.some(c => c.key === key)
        );
        return order;
    }, [columnOrder, visibleColumns]);

    // Helper: build a blank ticket for a company
    const blankTicket = (companyName: string): Ticket => ({
        ticketNo: '',
        companyName,
        uploaddate: '',
        expdate: '',
        crtdate: '',
        type: 'Banca',
        portalStatus: 'Pending'
    });

    useEffect(() => {
        if (assigningOperation) {
            const existingTickets = (assigningOperation.tickets || []) as Ticket[];
            const existingCompanies = [...new Set(existingTickets.map(t => t.companyName))];
            const checklist = (assigningOperation as any).fulfillmentChecklist || {};
            setOperationFormData({
                date: new Date().toISOString().split('T')[0],
                filedDate: (assigningOperation as any).filedDate || new Date().toISOString().split('T')[0],
                companies: existingCompanies,
                tickets: existingTickets,
                verify: checklist.verifyField || '',
                noPoachInCV: checklist.noPoachInCV || '',
                removeNoPoach: checklist.removeNoPoach || '',
                readyToMove: checklist.readyToMove || '',
                vehicle: checklist.vehicle || '',
                graduation: checklist.graduation || '',
                degreeCertificate: checklist.degreeCertificate || '',
                rehiring: checklist.rehiring || '',
                remark: (assigningOperation as any).operationRemark || ''
            });
        }
    }, [assigningOperation]);

    // Sync tickets when company selection changes
    const handleCompanyToggle = (company: string) => {
        const isSelected = operationFormData.companies.includes(company);
        let newCompanies: string[];
        let newTickets: Ticket[];
        if (isSelected) {
            newCompanies = operationFormData.companies.filter(c => c !== company);
            newTickets = operationFormData.tickets.filter(t => t.companyName !== company);
        } else {
            newCompanies = [...operationFormData.companies, company];
            const existing = operationFormData.tickets.find(t => t.companyName === company);
            newTickets = existing
                ? operationFormData.tickets
                : [...operationFormData.tickets, blankTicket(company)];
        }
        setOperationFormData({ ...operationFormData, companies: newCompanies, tickets: newTickets });
    };

    const calcExpiryDate = (uploadDate: string, companyName: string): string => {
        if (!uploadDate || !companyName) return '';
        const job = jobs.find((j: any) => j.company === companyName);
        const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
        if (!expiryDays) return '';
        const d = new Date(uploadDate);
        d.setDate(d.getDate() + expiryDays);
        return d.toISOString().split('T')[0];
    };



    const handleSaveOperation = async () => {
        if (!assigningOperation) return;
        setSubmittingOperation(true);
        try {
            const data = {
                tickets: operationFormData.tickets.map(t => ({
                    ...t,
                    expdate: t.expdate || calcExpiryDate(t.uploaddate, t.companyName)
                })),
                operationDate: operationFormData.date,
                filedDate: operationFormData.filedDate,
                verify: operationFormData.verify,
                noPoachInCV: operationFormData.noPoachInCV,
                removeNoPoach: operationFormData.removeNoPoach,
                readyToMove: operationFormData.readyToMove,
                vehicle: operationFormData.vehicle,
                graduation: operationFormData.graduation,
                degreeCertificate: operationFormData.degreeCertificate,
                rehiring: operationFormData.rehiring,
                operationRemark: operationFormData.remark
            };

            await api.updateCandidate(assigningOperation._id, data);
            showToast('Operation status updated successfully', 'success');
            setAssigningOperation(null);
            fetchCandidates();
            // Also refresh unapproved if in validation tab
            if (activeTab === 'Validation') {
                fetchUnapprovedCandidates();
            }
        } catch (error: any) {
            console.error('Error saving operation details:', error);
            showToast(error.message || 'Failed to update operation details', 'error');
        } finally {
            setSubmittingOperation(false);
        }
    };

    const handleAssignToOperationManager = async (candidateId: string, opManagerId: string) => {
        try {
            await api.updateCandidate(candidateId, { assignedOperationManager: opManagerId });
            showToast('Candidate assigned to Operation Manager successfully', 'success');
            fetchCandidates();
            if (activeTab === 'Validation') {
                fetchUnapprovedCandidates();
            }
        } catch (error: any) {
            console.error('Error assigning operation manager:', error);
            showToast(error.message || 'Failed to assign Operation Manager', 'error');
        }
    };
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeMenu) setActiveMenu(null);
            if (isFilterPopoverOpen && filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                setIsFilterPopoverOpen(false);
            }
            // Close hover card on outside click (since it is now click-triggered)
            if (hoveredCandidate) {
                const target = event.target as HTMLElement;
                if (!target.closest('.candidate-hover-card') && !target.closest('.candidate-info')) {
                    setHoveredCandidate(null);
                    setHoverPosition(null);
                }
            }
            if (headerMenu) setHeaderMenu(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenu, isFilterPopoverOpen, hoveredCandidate, headerMenu]);


    const handleScheduleInterview = async () => {
        if (!schedulingCandidate) return;
        if (!scheduleFormData.date || !scheduleFormData.time || !scheduleFormData.companyName) {
            showToast('Please fill in all details', 'error');
            return;
        }

        try {
            await api.scheduleInterview({
                candidateId: schedulingCandidate._id,
                ...scheduleFormData
            });
            showToast('Interview scheduled successfully', 'success');
            setSchedulingCandidate(null);
            setScheduleFormData({
                date: '',
                time: '',
                mode: 'Video',
                status: 'Pending',
                stage: 'First Round',
                companyName: '',
                offers: 'No',
                shortlisted: 'No'
            });
            // Redirect to schedule tab
            setActiveTab('Schedule');
        } catch (error: any) {
            console.error('Error scheduling interview:', error);
            showToast(error.message || 'Failed to schedule interview', 'error');
        }
    };
    const handleSwitchRecruiter = async () => {
        if (!newRecruiterId) {
            showToast('Please select a recruiter', 'error');
            return;
        }

        if (switchingCreatedBy) {
            setSwitchingLoading(true);
            try {
                await api.updateCandidate(switchingCreatedBy._id, { createdBy: newRecruiterId });
                showToast('Recruiter reassigned', 'success');
                setSwitchingCreatedBy(null);
                setNewRecruiterId('');
                fetchCandidates();
            } catch (err: any) {
                showToast(err.message || 'Update failed', 'error');
            } finally {
                setSwitchingLoading(false);
            }
        } else if (confirmBulkSwitchRecruiter) {
            setBulkSwitchingLoading(true);
            try {
                await api.bulkUpdateRecruiter(selectedIds, newRecruiterId);
                showToast(`Recruiter reassigned for ${selectedIds.length} candidates`, 'success');
                setConfirmBulkSwitchRecruiter(false);
                setNewRecruiterId('');
                setSelectedIds([]);
                fetchCandidates();
            } catch (err: any) {
                showToast(err.message || 'Bulk reassign failed', 'error');
            } finally {
                setBulkSwitchingLoading(false);
            }
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.approveCandidate(id);
            showToast('Candidate approved successfully', 'success');
            fetchUnapprovedCandidates();
            fetchCandidates();
        } catch (error: any) {
            showToast(error.message || 'Approval failed', 'error');
        }
    };
    useEffect(() => {
        fetchCandidates();
        fetchUsers();
        fetchJobs();
    }, []);
    useEffect(() => {
        if (activeTab === 'Validation') {
            fetchUnapprovedCandidates();
        }
        if (activeTab === 'Lead') {
            fetchCandidates();
        }
    }, [activeTab]);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filters]);
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const candidateId = searchParams.get('id');
        if (candidateId) {
            handleOpenProfile(candidateId);
            navigate('/candidates', { replace: true });
        }
    }, [location.search, navigate]);
    const handleDeleteConfirm = async () => {
        if (!deletingCandidate) return;
        try {
            await api.deleteCandidate(deletingCandidate._id);
            showToast('Candidate deleted successfully', 'success');
            fetchCandidates();
        } catch (error) {
            showToast('Delete failed', 'error');
        } finally {
            setDeletingCandidate(null);
        }
    };
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    const toggleSelectAll = () => {
        if (selectedIds.length === candidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(candidates.map(c => c._id));
        }
    };

    const handleUpdateStatus = async (candidateId: string, field: string, value: string) => {
        try {
            const updateData: any = {};
            if (field === 'leads') updateData.leadTag = value;
            else if (field === 'assessment') updateData.assessment = value;
            else if (field === 'status') updateData.recruitmentStatus = value;

            await api.updateCandidate(candidateId, updateData);
            showToast('Update successful', 'success');
            fetchCandidates();
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        }
    };
    const getFieldLabel = (key: string) => {
        return ALL_COLUMNS.find(c => c.key === key)?.label || key;
    };
    const getFieldType = (key: string) => {
        if (['createdAt', 'updatedAt', 'dob'].includes(key)) return 'date';
        if (['status', 'gender', 'channel', 'sector', 'assessment', 'designation', 'currentCompany', 'currentProfile', 'noticePeriod', 'location', 'qualification'].includes(key)) return 'select';
        return 'text';
    };
    const TEXT_OPERATORS = ['contains', 'is', 'is not', 'contains exact word', 'contains at least one', 'does not contain', 'begins with', 'ends with', 'has any value', 'is empty'];
    const DATE_OPERATORS = ['is after', 'is before', 'is exact', 'is empty', 'is not empty'];
    const SELECT_OPERATORS = ['is', 'is not', 'has any value', 'is empty'];
    const openClassicModal = () => {
        const initialLocal: Record<string, { operator: string, value: string }> = {};
        filters.forEach(f => {
            initialLocal[f.field] = { operator: f.operator, value: f.value };
        });
        setLocalFilters(initialLocal);
        setFilterViewMode('classic');
        setIsFilterModalOpen(true);
    };
    const applyClassicFilters = () => {
        const newFiltersArray = [];
        for (const [field, data] of Object.entries(localFilters)) {
            if (data.value || ['has any value', 'is empty'].includes(data.operator)) {
                newFiltersArray.push({
                    id: Math.random().toString(36).substr(2, 9),
                    field,
                    operator: data.operator,
                    value: data.value
                });
            }
        }
        setFilters(newFiltersArray);
        setIsFilterModalOpen(false);
        setCurrentPage(1);
    };
    const addFilter = () => {
        if (!selectedField) return;
        const newFilter = {
            id: Math.random().toString(36).substr(2, 9),
            field: selectedField,
            operator: selectedOperator,
            value: ['has any value', 'is empty'].includes(selectedOperator) ? '' : tempFilterValue
        };
        setFilters([...filters, newFilter]);
        setIsFilterPopoverOpen(false);
        setSelectedField(null);
        setSelectedOperator('is');
        setTempFilterValue('');
        setFilterStep('fields');
    };
    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };
    const handleSendEmail = async (subject: string, content: string) => {
        setSendingEmail(true);
        try {
            const targetIds = emailTarget === 'all' ? 'all' : selectedIds;
            const response = await api.sendBulkEmail(targetIds, subject, content);
            showToast(response.message, 'success');
            setIsEmailModalOpen(false);
            if (emailTarget === 'selected') setSelectedIds([]);
        } catch (error: any) {
            showToast(error.message || 'Failed to send emails', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            await api.bulkDeleteCandidates(selectedIds);
            showToast(`${selectedIds.length} candidate(s) deleted successfully`, 'success');
            setSelectedIds([]);
            fetchCandidates();
        } catch (error: any) {
            showToast(error.message || 'Bulk delete failed', 'error');
        } finally {
            setConfirmBulkDelete(false);
        }
    };

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-tabs-container">
                <div className="candidate-list-tabs">
                    <button
                        onClick={() => setActiveTab('Candidate')}
                        className={`candidate-tab-btn ${activeTab === 'Candidate' ? 'active' : ''}`}
                    >
                        Candidate
                    </button>
                    <button
                        onClick={() => setActiveTab('Schedule')}
                        className={`candidate-tab-btn ${activeTab === 'Schedule' ? 'active' : ''}`}
                    >
                        Schedule
                    </button>
                    {user && ["Admin", "Manager", "Team Lead"].includes(user.role) && (
                        <button
                            onClick={() => setActiveTab('Validation')}
                            className={`candidate-tab-btn ${activeTab === 'Validation' ? 'active' : ''}`}
                        >
                            Data Validate
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('Lead')}
                        className={`candidate-tab-btn ${activeTab === 'Lead' ? 'active' : ''}`}
                    >
                        Lead
                    </button>
                </div>

                {(activeTab === 'Candidate' || activeTab === 'Lead') && (
                    <div className="header-actions">
                        <span className="total-badge" style={{ marginRight: '0.5rem' }}>
                            {filteredCandidates.length} Total
                        </span>
                        <div className="search-input-wrapper">

                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search candidates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="search-icon-pos">
                                <SearchIcon size={16} />
                            </div>
                        </div>
                        <div className="segmented-control">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`control-btn ${viewMode === 'list' ? 'active' : ''}`}
                                title="List View"
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`control-btn ${viewMode === 'card' ? 'active' : ''}`}
                                title="Card View"
                            >
                                <GridIcon size={18} />
                            </button>
                        </div>
                        {selectedIds.length > 0 && canDelete && (
                            <Tooltip text={`Delete Selected (${selectedIds.length})`}>
                                <button
                                    className="action-btn danger"
                                    onClick={() => setConfirmBulkDelete(true)}
                                >
                                    <TrashIcon size={18} />
                                </button>
                            </Tooltip>
                        )}
                        {selectedIds.length > 0 && canDelete && (
                            <Tooltip text={`Switch Recruiter (${selectedIds.length})`}>
                                <button
                                    className="action-btn success"
                                    onClick={() => setConfirmBulkSwitchRecruiter(true)}
                                >
                                    <UsersIcon size={18} />
                                </button>
                            </Tooltip>
                        )}
                        {selectedIds.length > 0 && (
                            <Tooltip text={`Email Selected (${selectedIds.length})`}>
                                <button
                                    className="action-btn purple"
                                    onClick={() => {
                                        setEmailTarget('selected');
                                        setIsEmailModalOpen(true);
                                    }}
                                >
                                    <MailIcon size={18} />
                                </button>
                            </Tooltip>
                        )}
                        <Tooltip text="Email All">
                            <button
                                className="action-btn purple"
                                onClick={() => {
                                    setEmailTarget('all');
                                    setIsEmailModalOpen(true);
                                }}
                            >
                                <MailIcon size={18} />
                            </button>
                        </Tooltip>
                        {canCreate && (
                            <Tooltip text="Add New Candidate">
                                <button
                                    className="action-btn primary"
                                    onClick={handleAddNew}
                                >
                                    <PlusIcon size={18} />
                                </button>
                            </Tooltip>
                        )}
                        <div className="advanced-filters-wrapper">
                            <div className="relative-pos" ref={filterPopoverRef}>
                                <button
                                    onClick={() => {
                                        if (filterViewMode === 'compact') {
                                            setIsFilterPopoverOpen(!isFilterPopoverOpen);
                                            setFilterStep('fields');
                                            setSelectedField(null);
                                        } else {
                                            openClassicModal();
                                        }
                                    }}
                                    className="filter-add-btn"
                                >
                                    <PlusIcon size={16} />
                                    <span>Add Filter</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {activeTab === 'Candidate' || activeTab === 'Lead' ? (
                <>
                    {/* Header Filters (if any filters active) */}
                    {filters.length > 0 && (
                        <div className="active-filters-bar">
                            {filters.map(filter => (
                                <div key={filter.id} className="advanced-filter-pill">
                                    <span>{getFieldLabel(filter.field)} {filter.operator}: {filter.value}</span>
                                    <button onClick={() => removeFilter(filter.id)} className="filter-remove-btn">
                                        <TrashIcon size={14} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => setFilters([])} className="clear-all-filters-btn">Clear All</button>
                        </div>
                    )}

                    {isFilterPopoverOpen && (
                        <div className="filter-popover">
                            <div className="filter-popover-header">
                                <span className="filter-popover-title">Advanced Filters</span>
                                <button onClick={() => setFilters([])} className="filter-clear-all">Clear All</button>
                            </div>
                            <div className="filter-scroll custom-scrollbar filter-popover-content">
                                {filterStep === 'fields' ? (
                                    <>
                                        <div className="filter-popover-section">
                                            <input
                                                type="text"
                                                className="input-field filter-search-input"
                                                placeholder="Search fields..."
                                                value={filterSearchQuery}
                                                onChange={(e) => setFilterSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="filter-groups">
                                            {FIELD_GROUPS.map(group => {
                                                const filteredKeys = group.keys.filter(key =>
                                                    getFieldLabel(key).toLowerCase().includes(filterSearchQuery.toLowerCase())
                                                );
                                                if (filteredKeys.length === 0) return null;
                                                return (
                                                    <div key={group.name}>
                                                        <div onClick={() => toggleGroup(group.name)} className="filter-group-header">
                                                            {group.name}
                                                            <ChevronDownIcon size={12} className={expandedGroups.includes(group.name) ? 'filter-expanded-icon' : ''} />
                                                        </div>
                                                        {expandedGroups.includes(group.name) && filteredKeys.map(key => (
                                                            <div key={key} onClick={() => { setSelectedField(key); setFilterStep('condition'); }} className="filter-field-item hover-bg">
                                                                {getFieldLabel(key)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="filter-popover-section--full">
                                        <div className="filter-back-btn" onClick={() => setFilterStep('fields')}>
                                            <ChevronDownIcon size={14} className="filter-back-icon" />
                                            Back to fields
                                        </div>
                                        <div className="filter-field-title">{getFieldLabel(selectedField!)}</div>
                                        <select
                                            className="input-field filter-input-mb"
                                            value={selectedOperator}
                                            onChange={(e) => setSelectedOperator(e.target.value)}
                                        >
                                            {(getFieldType(selectedField!) === 'date' ? DATE_OPERATORS : (getFieldType(selectedField!) === 'select' ? SELECT_OPERATORS : TEXT_OPERATORS)).map(op => (
                                                <option key={op} value={op}>{op}</option>
                                            ))}
                                        </select>
                                        {!['has any value', 'is empty'].includes(selectedOperator) && (
                                            <input
                                                type={getFieldType(selectedField!) === 'date' ? 'date' : 'text'}
                                                className="input-field filter-input-mb"
                                                placeholder="Value"
                                                value={tempFilterValue}
                                                onChange={(e) => setTempFilterValue(e.target.value)}
                                            />
                                        )}
                                        <button className="btn btn-primary full-width" onClick={addFilter}>Update</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="candidate-list-content">
                        {loading ? (
                            <div className="loading-container">Loading candidates...</div>
                        ) : (
                            viewMode === 'list' ? (
                                <div className="modern-table-container" style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    minHeight: 0,
                                    ...activeVisibleColumns.reduce((acc, k) => ({
                                        ...acc,
                                        [`--col-w-${k}`]: `${columnWidths[k] || (k === 'name' ? 250 : 150)}px`
                                    }), {})
                                } as React.CSSProperties}>
                                    <table className="modern-table" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th className="modern-td-checkbox sticky-first">
                                                    <input type="checkbox" checked={selectedIds.length === candidates.length && candidates.length > 0} onChange={toggleSelectAll} />
                                                </th>
                                                {activeVisibleColumns.map((colKey, index) => {
                                                    const col = ALL_COLUMNS.find(c => c.key === colKey);
                                                    if (!col) return null;

                                                    const isPinnedLeft = pinnedColumns.left.includes(col.key);
                                                    const isPinnedRight = pinnedColumns.right.includes(col.key);
                                                    const isSticky = isPinnedLeft;

                                                    const leftItems = activeVisibleColumns.slice(0, index);
                                                    const leftPosStr = leftItems.length > 0
                                                        ? `calc(32px + ${leftItems.map(k => `var(--col-w-${k})`).join(' + ')})`
                                                        : '32px';

                                                    const rightItemsAfter = activeVisibleColumns.slice(index + 1).filter(k => pinnedColumns.right.includes(k));
                                                    const rightPosStr = rightItemsAfter.length > 0
                                                        ? `calc(${rightItemsAfter.map(k => `var(--col-w-${k})`).join(' + ')})`
                                                        : '0px';

                                                    return (
                                                        <th
                                                            key={col.key}
                                                            className={isSticky || isPinnedRight ? 'sticky-col' : ''}
                                                            style={{
                                                                left: isSticky ? leftPosStr : 'auto',
                                                                right: isPinnedRight ? rightPosStr : 'auto',
                                                                width: `var(--col-w-${col.key})`,
                                                                minWidth: `var(--col-w-${col.key})`,
                                                                zIndex: isSticky || isPinnedRight ? 15 : 10
                                                            }}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, col.key)}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, col.key)}
                                                        >
                                                            <div className="modern-th-content">
                                                                <div className="modern-th-label" onClick={() => handleSort(col.key, sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                                                                    <GripVerticalIcon size={12} className="grip-icon" />
                                                                    {col.label.toUpperCase()}
                                                                    {sortConfig?.key === col.key && (
                                                                        <span className="sort-indicator">
                                                                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="th-actions-right">
                                                                    {(isPinnedLeft || isPinnedRight) && (
                                                                        <div className="header-pinned-badge">
                                                                            <PinIcon
                                                                                size={11}
                                                                                className="pin-icon-header"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        className="header-menu-trigger"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setHeaderMenu({ key: col.key, x: rect.left, y: rect.bottom });
                                                                        }}
                                                                    >
                                                                        <ChevronDownIcon size={16} />
                                                                    </button>
                                                                </div>
                                                                <div
                                                                    className={`column-resizer ${resizingCol === col.key ? 'active' : ''}`}
                                                                    onMouseDown={(e) => {
                                                                        e.stopPropagation();
                                                                        setResizingCol(col.key);
                                                                        startResizing(e, col.key);
                                                                    }}
                                                                />
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                                <th className="sticky-last">
                                                    <div className="gear-btn-wrapper">
                                                        <button
                                                            className="gear-btn"
                                                            onClick={() => setIsColumnPanelOpen(true)}
                                                            title="Table Settings"
                                                        >
                                                            <SettingsIcon size={18} />
                                                        </button>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedCandidates.map(candidate => (
                                                <tr
                                                    key={candidate._id}
                                                    className="modern-table-row"
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        const openUpward = (window.innerHeight - e.clientY) < 400;
                                                        setRowMenu({
                                                            candidate,
                                                            x: e.clientX,
                                                            y: e.clientY,
                                                            type: 'context',
                                                            openUpward
                                                        });
                                                    }}
                                                >
                                                    <td className="modern-td-checkbox">
                                                        <input type="checkbox" checked={selectedIds.includes(candidate._id)} onChange={() => toggleSelect(candidate._id)} />
                                                    </td>
                                                    {activeVisibleColumns.map((colKey, colIndex) => {
                                                        const isPinnedLeft = pinnedColumns.left.includes(colKey);
                                                        const isPinnedRight = pinnedColumns.right.includes(colKey);
                                                        const isSticky = isPinnedLeft;

                                                        const leftItems = activeVisibleColumns.slice(0, colIndex);
                                                        const leftPosStr = leftItems.length > 0
                                                            ? `calc(32px + ${leftItems.map(k => `var(--col-w-${k})`).join(' + ')})`
                                                            : '32px';

                                                        const rightItemsAfter = activeVisibleColumns.slice(colIndex + 1).filter(k => pinnedColumns.right.includes(k));
                                                        const rightPosStr = rightItemsAfter.length > 0
                                                            ? `calc(${rightItemsAfter.map(k => `var(--col-w-${k})`).join(' + ')})`
                                                            : '0px';

                                                        const cellContent = renderCellContent(candidate, colKey);
                                                        return (
                                                            <td
                                                                key={`${candidate._id}-${colKey}`}
                                                                className={`modern-td-cell ${isSticky || isPinnedRight ? 'sticky-col' : ''}`}
                                                                style={{
                                                                    left: isSticky ? leftPosStr : 'auto',
                                                                    right: isPinnedRight ? rightPosStr : 'auto',
                                                                    width: `var(--col-w-${colKey})`,
                                                                    minWidth: `var(--col-w-${colKey})`,
                                                                    maxWidth: `var(--col-w-${colKey})`,
                                                                    zIndex: isSticky || isPinnedRight ? 11 : 1
                                                                }}
                                                            >
                                                                {cellContent}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="sticky-last"></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="card-grid">
                                    {paginatedCandidates.map(candidate => (
                                        <div
                                            key={candidate._id}
                                            className="candidate-card-modern"
                                            onClick={() => setViewingCandidate(candidate)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                const openUpward = (window.innerHeight - e.clientY) < 400;
                                                setRowMenu({
                                                    candidate,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    type: 'context',
                                                    openUpward
                                                });
                                            }}
                                        >
                                            <div className="candidate-card-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="candidate-avatar-initial">
                                                        {candidate.photograph?.fileUrl ? (
                                                            <img
                                                                src={candidate.photograph.fileUrl.startsWith('http') ? candidate.photograph.fileUrl : `${BASE_URL}${candidate.photograph.fileUrl}`}
                                                                alt={candidate.name}
                                                                className="candidate-avatar-img"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            candidate.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>{candidate.name}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.designation}</span>
                                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></div>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getStatusColor(candidate.recruitmentStatus) }}>{candidate.recruitmentStatus}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`candidate-tag ${candidate.leadTag === 'Immediate Join' || candidate.leadTag === 'Hot Lead' ? 'lead' : 'jobseeker'}`}>
                                                    {candidate.leadTag || 'Jobseeker'}
                                                </div>
                                            </div>

                                            <div className="candidate-stats-grid">
                                                <div>
                                                    <div className="card-stat-label">Location</div>
                                                    <div className="card-stat-value">{candidate.location}</div>
                                                </div>
                                                <div>
                                                    <div className="card-stat-label">Experience</div>
                                                    <div className="card-stat-value">{candidate.totalWorkExp} Yrs</div>
                                                </div>
                                                <div>
                                                    <div className="card-stat-label">Current CTC</div>
                                                    <div className="card-stat-value">₹{candidate.currentCTC} L</div>
                                                </div>
                                                <div>
                                                    <div className="card-stat-label">Notice</div>
                                                    <div className="card-stat-value">{candidate.noticePeriod}</div>
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <div className="card-footer-date">
                                                    Created: {formatDate(candidate.createdAt)}
                                                </div>
                                                <div className="card-actions">
                                                    {canAssignToOperation && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setAssigningOperation(candidate); }}
                                                            className="card-action-btn assign"
                                                            title="Assign to Operation Desk"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); setViewingCandidate(candidate); }} className="card-action-btn view" title="View Details">
                                                        <EyeIcon size={18} />
                                                    </button>
                                                    {canEdit && (
                                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/candidates/edit/${candidate._id}`); }} className="card-action-btn edit" title="Edit Candidate">
                                                            <EditIcon size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                    {/* Pagination */}
                    <div className="pagination-wrapper-modern">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredCandidates.length}
                            itemsPerPage={candidatesPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={(newLimit) => {
                                setCandidatesPerPage(newLimit);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </>
            ) : activeTab === 'Schedule' ? (
                <div className="schedule-tab-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <InterviewList />
                </div>
            ) : activeTab === 'Validation' ? (
                <div className="fade-in" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {unapprovedLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading unapproved candidates...</div>
                    ) : (
                        <div className="modern-table-container" style={{ flex: 1, overflow: 'auto' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <div className="modern-th-content">
                                                <div className="modern-th-label">
                                                    <GripVerticalIcon size={12} className="grip-icon" />
                                                    NAME
                                                </div>
                                            </div>
                                        </th>
                                        <th>
                                            <div className="modern-th-content">
                                                <div className="modern-th-label">
                                                    <GripVerticalIcon size={12} className="grip-icon" />
                                                    LOCATION
                                                </div>
                                            </div>
                                        </th>
                                        <th>
                                            <div className="modern-th-content">
                                                <div className="modern-th-label">
                                                    <GripVerticalIcon size={12} className="grip-icon" />
                                                    STATUS
                                                </div>
                                            </div>
                                        </th>
                                        <th>
                                            <div className="modern-th-content">
                                                <div className="modern-th-label">
                                                    ACTIONS
                                                </div>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unapprovedCandidates.map(candidate => (
                                        <tr key={candidate._id}>
                                            <td>{candidate.name}</td>
                                            <td>{candidate.location}</td>
                                            <td>Pending Approval</td>
                                            <td className="actions-cell">
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Tooltip text="View Details">
                                                        <button
                                                            className="action-link"
                                                            onClick={() => setViewingCandidate(candidate)}
                                                        >
                                                            <EyeIcon size={18} />
                                                        </button>
                                                    </Tooltip>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleApprove(candidate._id)}>Approve</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}
            {/* Modals */}
            {isFilterModalOpen && (
                <Modal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    title="CLASSIC CANDIDATE FILTERS"
                    maxWidth="750px"
                >
                    <div className="custom-scrollbar" style={{ padding: '0', overflowY: 'auto', maxHeight: '70vh' }}>
                        {ALL_COLUMNS.filter(c => !['resume', 'fileManager'].includes(c.key)).map((col) => {
                            const fType = getFieldType(col.key);
                            const currentOp = localFilters[col.key]?.operator || (fType === 'date' ? 'is after' : (fType === 'select' ? 'is' : 'contains'));
                            return (
                                <div key={col.key} className="filter-grid-modern">
                                    <div className="filter-label-modern">{col.label}</div>
                                    <div className="filter-input-wrapper">
                                        {fType === 'select' ? (
                                            <>
                                                <select
                                                    className="filter-select-modern"
                                                    value={localFilters[col.key]?.value || ''}
                                                    onChange={(e) => {
                                                        setLocalFilters({
                                                            ...localFilters, [col.key]: {
                                                                operator: currentOp,
                                                                value: e.target.value
                                                            }
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select {col.label}</option>
                                                    {((masterData as any)[col.key] || []).map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </>
                                        ) : (
                                            <input
                                                type={fType === 'date' ? 'date' : 'text'}
                                                className="filter-input-modern"
                                                placeholder={fType === 'date' ? "month dd, yy" : "Enter here"}
                                                value={localFilters[col.key]?.value || ''}
                                                onChange={(e) => {
                                                    setLocalFilters({
                                                        ...localFilters, [col.key]: {
                                                            operator: currentOp,
                                                            value: e.target.value
                                                        }
                                                    });
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="classic-filter-footer">
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="classic-filter-btn"
                        >
                            Close
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button
                                onClick={() => setLocalFilters({})}
                                className="classic-filter-btn link"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={applyClassicFilters}
                                className="classic-filter-btn primary"
                            >
                                Apply <CheckCircleIcon size={18} style={{ marginLeft: '8px' }} />
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {deletingCandidate && (
                <DeleteConfirmationModal
                    isOpen={!!deletingCandidate}
                    onClose={() => setDeletingCandidate(null)}
                    onConfirm={handleDeleteConfirm}
                    itemName={deletingCandidate.name}
                />
            )}
            {isEmailModalOpen && (
                <EmailModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    onSend={handleSendEmail}
                    candidateCount={emailTarget === 'all' ? candidates.length : selectedIds.length}
                    loading={sendingEmail}
                />
            )}
            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url}
                    fileName={previewDoc.name}
                />
            )}

            {/* Schedule Interview Modal */}
            <Modal
                isOpen={!!schedulingCandidate}
                onClose={() => setSchedulingCandidate(null)}
                title="SCHEDULE INTERVIEW"
                maxWidth="600px"
            >
                {schedulingCandidate && (
                    <div style={{ padding: '1rem' }}>
                        <div className="schedule-header-card">
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.25rem' }}>Candidate</div>
                            <div className="schedule-candidate-name">{schedulingCandidate.name}</div>
                            <div className="schedule-candidate-desc">{schedulingCandidate.designation}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">INTERVIEW DATE</label>
                                <input type="date" className="input-field" value={scheduleFormData.date} onChange={e => setScheduleFormData({ ...scheduleFormData, date: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">INTERVIEW TIME</label>
                                <input type="time" className="input-field" value={scheduleFormData.time} onChange={e => setScheduleFormData({ ...scheduleFormData, time: e.target.value })} />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label className="input-label">COMPANY NAME</label>
                            <select className="input-field" value={scheduleFormData.companyName} onChange={e => setScheduleFormData({ ...scheduleFormData, companyName: e.target.value })}>
                                <option value="">Select Company</option>
                                {[...new Set(jobs.filter(job => job.status === 'Open').map(job => job.company))].sort().map(company => (
                                    <option key={company} value={company}>{company}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>INTERVIEW MODE</label>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                {['Face to Face', 'Phone', 'Video'].map(m => (
                                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                        <input type="radio" name="mode" value={m} checked={scheduleFormData.mode === m} onChange={e => setScheduleFormData({ ...scheduleFormData, mode: e.target.value })} />
                                        {m}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">INTERVIEW STAGE</label>
                                <select className="input-field" value={scheduleFormData.stage} onChange={e => setScheduleFormData({ ...scheduleFormData, stage: e.target.value })}>
                                    <option>1st Round</option>
                                    <option>2nd Round</option>
                                    <option>HR Round</option>
                                    <option>Final Round</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">INITIAL STATUS</label>
                                <select className="input-field" value={scheduleFormData.status} onChange={e => setScheduleFormData({ ...scheduleFormData, status: e.target.value })}>
                                    <option>Pending</option>
                                    <option>Scheduled</option>
                                </select>
                            </div>
                        </div>

                        {['OFFERS EXTENDED?', 'SHORTLISTED?'].map(label => (
                            <div key={label} style={{ marginBottom: '1rem' }}>
                                <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>{label}</label>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    {['Yes', 'No'].map(val => (
                                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                            <input
                                                type="radio"
                                                name={label}
                                                value={val}
                                                checked={(label.includes('OFFERS') ? scheduleFormData.offers : scheduleFormData.shortlisted) === val}
                                                onChange={e => {
                                                    const key = label.includes('OFFERS') ? 'offers' : 'shortlisted';
                                                    setScheduleFormData({ ...scheduleFormData, [key]: e.target.value });
                                                }}
                                            />
                                            {val}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                            <button className="btn btn-sm" style={{ borderColor: '#d1d5db', padding: '0.25rem 1rem' }} onClick={() => setSchedulingCandidate(null)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 1.5rem' }} onClick={handleScheduleInterview}>Schedule Now</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Assign to Operation Desk Modal */}
            <Modal
                isOpen={!!assigningOperation}
                onClose={() => setAssigningOperation(null)}
                title="Operation Assignment"
                subtitle={assigningOperation?.name.toUpperCase()}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setAssigningOperation(null)}
                            className="btn btn-secondary"
                        >Cancel</button>
                        <button
                            onClick={handleSaveOperation}
                            disabled={submittingOperation}
                            className="btn btn-primary"
                        >{submittingOperation ? 'Saving...' : 'Save Changes'}</button>
                    </>
                }
            >
                {assigningOperation && (
                    <div className="operation-modal-content">
                        {/* Summary Row */}
                        <div className="modal-summary-grid mb-24">
                            <div className="summary-card">
                                <span className="summary-label">Candidate</span>
                                <span className="summary-value">{assigningOperation.name}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Education</span>
                                <span className="summary-value">{assigningOperation.qualification}</span>
                            </div>
                            <div className="summary-card">
                                <span className="summary-label">Experience</span>
                                <span className="summary-value">{assigningOperation.totalWorkExp} Years</span>
                            </div>
                        </div>

                        {/* Company + Date Filed Row */}
                        <div className="modal-form-grid mb-20">
                            <div className="input-group">
                                <label className="input-label">Company (Multi-Select)</label>
                                <div className="custom-multiselect">
                                    <div
                                        className="multiselect-trigger"
                                        onClick={(e) => { e.stopPropagation(); setIsCompanyDropdownOpen(!isCompanyDropdownOpen); }}
                                    >
                                        <span className={operationFormData.companies.length === 0 ? 'placeholder' : 'value'}>
                                            {operationFormData.companies.length === 0 ? 'Select companies...' : operationFormData.companies.join(', ')}
                                        </span>
                                        <ChevronDownIcon size={16} />
                                    </div>
                                    {isCompanyDropdownOpen && (
                                        <div className="multiselect-dropdown">
                                            {[...new Set(jobs.map((j: any) => j.company))].sort().filter(Boolean).map((company: any) => (
                                                <div
                                                    key={company}
                                                    className={`multiselect-item ${operationFormData.companies.includes(company) ? 'selected' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); handleCompanyToggle(company); }}
                                                >
                                                    {company}
                                                    {operationFormData.companies.includes(company) && <CheckCircleIcon size={16} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Date Filed</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={operationFormData.filedDate}
                                    onChange={e => setOperationFormData({ ...operationFormData, filedDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Tickets Management Section (Added to match user request) */}
                        <div className="report-section-box mb-24" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
                                Tickets Management
                            </div>
                            <div className="table-wrapper-modern" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <table className="table table-compact">
                                    <thead>
                                        <tr>
                                            <th>Company</th>
                                            <th>Ticket No</th>
                                            <th>Upload Date</th>
                                            <th>Exp. Date</th>
                                            <th>CRT Date</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(assigningOperation.tickets || []).map((t: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="font-bold">{t.companyName}</td>
                                                <td>{t.ticketNo || <span className="text-muted">Empty</span>}</td>
                                                <td>{formatDate(t.uploaddate)}</td>
                                                <td className="text-danger">{formatDate(t.expdate)}</td>
                                                <td>{formatDate(t.crtdate)}</td>
                                                <td><span className="badge-outline">{t.type}</span></td>
                                                <td>
                                                    <span className={`status-badge ${t.portalStatus === 'Pending' ? 'pending' : 'success'}`} style={{ fontSize: '10px' }}>
                                                        {t.portalStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!assigningOperation.tickets || assigningOperation.tickets.length === 0) && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-20 text-muted">No tickets found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Fulfillment Checklist */}
                        <div className="checklist-container mb-24">
                            <div className="checklist-title">Fulfillment Checklist</div>
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
                                        <div className="checklist-options">
                                            {['Yes', 'No'].map(v => (
                                                <label key={v} className="radio-label">
                                                    <input
                                                        type="radio"
                                                        name={`op_${field.key}`}
                                                        value={v}
                                                        checked={(operationFormData as any)[field.key] === v}
                                                        onChange={() => setOperationFormData({ ...operationFormData, [field.key]: v })}
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
                        <div className="input-group">
                            <label className="input-label">Operation Remark</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '80px' }}
                                placeholder="Add any operational notes here..."
                                value={operationFormData.remark}
                                onChange={e => setOperationFormData({ ...operationFormData, remark: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!viewingTickets}
                onClose={() => setViewingTickets(null)}
                title="Candidate Tickets"
                subtitle={viewingTickets?.name.toUpperCase()}
                size="xl"
                footer={
                    <button className="btn btn-primary" style={{ padding: '0 2rem' }} onClick={() => setViewingTickets(null)}>Done</button>
                }
            >
                {viewingTickets && (
                    <div className="tickets-modal-content">
                        <div className="table-wrapper-modern">
                            <table className="table table-compact">
                                <thead>
                                    <tr>
                                        <th>Ticket No</th>
                                        <th>Company</th>
                                        <th>Upload Date</th>
                                        <th>Exp. Date</th>
                                        <th>CRT Date</th>
                                        <th>Type</th>
                                        <th>Last Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(viewingTickets.tickets || []).map((t, idx) => (
                                        <tr key={idx}>
                                            <td className="font-bold">{t.ticketNo}</td>
                                            <td className="text-primary font-bold">{t.companyName}</td>
                                            <td>{formatDate(t.uploaddate)}</td>
                                            <td className="text-danger">{formatDate(t.expdate)}</td>
                                            <td>{formatDate(t.crtdate)}</td>
                                            <td><span className="badge-outline">{t.type}</span></td>
                                            <td className="text-muted text-xs">
                                                {formatDate(viewingTickets.updatedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!viewingTickets.tickets || viewingTickets.tickets.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-40 text-muted">No tickets found for this candidate.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>


            {/* Switch Recruiter Modal */}
            <Modal
                isOpen={!!switchingCreatedBy || confirmBulkSwitchRecruiter}
                onClose={() => {
                    setSwitchingCreatedBy(null);
                    setConfirmBulkSwitchRecruiter(false);
                    setNewRecruiterId('');
                }}
                title="Switch Recruiter"
                subtitle={confirmBulkSwitchRecruiter ? `Updating ${selectedIds.length} candidates` : "Transfer candidate to another recruiter"}
                size="md"
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setSwitchingCreatedBy(null);
                                setConfirmBulkSwitchRecruiter(false);
                                setNewRecruiterId('');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSwitchRecruiter}
                            disabled={switchingLoading || bulkSwitchingLoading || !newRecruiterId}
                        >
                            {switchingLoading || bulkSwitchingLoading ? 'Switching...' : 'Switch Recruiter'}
                        </button>
                    </>
                }
            >
                <div className="recruiter-switch-modal">
                    <div className="switch-flow-container">
                        {/* Current Person */}
                        <div className="switch-person">
                            <div className="person-label">Current</div>
                            <div className="person-avatar" style={{ background: '#64748b' }}>
                                {switchingCreatedBy ? (typeof switchingCreatedBy.createdBy === 'object' ? switchingCreatedBy.createdBy.name.charAt(0).toUpperCase() : 'U') : 'M'}
                            </div>
                            <div className="person-name">
                                {switchingCreatedBy ? (typeof switchingCreatedBy.createdBy === 'object' ? switchingCreatedBy.createdBy.name : 'Unknown User') : `${selectedIds.length} Candidates`}
                            </div>
                        </div>

                        <div className="switch-arrow-box">
                            <ArrowRightIcon size={24} />
                        </div>

                        {/* New Person */}
                        <div className="switch-person">
                            <div className="person-label">Switch To</div>
                            <div className="person-avatar" style={{ background: newRecruiterId ? 'var(--primary)' : '#f1f5f9' }}>
                                {newRecruiterId ? users.find(u => u._id === newRecruiterId)?.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="person-name">
                                {newRecruiterId ? users.find(u => u._id === newRecruiterId)?.name : 'Select user'}
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Select New Recruiter</label>
                        <select
                            className="input-field"
                            value={newRecruiterId}
                            onChange={e => setNewRecruiterId(e.target.value)}
                        >
                            <option value="">Select Recruiter/Manager</option>
                            {users
                                .filter(u => u.status === 'Active' && u.role !== 'Normal User' && u.role !== 'Super Admin')
                                .map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                ))
                            }
                        </select>
                    </div>

                    {(switchingLoading || bulkSwitchingLoading) && (
                        <div className="text-center mt-12 text-primary font-bold">
                            Processing transfer...
                        </div>
                    )}
                </div>
            </Modal>

            {/* Detailed Candidate View Modal */}
            <CandidateDetailModal
                isOpen={!!viewingCandidate}
                onClose={() => setViewingCandidate(null)}
                candidate={viewingCandidate}
                baseUrl={BASE_URL}
            />

            <DeleteConfirmationModal
                isOpen={confirmBulkDelete}
                onClose={() => setConfirmBulkDelete(false)}
                onConfirm={handleBulkDeleteConfirm}
                itemName={`${selectedIds.length} selected candidate(s)`}
                itemType="bulk candidates"
            />

            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url.startsWith('http') ? previewDoc.url : `${BASE_URL}${previewDoc.url}`}
                    fileName={previewDoc.name}
                />
            )}

            {/* Hover Card Portal */}
            {hoveredCandidate && hoverPosition && (() => {
                const photoUrl = hoveredCandidate.photograph?.fileUrl
                    ? (hoveredCandidate.photograph.fileUrl.startsWith('http') ? hoveredCandidate.photograph.fileUrl : `${BASE_URL}${hoveredCandidate.photograph.fileUrl}`)
                    : null;
                const initials = hoveredCandidate.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                return createPortal(
                    <div
                        className={`candidate-hover-card portal ${hoverPlacement}`}
                        style={{
                            top: hoverPosition.top,
                            left: hoverPosition.left,
                            opacity: 1,
                            visibility: 'visible',
                            transform: 'none'
                        }}
                        onMouseEnter={handleCardMouseEnter}
                        onMouseLeave={handleCardMouseLeave}
                    >
                        <div className="hover-card-main-row">
                            <div className="hover-card-avatar-large">
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt=""
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="hover-card-details">
                                <div className="hover-card-name-row">
                                    <div className="hover-card-name" title={hoveredCandidate.name}>
                                        {hoveredCandidate.name}
                                    </div>
                                    <button
                                        className="hover-card-add-btn"
                                        title="Edit Candidate"
                                        onClick={() => {
                                            setSelectedCandidateId(hoveredCandidate._id);
                                            setIsFormDrawerOpen(true);
                                            setHoveredCandidate(null);
                                            setHoverPosition(null);
                                        }}
                                    >
                                        <PlusIcon size={16} />
                                    </button>
                                </div>
                                <div className="hover-card-email" title={hoveredCandidate.email || ''}>
                                    {hoveredCandidate.email || 'No email provided'}
                                </div>
                            </div>
                        </div>

                        <div className="hover-card-actions-row">
                            {hoveredCandidate.email ? (
                                <button
                                    className="hover-card-mail-btn"
                                    onClick={() => {
                                        setSelectedIds([hoveredCandidate._id]);
                                        setEmailTarget('selected');
                                        setIsEmailModalOpen(true);
                                        setHoveredCandidate(null);
                                        setHoverPosition(null);
                                    }}
                                >
                                    <MailIcon size={14} />
                                    <span>Send Mail</span>
                                </button>
                            ) : (
                                <div style={{ width: '1px' }}></div>
                            )}
                            <div className="hover-card-icon-buttons">
                                <button
                                    className="hover-card-circle-btn"
                                    title="Chat on WhatsApp"
                                    onClick={() => {
                                        const phone = hoveredCandidate.whatsapp || hoveredCandidate.phone;
                                        if (phone) {
                                            window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                                        } else {
                                            showToast('No phone number available for WhatsApp', 'error');
                                        }
                                        setHoveredCandidate(null);
                                        setHoverPosition(null);
                                    }}
                                >
                                    <MessageIcon size={16} />
                                </button>
                                <button
                                    className="hover-card-circle-btn"
                                    title="Schedule Video Interview"
                                    onClick={() => {
                                        setSelectedProfileId(hoveredCandidate._id);
                                        setSelectedActivityModal('Interview');
                                        setIsProfileDrawerOpen(true);
                                        setHoveredCandidate(null);
                                        setHoverPosition(null);
                                    }}
                                >
                                    <VideoIcon size={16} />
                                </button>
                                <button
                                    className="hover-card-circle-btn"
                                    title="Schedule Meeting/Interview"
                                    onClick={() => {
                                        setSelectedProfileId(hoveredCandidate._id);
                                        setSelectedActivityModal('Interview');
                                        setIsProfileDrawerOpen(true);
                                        setHoveredCandidate(null);
                                        setHoverPosition(null);
                                    }}
                                >
                                    <CalendarIcon size={16} />
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            })()}
            {/* Column Customization Drawer */}
            <Drawer
                isOpen={isColumnPanelOpen}
                onClose={() => setIsColumnPanelOpen(false)}
                title="Customize Table Columns"
                width="400px"
            >
                <div className="column-customization-drawer">
                    <p className="panel-hint">Configure visibility and order of columns in the ATS table.</p>

                    <div className="drawer-actions mb-16">
                        <div className="search-box-modern" style={{ width: '100%' }}>
                            <SearchIcon className="search-icon" size={16} />
                            <input
                                type="text"
                                placeholder="Search columns..."
                                className="search-input"
                                value={columnSearchQuery}
                                onChange={(e) => setColumnSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="column-groups-container custom-scrollbar">
                        <div className="column-list">
                            {columnOrder.map(colKey => {
                                const col = ALL_COLUMNS.find(c => c.key === colKey);
                                if (!col) return null;

                                // Search filter
                                if (columnSearchQuery && !col.label.toLowerCase().includes(columnSearchQuery.toLowerCase())) {
                                    return null;
                                }

                                const isVisible = visibleColumns.includes(colKey);
                                const isNameCol = colKey === 'name';
                                const isPinned = pinnedColumns.left.includes(colKey) || pinnedColumns.right.includes(colKey);

                                return (
                                    <div
                                        key={colKey}
                                        className="column-item"
                                        draggable={!isNameCol}
                                        onDragStart={(e) => handleDragStart(e, colKey)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, colKey)}
                                        style={{ cursor: isNameCol ? 'default' : 'move' }}
                                    >
                                        <div className={`column-item-wrapper ${isVisible ? 'active' : ''} ${isPinned ? 'pinned' : ''}`}>
                                            <div className="column-item-main">
                                                {!isNameCol && <GripVerticalIcon className="grip-icon" size={14} />}
                                                <label className="column-item-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={isVisible}
                                                        disabled={isNameCol}
                                                        onChange={() => {
                                                            if (isVisible) {
                                                                setVisibleColumns(prev => prev.filter(k => k !== colKey));
                                                            } else {
                                                                setVisibleColumns(prev => [...new Set([...prev, colKey])]);
                                                            }
                                                        }}
                                                    />
                                                    <span>{col.label}</span>
                                                </label>
                                            </div>
                                            <button
                                                onClick={() => handlePinColumn(colKey, isPinned ? 'none' : 'left')}
                                                className={`column-pin-btn ${isPinned ? 'pinned' : ''}`}
                                                title={isPinned ? "Unpin Column" : "Pin to Left"}
                                            >
                                                <PinIcon size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="drawer-footer-actions mt-24">
                        <button className="btn btn--outline btn--full" onClick={() => {
                            setVisibleColumns(ALL_COLUMNS.map(c => c.key));
                            setColumnOrder(ALL_COLUMNS.map(c => c.key));
                            setColumnWidths({ name: 250 });
                            setPinnedColumns({ left: [], right: [] });
                        }}>
                            Reset to Default
                        </button>
                    </div>
                </div>
            </Drawer>

            {/* Advanced Header Context Menu */}
            {headerMenu && (() => {
                const isMenuOnRight = headerMenu.x > window.innerWidth - 450; // Main menu (220) + Submenu (200) + buffer
                return (
                    <div
                        className="header-menu-container animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: headerMenu.y + 5,
                            left: isMenuOnRight ? 'auto' : headerMenu.x,
                            right: isMenuOnRight ? window.innerWidth - (headerMenu.x + 20) : 'auto',
                            zIndex: 1000,
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            border: '1px solid var(--border)',
                            minWidth: '220px',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div
                            className="menu-item"
                            onClick={() => setHeaderMenu(prev => ({ ...prev!, submenu: prev?.submenu === 'pin' ? undefined : 'pin' }))}
                            onMouseEnter={() => setHeaderMenu(prev => ({ ...prev!, submenu: 'pin' }))}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s', background: headerMenu.submenu === 'pin' ? '#f1f5f9' : 'transparent', position: 'relative' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <PinIcon size={16} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Pin Column</span>
                            </div>
                            <ChevronRightIcon size={14} style={{ color: '#94a3b8', transform: isMenuOnRight ? 'rotate(180deg)' : 'none' }} />
                        </div>
                        {headerMenu.submenu === 'pin' && (
                            <div style={{
                                position: 'absolute',
                                left: isMenuOnRight ? 'auto' : '100%',
                                right: isMenuOnRight ? '100%' : 'auto',
                                top: '4px',
                                background: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0',
                                padding: '4px',
                                minWidth: '150px',
                                marginRight: isMenuOnRight ? '2px' : '0',
                                marginLeft: isMenuOnRight ? '0' : '2px'
                            }}>
                                <div className="menu-item sub" onClick={() => handlePinColumn(headerMenu.key, 'left')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', borderRadius: '4px' }}>
                                    <span>Pin Left</span>
                                    {pinnedColumns.left.includes(headerMenu.key) && <CheckIcon size={14} color="#3b82f6" />}
                                </div>
                                <div className="menu-item sub" onClick={() => handlePinColumn(headerMenu.key, 'right')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', borderRadius: '4px' }}>
                                    <span>Pin Right</span>
                                    {pinnedColumns.right.includes(headerMenu.key) && <CheckIcon size={14} color="#3b82f6" />}
                                </div>
                                <div className="menu-item sub" onClick={() => handlePinColumn(headerMenu.key, 'none')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', borderRadius: '4px' }}>
                                    <span>Unpin</span>
                                </div>
                            </div>
                        )}
                        {sortConfig?.key === headerMenu.key && (
                            <div
                                className="menu-item"
                                onClick={() => { handleSort(headerMenu.key, null); setHeaderMenu(null); }}
                                onMouseEnter={() => setHeaderMenu(prev => ({ ...prev!, submenu: undefined }))}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px' }}
                            >
                                <SparklesIcon size={16} />
                                <span style={{ fontSize: '0.875rem' }}>Clear Sort</span>
                            </div>
                        )}
                        <div
                            className="menu-item"
                            onClick={() => { handleSort(headerMenu.key, 'asc'); setHeaderMenu(null); }}
                            onMouseEnter={() => setHeaderMenu(prev => ({ ...prev!, submenu: undefined }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px' }}
                        >
                            <div style={{ fontSize: '16px', width: '16px', textAlign: 'center' }}>↑<span style={{ fontSize: '8px' }}>AZ</span></div>
                            <span style={{ fontSize: '0.875rem' }}>Sort Ascending</span>
                        </div>
                        <div
                            className="menu-item"
                            onClick={() => { handleSort(headerMenu.key, 'desc'); setHeaderMenu(null); }}
                            onMouseEnter={() => setHeaderMenu(prev => ({ ...prev!, submenu: undefined }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px' }}
                        >
                            <div style={{ fontSize: '16px', width: '16px', textAlign: 'center' }}>↑<span style={{ fontSize: '8px' }}>ZA</span></div>
                            <span style={{ fontSize: '0.875rem' }}>Sort Descending</span>
                        </div>
                        <div className="menu-divider" style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                        <div
                            className="menu-item"
                            onClick={() => { setVisibleColumns(prev => prev.filter(k => k !== headerMenu.key)); setHeaderMenu(null); }}
                            onMouseEnter={() => setHeaderMenu(prev => ({ ...prev!, submenu: undefined }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', color: '#94a3b8' }}
                        >
                            <div style={{ width: '16px', height: '16px', border: '1.5px solid currentColor', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px' }}>-</span></div>
                            <span style={{ fontSize: '0.875rem' }}>Hide Column</span>
                        </div>
                    </div>
                );
            })()}

            {/* Column Picker Popover */}
            {columnPicker && (
                <div
                    className="column-picker-popover animate-fade-in"
                    style={{
                        position: 'fixed',
                        top: columnPicker.y,
                        left: columnPicker.x,
                        zIndex: 2000,
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid var(--border)',
                        width: '300px',
                        maxHeight: '450px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                        <SearchIcon size={14} style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by column name"
                            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                            value={columnSearchQuery}
                            onChange={(e) => setColumnSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={() => {
                                const allKeys = ALL_COLUMNS.filter(c => !visibleColumns.includes(c.key)).map(c => c.key);
                                // The loop below handles adding all keys to the correct indices
                                // Add all missing columns at the picker index
                                const newOrder = [...columnOrder];
                                const currentVisible = [...visibleColumns];
                                allKeys.forEach((k, i) => {
                                    if (!currentVisible.includes(k)) {
                                        currentVisible.push(k);
                                        const idx = newOrder.indexOf(k);
                                        if (idx !== -1) newOrder.splice(idx, 1);
                                        newOrder.splice(columnPicker.index + i, 0, k);
                                    }
                                });
                                setColumnOrder(newOrder);
                                setVisibleColumns(currentVisible);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', padding: 0 }}
                        >
                            Select All
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
                        {ALL_COLUMNS.filter(c => !visibleColumns.includes(c.key) && c.label.toLowerCase().includes(columnSearchQuery.toLowerCase())).map(col => (
                            <div
                                key={col.key}
                                className="menu-item"
                                onClick={() => {
                                    const k = col.key;
                                    const newOrder = [...columnOrder];
                                    const currentVisible = [...visibleColumns];
                                    if (!currentVisible.includes(k)) {
                                        currentVisible.push(k);
                                        const idx = newOrder.indexOf(k);
                                        if (idx !== -1) newOrder.splice(idx, 1);
                                        newOrder.splice(columnPicker.index, 0, k);
                                    }
                                    setColumnOrder(newOrder);
                                    setVisibleColumns(currentVisible);
                                    setColumnSearchQuery('');
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                                <div style={{ width: '16px', height: '16px', border: '1.5px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Placeholder for checkbox visual */}
                                </div>
                                <span style={{ fontWeight: 400 }}>{col.label}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                            onClick={() => setColumnPicker(null)}
                            style={{ padding: '6px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setColumnPicker(null)}
                            style={{ padding: '6px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Row Actions Context Menu */}
            {rowMenu && createPortal(
                <div
                    className="row-actions-container animate-fade-in"
                    style={{
                        position: 'fixed',
                        left: Math.max(10, Math.min(window.innerWidth - 230, rowMenu.type === 'context' ? rowMenu.x : rowMenu.x - 120)),
                        ...(rowMenu.openUpward ? {
                            bottom: (window.innerHeight - rowMenu.y) + (rowMenu.type === 'context' ? 0 : 5) + 'px',
                            top: 'auto'
                        } : {
                            top: rowMenu.y + (rowMenu.type === 'context' ? 0 : 5) + 'px',
                            bottom: 'auto'
                        }),
                        zIndex: 3000,
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        minWidth: '220px',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible'
                    }}
                >
                    {canEdit && (
                        <div className="menu-item" onClick={() => { handleEditCandidate(rowMenu.candidate._id); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                            <EditIcon size={16} color="#64748b" />
                            <span>Edit Candidate</span>
                        </div>
                    )}
                    <div className="menu-item" onClick={() => { setSelectedProfileId(rowMenu.candidate._id); setSelectedActivityModal('Note'); setIsProfileDrawerOpen(true); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <FileTextIcon size={16} color="#64748b" />
                        <span>Add Note</span>
                    </div>
                    <div className="menu-item" onClick={() => { setSelectedProfileId(rowMenu.candidate._id); setSelectedActivityModal('Call'); setIsProfileDrawerOpen(true); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <PhoneIcon size={16} color="#64748b" />
                        <span>Add Call Log</span>
                    </div>
                    <div className="menu-item" onClick={() => { setSelectedProfileId(rowMenu.candidate._id); setSelectedActivityModal('Interview'); setIsProfileDrawerOpen(true); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <CalendarIcon size={16} color="#64748b" />
                        <span>Schedule Interview</span>
                    </div>
                    <div className="menu-item" onClick={() => {
                        const phone = rowMenu.candidate.whatsapp || rowMenu.candidate.phone;
                        if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                        setRowMenu(null);
                    }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <WhatsappIcon size={16} color="#25D366" />
                        <span>Send WhatsApp</span>
                    </div>
                    <div className="menu-item" onClick={() => {
                        setSelectedIds([rowMenu.candidate._id]);
                        setIsEmailModalOpen(true);
                        setRowMenu(null);
                    }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <MailIcon size={16} color="#64748b" />
                        <span>Send Email</span>
                    </div>
                    <div className="menu-item" onClick={() => { setSwitchingCreatedBy(rowMenu.candidate); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem' }}>
                        <RefreshIcon size={16} color="#64748b" />
                        <span>Switch Candidate</span>
                    </div>
                    {canAssignToOperation && (
                        <div
                            className="menu-item"
                            onMouseEnter={() => setHoveredMenuItem('assign_to_operation')}
                            onMouseLeave={() => setHoveredMenuItem(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setHoveredMenuItem(prev => prev === 'assign_to_operation' ? null : 'assign_to_operation');
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                position: 'relative',
                                background: hoveredMenuItem === 'assign_to_operation' ? '#f8fafc' : 'transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <SettingsIcon size={16} color="#64748b" />
                                <span>Assign to Operation</span>
                            </div>
                            <span style={{ fontSize: '8px', color: '#64748b' }}>▶</span>

                            {/* Hover Submenu */}
                            {hoveredMenuItem === 'assign_to_operation' && (
                                <div
                                    className="row-actions-container"
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        top: 0,
                                        background: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        border: '1px solid #e2e8f0',
                                        minWidth: '200px',
                                        padding: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        zIndex: 3100
                                    }}
                                >
                                    {users
                                        .filter(u => u.status === 'Active' && u.role === 'Operation Manager')
                                        .map(u => (
                                            <div
                                                key={u._id}
                                                className="menu-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAssignToOperationManager(rowMenu.candidate._id, u._id);
                                                    setRowMenu(null);
                                                }}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: 'transparent'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#e0e7ff',
                                                    color: '#4f46e5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{u.name}</span>
                                            </div>
                                        ))
                                    }
                                    {users.filter(u => u.status === 'Active' && u.role === 'Operation Manager').length === 0 && (
                                        <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                                            No active Operation Managers
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {canDelete && (
                        <>
                            <div className="menu-divider" style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                            <div className="menu-item" onClick={() => { setDeletingCandidate(rowMenu.candidate); setRowMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem', color: '#ef4444' }}>
                                <TrashIcon size={16} />
                                <span>Delete Candidate</span>
                            </div>
                        </>
                    )}
                </div>,
                document.body
            )}

            <Drawer
                isOpen={isFormDrawerOpen}
                onClose={handleCloseForm}
                title={selectedCandidateId ? 'Edit Candidate' : 'Add New Candidate'}
                width="950px"
            >
                <CandidateForm
                    candidateId={selectedCandidateId || undefined}
                    onClose={handleCloseForm}
                />
            </Drawer>

            <Drawer
                isOpen={isProfileDrawerOpen}
                onClose={handleCloseProfile}
                title="Candidate Profile"
                width="100%"
                hideHeader={true}
            >
                {selectedProfileId && (
                    <CandidateProfileView
                        candidateId={selectedProfileId}
                        onClose={handleCloseProfile}
                        candidateIds={sortedCandidates.map(c => c._id)}
                        onNavigate={(id) => setSelectedProfileId(id)}
                        initialActivityModal={selectedActivityModal}
                    />
                )}
            </Drawer>

            <style>{`
                .candidate-name-cell .row-actions-trigger { opacity: 1; }
                .row-actions-trigger:hover { background: #f1f5f9; color: #3b82f6; }
                .modern-table-row:hover { background-color: #f8fafc !important; }
                th:hover .header-grip { opacity: 1 !important; }
                .sticky-col { position: sticky !important; z-index: 10; background: white !important; }
                .sticky-col::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 4px; background: linear-gradient(to right, rgba(0,0,0,0.1), transparent); pointer-events: none; }
                .column-resizing { cursor: col-resize !important; user-select: none !important; }
                .column-resizing * { cursor: col-resize !important; }
                .header-menu-container .menu-item:hover { background: #f8fafc; color: var(--primary); }
                .header-menu-container .menu-item.sub:hover { background: #f1f5f9; }
                .column-picker-popover .menu-item:hover { background: #eff6ff; color: var(--primary); }
                .column-resizer:hover { background: rgba(59, 130, 246, 0.4) !important; width: 8px !important; }
                .column-resizer.active { background: #3b82f6 !important; width: 8px !important; }
                .dragging { opacity: 0.5; background: #eff6ff; border: 2px dashed var(--primary); }
                .modern-table-container::-webkit-scrollbar { height: 8px; }
                .modern-table-container::-webkit-scrollbar-track { background: #f1f5f9; }
                .modern-table-container::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
                .modern-table-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .column-customization-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 350px; background: white; z-index: 2000; box-shadow: -10px 0 25px rgba(0,0,0,0.1); transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flexDirection: column; }
                .column-customization-panel.open { transform: translateX(0); }
                .panel-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 1999; backdrop-filter: blur(2px); animation: fade-in-backdrop 0.3s ease-out; }
                @keyframes fade-in-backdrop { from { opacity: 0; } to { opacity: 1; } }
                .filter-row-modern:hover { background-color: var(--bg-sidebar) !important; }
                .hover-bg:hover { background-color: var(--bg-sidebar) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
            `}</style>
        </div>
    );
};

export default CandidateList;