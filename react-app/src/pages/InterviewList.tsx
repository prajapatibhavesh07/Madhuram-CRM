import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
    GridIcon, ListIcon, EyeIcon, EditIcon, TrashIcon, 
    MailIcon, SearchIcon, GripVerticalIcon, ChevronDownIcon,
    CalendarIcon
} from '../icons';
import { getGoogleCalendarCandidateUrl, getGoogleCalendarEmployeeUrl } from '../utils/calendarSync';
import { useAuth } from '../context/AuthContext';
import EmailModal from '../components/EmailModal';
import ScheduleProgress from '../components/ScheduleProgress';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import Modal from '../components/Modal';
import Tooltip from '../components/Tooltip';
import Pagination from '../components/Pagination';
import CandidateDetailModal from '../components/CandidateDetailModal';

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

interface Interview {
    _id: string;
    candidateId: {
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
        noticePeriod?: string;
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
        panCard?: { fileUrl: string, fileName: string };
        aadhaarCard?: { fileUrl: string, fileName: string };
        educationProof?: { fileUrl: string, fileName: string };
        offerLetter?: { fileUrl: string, fileName: string };
        relativeLetter?: { fileUrl: string, fileName: string };
        offerStatus?: string;
        isResigned?: string;
        resignationLetter?: { fileUrl: string, fileName: string };
        doj?: string;
        isApproved?: boolean;
        approvedBy?: string | { _id: string, name: string };
        approvedAt?: string;
        createdBy?: string | { _id: string, name: string };
    };
    jobId: { _id: string, title: string };
    interviewerId: { name: string };
    date: string;
    mode: string;
    status: string;
    stage: string;
    offers: string;
    shortlisted: string;
    feedback?: string;
    meetingLink?: string;
}

const InterviewList = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { showToast } = useToast();
    const { user, activeRole } = useAuth();
    const navigate = useNavigate();
    
    const [viewingProgress, setViewingProgress] = useState<Interview | null>(null);
    const [viewingCandidate, setViewingCandidate] = useState<{ candidate: any, history: Interview[] } | null>(null);
    const [fetchingCandidate, setFetchingCandidate] = useState(false);
    const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
    const [editFormData, setEditFormData] = useState<any>({
        date: '',
        time: '',
        mode: 'Video',
        stage: 'First Round',
        status: 'Scheduled',
        offers: 'No',
        meetingLink: '',
        feedback: ''
    });
    const [saveLoading, setSaveLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailData, setEmailData] = useState<{ candidateId: string, subject: string, content: string, candidateCount: number | 'all' }>({
        candidateId: '',
        subject: '',
        content: '',
        candidateCount: 1
    });

    const canDelete = user?.role === 'Admin' || user?.role === 'Super Admin' || activeRole?.permissions?.interviews?.delete === true;

    const filteredInterviews = interviews.filter(int => {
        const query = searchQuery.toLowerCase();
        return (
            int.candidateId?.name?.toLowerCase().includes(query) ||
            int.jobId?.title?.toLowerCase().includes(query) ||
            int.stage?.toLowerCase().includes(query) ||
            int.mode?.toLowerCase().includes(query) ||
            int.status?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);

    const paginatedInterviews = filteredInterviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleExpand = (id: string) => {
        setExpandedRowId(expandedRowId === id ? null : id);
    };

    const handleEditClick = (interview: Interview) => {
        const interviewDate = new Date(interview.date);
        setEditingInterview(interview);
        setEditFormData({
            date: interviewDate.toISOString().split('T')[0],
            time: interviewDate.toTimeString().slice(0, 5),
            mode: interview.mode || 'Video',
            stage: interview.stage || 'First Round',
            status: interview.status || 'Scheduled',
            offers: interview.offers || 'No',
            meetingLink: interview.meetingLink || '',
            feedback: interview.feedback || ''
        });
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this interview?')) return;
        try {
            await api.deleteInterview(id);
            showToast('Interview cancelled successfully', 'info');
            fetchInterviews();
        } catch (error) {
            console.error(error);
            showToast('Failed to cancel interview', 'error');
        }
    };

    const handleEditSubmit = async () => {
        if (!editingInterview) return;
        setSaveLoading(true);
        try {
            const updatedDateTime = new Date(`${editFormData.date}T${editFormData.time}`);
            await api.updateInterview(editingInterview._id, {
                ...editFormData,
                date: updatedDateTime.toISOString()
            });
            showToast('Interview updated successfully', 'success');
            setEditingInterview(null);
            fetchInterviews();
        } catch (error) {
            console.error(error);
            showToast('Failed to update interview', 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    const openScheduleEmail = (group: any) => {
        setEmailData({
            candidateId: group.candidate._id,
            subject: `Interview Scheduled - ${group.job?.title || 'Position'}`,
            content: `Dear ${group.candidate.name},\n\nYour interview has been scheduled.`,
            candidateCount: 1
        });
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async (subject: string, content: string) => {
        setEmailLoading(true);
        try {
            await api.sendBulkEmail([emailData.candidateId], subject, content);
            showToast('Email sent successfully', 'success');
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to send email', 'error');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleStatusUpdate = (stepId: string, label: string, data?: any) => {
        executeStatusUpdate(stepId, label, data);
    };

    const fetchInterviews = async () => {

        setLoading(true);
        try {
            const data = await api.getInterviews();
            setInterviews(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch interviews', 'error');
        } finally {
            setLoading(false);
        }
    };
 
    const handleViewCandidate = async (candidate: any, history: Interview[]) => {
        setFetchingCandidate(true);
        try {
            // First show what we have
            setViewingCandidate({ candidate, history });
            // Then fetch full details
            const fullCandidate = await api.getCandidateById(candidate._id);
            setViewingCandidate({ candidate: fullCandidate, history });
        } catch (error) {
            console.error('Failed to fetch full candidate details', error);
            // We already have partial data shown, so just stay with it or show error
        } finally {
            setFetchingCandidate(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);



    const executeStatusUpdate = async (stepId: string, label: string, data?: any) => {
        if (!viewingProgress) return;
        let updates: Partial<Interview> = {};

        switch (stepId) {
            case 'applied':
                updates = { status: 'Applied', stage: label };
                break;
            case 'scheduled':
                updates = { status: 'Scheduled', stage: label };
                break;
            case 'interview_done':
                updates = { status: 'Completed', stage: label };
                break;
            case 'short_list':
            case 'shortlist':
                updates = { status: 'Shortlisted', shortlisted: 'Yes', stage: label };
                break;
            case 'first_round':
            case 'second_round':
            case 'final_round':
            case 'document':
                updates = { stage: label };
                break;
            case 'hire':
                updates = { status: 'Selected', offers: 'Yes' };
                break;
            case 'reject':
                updates = { status: 'Rejected' };
                break;
            case 'update_offer':
            case 'update_resign':
            case 'update_doj':
            case 'upload_resignation':
                handleOnboardingUpdate(viewingProgress.candidateId._id, stepId, data);
                return;
            default:
                return;
        }

        try {
            await api.updateInterview(viewingProgress._id, updates);
            showToast(`Status updated to ${label}`, 'success');

            const updatedInterview = { ...viewingProgress, ...updates };
            setViewingProgress(updatedInterview as Interview);
            setInterviews(prev => prev.map(i => i._id === viewingProgress._id ? { ...i, ...updates } : i));
        } catch (error) {
            console.error(error);
            showToast('Failed to update status', 'error');
        }
    };

    const handleOnboardingUpdate = async (candidateId: string, type: string, data: any) => {
        try {
            let updatePayload: any = data;

            if (type === 'upload_resignation') {
                const formData = new FormData();
                formData.append('resignationLetter', data.file);
                updatePayload = formData;
            }

            const updatedCandidate = await api.updateCandidate(candidateId, updatePayload);
            showToast(`${type.replace('_', ' ')} updated`, 'success');

            // Update local state
            setViewingProgress(prev => {
                if (!prev || prev.candidateId._id !== candidateId) return prev;
                return {
                    ...prev,
                    candidateId: { ...prev.candidateId, ...updatedCandidate }
                };
            });
            setInterviews(prev => prev.map(int => {
                if (int.candidateId._id !== candidateId) return int;
                return {
                    ...int,
                    candidateId: { ...int.candidateId, ...updatedCandidate }
                };
            }));
        } catch (error) {
            console.error(error);
            showToast('Failed to update onboarding data', 'error');
        }
    };

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        Interviews
                        <span className="total-badge">
                            {filteredInterviews.length} Total
                        </span>
                    </h3>
                    <p>Schedule and track interviews for all candidates.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search interviews..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
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
                            title="Grid View"
                        >
                            <GridIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">Loading interviews...</div>
            ) : filteredInterviews.length === 0 ? (
                <div className="empty-state-message">
                    {searchQuery ? `No interviews matching "${searchQuery}"` : 'No interviews scheduled.'}
                </div>
            ) : viewMode === 'list' ? (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            Candidate
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
                                            Candidate Role
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
                                            Gender
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
                                            Contact no
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
                                            Interview Date
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
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">ACTIONS</div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(paginatedInterviews.reduce((acc: any, interview) => {
                                const candidateId = interview.candidateId?._id;
                                if (!candidateId) return acc;
                                if (!acc[candidateId]) {
                                    acc[candidateId] = {
                                        candidate: interview.candidateId,
                                        job: interview.jobId,
                                        interviews: []
                                    };
                                }
                                acc[candidateId].interviews.push(interview);
                                return acc;
                            }, {})).map((group: any) => {
                                // Sort interviews by date descending (newest first)
                                group.interviews.sort((a: Interview, b: Interview) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                return (
                                    <React.Fragment key={group.candidate._id}>
                                        <tr 
                                            className={expandedRowId === group.candidate._id ? 'expanded' : ''}
                                            onDoubleClick={() => navigate(`/candidates/edit/${group.candidate._id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <button
                                                    className={`accordion-toggle ${expandedRowId === group.candidate._id ? 'expanded' : ''}`}
                                                    onClick={() => toggleExpand(group.candidate._id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </button>
                                            </td>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="employee-avatar">
                                                        {group.candidate?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="employee-name">
                                                        <HighlightText text={group.candidate?.name} highlight={searchQuery} />
                                                        <div className="employee-subtext">{group.job?.title}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="candidate-role">
                                                    <HighlightText text={group.candidate?.designation || '-'} highlight={searchQuery} />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="gender-tag">
                                                    <HighlightText text={group.candidate?.gender || '-'} highlight={searchQuery} />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    <HighlightText text={group.candidate?.phone || '-'} highlight={searchQuery} />
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                                    {group.interviews[0] ? new Date(group.interviews[0].date).toLocaleDateString([], { dateStyle: 'medium' }) : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                {group.interviews[0] && (
                                                    <div className={`status-indicator ${group.interviews[0].status === 'Scheduled' ? 'late' : group.interviews[0].status === 'Completed' || group.interviews[0].status === 'Selected' ? 'ontime' : 'absent'}`}>
                                                        <div className="status-dot"></div>
                                                        {group.interviews[0].status}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="sticky-last">
                                                <div className="flex-row-gap-center">
                                                    <button
                                                        onClick={() => handleViewCandidate(group.candidate, group.interviews)}
                                                        className="action-btn"
                                                        disabled={fetchingCandidate}
                                                        title="View Candidate Details"
                                                    >
                                                        <EyeIcon size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openScheduleEmail(group)}
                                                        className="action-btn action-btn--success"
                                                        title="Send Schedule Email"
                                                    >
                                                        <MailIcon size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRowId === group.candidate._id && (
                                            <tr className="detail-row">
                                                <td colSpan={10}>
                                                    <div className="expanded-content-wrapper">
                                                        <div className="expanded-content">
                                                            <div className="details-section">
                                                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>Interview History</h4>

                                                                <table className="modern-table" style={{ minWidth: '100%' }}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Date & Time</th>
                                                                            <th>Stage</th>
                                                                            <th>Mode</th>
                                                                            <th>Interviewer</th>
                                                                            <th>Status</th>
                                                                            <th>Feedback</th>
                                                                            <th>Link</th>
                                                                            <th>Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {group.interviews.map((int: Interview) => (
                                                                            <tr 
                                                                                key={int._id}
                                                                                onDoubleClick={() => handleEditClick(int)}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                <td>
                                                                                    {new Date(int.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                                                </td>
                                                                                <td>{int.stage}</td>
                                                                                <td>{int.mode}</td>
                                                                                <td>{int.interviewerId?.name || '-'}</td>
                                                                                <td>
                                                                                    <div className={`status-indicator ${int.status === 'Scheduled' ? 'late' : int.status === 'Completed' || int.status === 'Selected' ? 'ontime' : 'absent'}`}>
                                                                                        <div className="status-dot"></div>
                                                                                        {int.status}
                                                                                    </div>
                                                                                </td>
                                                                                <td>{int.feedback || '-'}</td>
                                                                                <td>
                                                                                    {int.meetingLink ? (
                                                                                        <a href={int.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Link</a>
                                                                                    ) : '-'}
                                                                                </td>
                                                                                <td>
                                                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                                        <Tooltip text="View Progress"><button onClick={() => setViewingProgress(int)} className="action-link"><EyeIcon size={16} /></button></Tooltip>
                                                                                        <Tooltip text="Edit"><button onClick={() => handleEditClick(int)} className="action-link"><EditIcon size={16} /></button></Tooltip>
                                                                                        <Tooltip text="GCal (Candidate)">
                                                                                            <a href={getGoogleCalendarCandidateUrl(int as any)} target="_blank" rel="noopener noreferrer" className="action-link" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}>
                                                                                                <CalendarIcon size={16} />
                                                                                            </a>
                                                                                        </Tooltip>
                                                                                        <Tooltip text="GCal (Interviewer)">
                                                                                            <a href={getGoogleCalendarEmployeeUrl(int as any)} target="_blank" rel="noopener noreferrer" className="action-link" style={{ color: '#FA801C', display: 'inline-flex', alignItems: 'center' }}>
                                                                                                <CalendarIcon size={16} />
                                                                                            </a>
                                                                                        </Tooltip>
                                                                                        {canDelete && (
                                                                                            <Tooltip text="Cancel Interview"><button onClick={() => handleCancel(int._id)} className="action-link" style={{ color: '#ef4444' }}><TrashIcon size={16} /></button></Tooltip>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            ) : (
                <>
                    <div className="interview-card-grid">
                        {paginatedInterviews.map(int => (
                            <div key={int._id} className="interview-card fade-in">
                                <div className="card-header">
                                    <div className="card-candidate-info">
                                        <div className="employee-avatar card-candidate-avatar">
                                            {int.candidateId?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="card-candidate-name">
                                                <HighlightText text={int.candidateId?.name} highlight={searchQuery} />
                                            </h4>
                                            <div className="card-job-title">
                                                <HighlightText text={int.jobId?.title} highlight={searchQuery} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`status-indicator ${int.status === 'Scheduled' ? 'late' : int.status === 'Completed' || int.status === 'Selected' ? 'ontime' : 'absent'}`}>
                                        <div className="status-dot"></div>
                                        <HighlightText text={int.status} highlight={searchQuery} />
                                    </div>
                                </div>

                                <div className="card-details-grid">
                                    <div className="card-detail-item">
                                        <label>Stage</label>
                                        <div>
                                            <span>
                                                <HighlightText text={int.stage} highlight={searchQuery} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card-detail-item">
                                        <label>Mode</label>
                                        <div>
                                            <span>
                                                <HighlightText text={int.mode} highlight={searchQuery} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card-detail-item" style={{ gridColumn: 'span 2' }}>
                                        <label>Date & Time</label>
                                        <div>
                                            <span>{new Date(int.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer-actions">
                                    <Tooltip text="View Details">
                                        <button 
                                            onClick={() => {
                                                const candidateHistory = filteredInterviews.filter(i => i.candidateId?._id === int.candidateId?._id);
                                                handleViewCandidate(int.candidateId, candidateHistory);
                                            }} 
                                            className="btn-card-action btn-card-view" 
                                            disabled={fetchingCandidate}
                                        >
                                            <EyeIcon size={18} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip text="Edit Interview">
                                        <button onClick={() => handleEditClick(int)} className="btn-card-action btn-card-edit">
                                            <EditIcon size={18} />
                                        </button>
                                    </Tooltip>
                                    {canDelete && (
                                        <Tooltip text="Cancel Interview">
                                            <button onClick={() => handleCancel(int._id)} className="btn-card-action btn-card-delete">
                                                <TrashIcon size={18} />
                                            </button>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )
            }

            {/* Edit Interview Modal */}
            <Modal
                isOpen={!!editingInterview}
                onClose={() => setEditingInterview(null)}
                title="Edit Interview"
                footer={
                    <div className="flex justify-end gap-12">
                        <button onClick={() => setEditingInterview(null)} className="btn-secondary">Cancel</button>
                        <button onClick={handleEditSubmit} className="btn-primary" disabled={saveLoading}>
                            {saveLoading ? 'Updating...' : 'Update Interview'}
                        </button>
                    </div>
                }
            >
                {editingInterview && (
                    <div className="compact-grid">
                    <div className="full-width modal-candidate-banner">
                        <div className="flex-column gap-4">
                            <div className="modal-candidate-label">Candidate</div>
                            <div className="modal-candidate-value">{editingInterview.candidateId?.name}</div>
                        </div>
                        <div className="flex-column gap-4 text-right">
                            <div className="modal-candidate-label">Job Role</div>
                            <div className="modal-job-value">{editingInterview.jobId?.title}</div>
                        </div>
                    </div>

                        <div className="input-group">
                            <label className="input-label">Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={editFormData.date}
                                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Time</label>
                            <input
                                type="time"
                                className="input-field"
                                value={editFormData.time}
                                onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Interview Mode</label>
                            <select
                                className="input-field"
                                value={editFormData.mode}
                                onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value })}
                            >
                                <option>Video</option>
                                <option>Phone</option>
                                <option>In Person</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Current Stage</label>
                            <select
                                className="input-field"
                                value={editFormData.stage}
                                onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                            >
                                <option>First Round</option>
                                <option>Second Round</option>
                                <option>Third Round</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Update Status</label>
                            <select
                                className="input-field"
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                            >
                                <option>Pending</option>
                                <option>Scheduled</option>
                                <option>Completed</option>
                                <option>Selected</option>
                                <option>Rejected</option>
                                <option>On Hold</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Offer Status</label>
                            <select
                                className="input-field"
                                value={editFormData.offers}
                                onChange={(e) => setEditFormData({ ...editFormData, offers: e.target.value })}
                            >
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>

                        <div className="input-group full-width">
                            <label className="input-label">Meeting / Location Link</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="https://zoom.us/..."
                                value={editFormData.meetingLink}
                                onChange={(e) => setEditFormData({ ...editFormData, meetingLink: e.target.value })}
                            />
                        </div>

                        <div className="input-group full-width">
                            <label className="input-label">Internal Feedback / Notes</label>
                            <textarea
                                className="input-field h-100"
                                placeholder="Add detailed notes or evaluation results..."
                                value={editFormData.feedback}
                                onChange={(e) => setEditFormData({ ...editFormData, feedback: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Progress Modal */}
            <Modal
                isOpen={!!viewingProgress}
                onClose={() => setViewingProgress(null)}
                title={`Candidate Journey: ${viewingProgress?.candidateId?.name}`}
                footer={<button className="btn-primary" onClick={() => setViewingProgress(null)}>Close</button>}
                maxWidth="800px"
            >
                {viewingProgress && (
                    <ScheduleProgress
                        interview={viewingProgress}
                        onStepClick={handleStatusUpdate}
                    />
                )}
            </Modal>

            <CandidateDetailModal 
                isOpen={!!viewingCandidate}
                onClose={() => setViewingCandidate(null)}
                candidate={viewingCandidate?.candidate}
                interviewHistory={viewingCandidate?.history}
                onViewProgress={setViewingProgress}
                onEditInterview={handleEditClick}
                onCancelInterview={handleCancel}
                canDelete={canDelete}
                baseUrl={BASE_URL}
            />

            {
                previewDoc && (
                    <DocumentPreviewModal
                        isOpen={!!previewDoc}
                        onClose={() => setPreviewDoc(null)}
                        fileUrl={previewDoc.url}
                        fileName={previewDoc.name}
                    />
                )
            }

            {/* Email Modal */}
            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSend={handleSendEmail}
                candidateCount={emailData.candidateCount}
                loading={emailLoading}
            />
        </div >
    );
};

export default InterviewList;
