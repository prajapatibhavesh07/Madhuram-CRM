import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
    ChevronDownIcon, ChevronRightIcon, EditIcon,
    MoreVerticalIcon, ClockIcon,
    XIcon, CopyIcon, FileTextIcon, PlusIcon,
    SearchIcon, FilterIcon, EyeIcon,
    PhoneIcon, MailIcon, MapPinIcon, UserIcon, BriefcaseIcon,
    CalendarIcon, SparklesIcon, InfoIcon,
    PinIcon, TrashIcon, ListIcon, CheckIcon, InboxIcon, SettingsIcon
} from '../icons';


import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { industryTypes } from '../constants/IndustryConstants';
import CandidateForm from '../pages/CandidateForm';
import DocumentPreviewModal from './DocumentPreviewModal';
import { BASE_URL } from '../services/api';

const ArrowLeftIcon = ({ size, style }: { size: number, style?: React.CSSProperties }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

const ArrowRightIcon = ({ size, style }: { size: number, style?: React.CSSProperties }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);

const UserClockIcon = ({ size = 16, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <circle cx="18" cy="18" r="4" />
        <polyline points="18 16 18 18 19.5 19.5" />
    </svg>
);



const WhatsappIcon = ({ size = 16, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const GlobeIcon = ({ size, color = "currentColor" }: { size: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);

const LinkedinIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const GithubIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);

const FacebookIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const TwitterIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
);
const BoldIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
);

const ItalicIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
);



interface CandidateProfileViewProps {
    candidateId: string;
    onClose: () => void;
    candidateIds?: string[];
    onNavigate?: (newId: string) => void;
    initialActivityModal?: 'Note' | 'Call' | 'Interview' | null;
}

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    users?: any[];
    candidateName?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, users = [], candidateName }) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [isInternalUpdate, setIsInternalUpdate] = React.useState(false);
    const [mentionState, setMentionState] = React.useState<{
        show: boolean;
        query: string;
        index: number;
        coords: { top: number; left: number };
    }>({
        show: false,
        query: '',
        index: 0,
        coords: { top: 0, left: 0 }
    });

    React.useEffect(() => {
        if (editorRef.current && !isInternalUpdate) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '';
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            setIsInternalUpdate(true);
            const content = editorRef.current.innerHTML;
            onChange(content);
            setTimeout(() => setIsInternalUpdate(false), 10);

            // Mention detection logic
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textBeforeCaret = range.startContainer.textContent?.substring(0, range.startOffset) || '';
                const lastAtIdx = textBeforeCaret.lastIndexOf('@');

                if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCaret[lastAtIdx - 1] === ' ' || textBeforeCaret[lastAtIdx - 1] === '\u00A0')) {
                    const query = textBeforeCaret.substring(lastAtIdx + 1);
                    const rect = range.getBoundingClientRect();
                    setMentionState(prev => ({
                        ...prev,
                        show: true,
                        query,
                        coords: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX }
                    }));
                } else {
                    setMentionState(prev => ({ ...prev, show: false }));
                }
            }
        }
    };

    const execCmd = (e: React.MouseEvent, command: string, val: string | undefined = undefined) => {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand(command, false, val);
        handleInput();
        if (editorRef.current) editorRef.current.focus();
    };

    const filteredUsers = React.useMemo(() => {
        const query = mentionState.query.toLowerCase();

        // Filter out "Super Admin" and "Bhavesh Prajapati" from generic users
        let available = users.filter(u => {
            const userName = u.name.toLowerCase();
            return userName !== 'super admin' && userName !== 'bhavesh prajapati';
        });

        // Prepend candidate name at the top
        if (candidateName) {
            available = [{ _id: 'cn', name: candidateName }, ...available];
        }

        return available.filter(u => u.name.toLowerCase().includes(query)).slice(0, 8);
    }, [users, mentionState.query, candidateName]);


    const handleMentionSelect = (id: string, name: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        const offset = range.startOffset;
        const textContent = textNode.textContent || '';
        const lastAtIdx = textContent.substring(0, offset).lastIndexOf('@');

        if (lastAtIdx !== -1) {
            // Remove the "@query" part
            const newRange = document.createRange();
            newRange.setStart(textNode, lastAtIdx);
            newRange.setEnd(textNode, offset);
            selection.removeAllRanges();
            selection.addRange(newRange);
            document.execCommand('delete');

            // Insert formatted mention with data-user-id for backend parsing
            const mentionHtml = `<span class="mention-tag" data-user-id="${id}" style="color: #2563eb; background: #eff6ff; padding: 1px 4px; border-radius: 4px; font-weight: 600;">@${name}</span>&nbsp;`;
            document.execCommand('insertHTML', false, mentionHtml);

            setMentionState(prev => ({ ...prev, show: false, query: '' }));
            handleInput();
            if (editorRef.current) editorRef.current.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionState.show) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionState(prev => ({ ...prev, index: (prev.index + 1) % Math.max(1, filteredUsers.length) }));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionState(prev => ({ ...prev, index: (prev.index - 1 + filteredUsers.length) % Math.max(1, filteredUsers.length) }));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                if (filteredUsers.length > 0) {
                    e.preventDefault();
                    const selected = filteredUsers[mentionState.index];
                    handleMentionSelect(selected._id, selected.name);
                    return;
                }
            }
            if (e.key === 'Escape') {
                setMentionState(prev => ({ ...prev, show: false }));
                return;
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
            handleInput();
        }
    };

    return (
        <div className="rich-editor-container">
            <div className="rich-editor-toolbar">
                <div className="rich-toolbar-btn" onMouseDown={(e) => execCmd(e, 'bold')} title="Bold"><BoldIcon size={16} /></div>
                <div className="rich-toolbar-btn" onMouseDown={(e) => execCmd(e, 'italic')} title="Italic"><ItalicIcon size={16} /></div>
                <div className="rich-toolbar-btn" onMouseDown={(e) => execCmd(e, 'insertUnorderedList')} title="Bullet List"><ListIcon size={16} /></div>
                <div className="rich-toolbar-divider" />
                <div className="rich-dropdown">
                    <div className="rich-toolbar-btn"><UserIcon size={16} /></div>
                    <div className="rich-dropdown-content">
                        <small className="mention-team-header">Mention Team</small>
                        {users.map((u: any) => (
                            <a key={u._id} onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(u._id, u.name); }}>{u.name}</a>
                        ))}
                    </div>
                </div>
                {candidateName && (
                    <div className="rich-toolbar-btn" onMouseDown={(e) => { e.preventDefault(); handleMentionSelect('cn', candidateName); }} title="Mention Candidate">
                        <span className="candidate-initials">CN</span>
                    </div>
                )}
            </div>
            <div
                ref={editorRef}
                className="rich-editor-content"
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setMentionState(prev => ({ ...prev, show: false })), 200)}
                data-placeholder={placeholder}
            />

            {mentionState.show && filteredUsers.length > 0 && (
                <div
                    className="mention-suggestions"
                    style={{
                        top: mentionState.coords.top,
                        left: mentionState.coords.left
                    }}
                >
                    {filteredUsers.map((user, i) => (
                        <div
                            key={user._id}
                            onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(user._id, user.name); }}
                            className={`mention-item ${i === mentionState.index ? 'active' : ''}`}
                        >
                            <div className="mention-avatar">
                                {user.name.charAt(0)}
                            </div>
                            {user.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomDatePicker: React.FC<{
    value: string;
    onChange: (val: string) => void;
}> = ({ value, onChange }) => {
    return (
        <div className="custom-date-picker">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="date-input-hidden"
            />
            <div className="date-picker-trigger">
                <span>{value || 'Select Date'}</span>
                <CalendarIcon size={16} color="#94a3b8" />
            </div>
        </div>
    );
};

const IntervalTimePicker: React.FC<{
    value: string;
    onChange: (val: string) => void;
}> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const times = React.useMemo(() => {
        const t = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const hour = h % 12 || 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                const min = m.toString().padStart(2, '0');
                t.push(`${hour}:${min} ${ampm}`);
            }
        }
        return t;
    }, []);

    return (
        <div className="interval-time-picker" ref={containerRef}>
            <div className="time-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{value || 'Select Time'}</span>
                <ClockIcon size={16} color="#94a3b8" />
            </div>
            {isOpen && (
                <div className="time-picker-dropdown">
                    {times.map(t => (
                        <div
                            key={t}
                            className={`time-option ${value === t ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(t);
                                setIsOpen(false);
                            }}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({ candidateId, onClose, candidateIds = [], onNavigate, initialActivityModal = null }) => {

    const { showToast } = useToast();
    const { user: authUser } = useAuth();
    const [candidate, setCandidate] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeActivityModal, setActiveActivityModal] = React.useState<'Note' | 'Call' | 'Interview' | 'EditProfile' | null>(initialActivityModal);
    const [editingActivityId, setEditingActivityId] = React.useState<string | null>(null);
    const [expandedInterviewStages, setExpandedInterviewStages] = React.useState<string[]>([]);

    // Activity Form States
    const [activityForm, setActivityForm] = React.useState({
        note: '',
        noteType: 'Note',
        callDirection: 'Outgoing call',
        callType: 'Select Call Type',
        callDuration: '',
        callDate: new Date().toISOString().split('T')[0],
        callTime: '11:00 PM',
        interviewDate: new Date().toISOString().split('T')[0],
        interviewTime: '2:00 PM',
        companyNames: [] as string[],
        perCompanyDetails: {} as Record<string, any>,
        interviewMode: 'Video',
        interviewStage: 'First Round',
        interviewStatus: 'Pending',
        offers: 'No',
        shortlisted: 'No'
    });

    const [expandedAccordions, setExpandedAccordions] = React.useState<string[]>([]);

    const [editingField, setEditingField] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState<any>('');
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [isEditCandidateModalOpen, setIsEditCandidateModalOpen] = useState(false);
    const [editingExperienceIndex, setEditingExperienceIndex] = React.useState<number | null>(null);
    const [editingEducationIndex, setEditingEducationIndex] = React.useState<number | null>(null);
    const [followUpTaskChecked, setFollowUpTaskChecked] = React.useState(false);
    const [showFollowUpPopup, setShowFollowUpPopup] = React.useState(false);
    const INTERVIEW_STAGES = ['Applied', 'Scheduled', 'Interview Done', 'Short-List', 'First Round', 'Second Round', 'Final Round', 'Selected', 'Document Pre-offer'];
    const [activeSubTab, setActiveSubTab] = React.useState<'All' | 'Notes&Calls' | 'Interviews'>('All');
    const [activeBottomTab, setActiveBottomTab] = React.useState('Details');
    const [expandedSections, setExpandedSections] = React.useState<string[]>(['Overview', 'Work', 'Education', 'System']);
    const [activities, setActivities] = React.useState<any[]>([]);
    const [activityLoading, setActivityLoading] = React.useState(false);
    const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([]);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [searchActivity, setSearchActivity] = React.useState('');
    const [resumeLoading, setResumeLoading] = React.useState(false);
    const [customPdfLoading, setCustomPdfLoading] = React.useState(false);
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = React.useState(false);
    const [isOpsCompanyDropdownOpen, setIsOpsCompanyDropdownOpen] = React.useState(false);
    const [workForm, setWorkForm] = React.useState({
        title: '', companyName: '', employmentType: 'Please Select',
        location: '', salary: 0, currentlyWorking: false,
        startDate: '', endDate: '', description: ''
    });
    const [educationForm, setEducationForm] = React.useState({
        schoolName: '', qualification: '', specialization: '',
        grade: '', location: '', startDate: '', endDate: '',
        description: ''
    });

    const [followUpTaskForm, setFollowUpTaskForm] = React.useState({
        type: 'Follow Up',
        dueDate: 'Tomorrow'
    });

    const [ticketForm, setTicketForm] = useState({
        ticketNo: '', companyName: '', uploaddate: '', expdate: '', crtdate: '', type: 'Banca', dateFiled: '', companyMulti: [] as string[]
    });

    const [checklistForm, setChecklistForm] = useState<Record<string, string>>({
        verifyField: 'No',
        noPoachInCV: 'No',
        removeNoPoach: 'No',
        readyToMove: 'No',
        vehicle: 'No',
        graduation: 'No',
        degreeCertificate: 'No',
        rehiring: 'No'
    });

    const [searchOverview, setSearchOverview] = useState('');
    const [operationRemark, setOperationRemark] = useState('');
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isCodeView, setIsCodeView] = useState(false);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [activityTypeFilter, setActivityTypeFilter] = useState<string[]>(['Note', 'Call', 'Interview', 'To Do', 'Interview Feedback']);

    const toggleTypeFilter = (type: string) => {
        setActivityTypeFilter(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const [openJobs, setOpenJobs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const uniqueOpenCompanies = useMemo(() => {
        const companies = openJobs.map(job => job.company);
        return Array.from(new Set(companies)).sort();
    }, [openJobs]);

    const activityCounts = useMemo(() => {
        return {
            All: activities.length,
            'Notes&Calls': activities.filter(a => a.type === 'Note' || a.type === 'Call').length,
            Interviews: activities.filter(a => a.type === 'Interview').length
        };
    }, [activities]);

    const filteredActivities = useMemo(() => {
        let filtered = activities;

        if (activeSubTab === 'Notes&Calls') {
            filtered = activities.filter(a => a.type === 'Note' || a.type === 'Call');
        } else if (activeSubTab === 'Interviews') {
            filtered = activities.filter(a => a.type === 'Interview');
        }

        if (searchActivity.trim()) {
            const query = searchActivity.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                (a.content && a.content.toLowerCase().includes(query)) ||
                (a.type && a.type.toLowerCase().includes(query)) ||
                (typeof a.createdBy === 'object' && a.createdBy?.name?.toLowerCase().includes(query)) ||
                (typeof a.createdBy === 'string' && a.createdBy.toLowerCase().includes(query)) ||
                (a.companyName && a.companyName.toLowerCase().includes(query)) ||
                (a.status && a.status.toLowerCase().includes(query))
            );
        }

        // Apply specific type filters from the Filter Popover
        filtered = filtered.filter(a => activityTypeFilter.includes(a.type));

        return filtered;
    }, [activities, activeSubTab, searchActivity, activityTypeFilter]);

    const safeFormatDate = (dateStr: any) => {
        if (!dateStr) return 'Not available';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
    };

    const safeFormatFullDate = (dateStr: any) => {
        if (!dateStr) return 'Not available';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Not available' : `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const handleCopyLink = (url: string, fileName: string) => {
        navigator.clipboard.writeText(url).then(() => {
            showToast(`${fileName} link copied to clipboard`, 'success');
        }).catch(() => {
            showToast('Failed to copy link', 'error');
        });
    };

    const getCreatorName = (creator: any) => {
        if (!creator) return 'Admin';
        if (typeof creator === 'object' && creator.name) return creator.name;
        if (typeof creator === 'string') {
            const foundUser = users.find(u => u._id === creator || u.name === creator);
            return foundUser ? foundUser.name : creator;
        }
        return 'Admin';
    };

    useEffect(() => {
        fetchCandidateData();
        fetchOpenJobs();
        fetchUsers();
    }, [candidateId]);

    useEffect(() => {
        if (candidate) {
            fetchActivityFeed();
        }
    }, [candidate?.remarks, candidate?.phone, candidate?._id]);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data.map((u: any) => ({ _id: u._id, name: u.name, type: 'Employee' })));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Existing fetch functions


    const fetchCandidateData = async () => {
        setLoading(true);
        try {
            const data = await api.getCandidateById(candidateId);
            setCandidate(data);

            // Sync operations-related state
            if (data.fulfillmentChecklist) {
                setChecklistForm(prev => ({ ...prev, ...data.fulfillmentChecklist }));
            }
            if (data.operationRemark) {
                setOperationRemark(data.operationRemark);
            }
            if (data.companyMulti || data.dateFiled) {
                setTicketForm(prev => ({
                    ...prev,
                    companyMulti: data.companyMulti || [],
                    dateFiled: data.dateFiled || ''
                }));
            }

            // Ticket attention warnings (toast alerts for admin/manager/recruiter)
            const tickets = data.tickets || [];
            const alertTickets = tickets.filter((t: any) => {
                const isTicketEmpty = !t.ticketNo?.trim();
                const isDateMatch = isCrtOrExpAlert(t.crtdate) || isCrtOrExpAlert(t.expdate);
                const isNotUpdated = t.portalStatus !== 'Complete' && t.portalStatus !== 'Completed';
                return isTicketEmpty || (isDateMatch && isNotUpdated);
            });
            if (alertTickets.length > 0) {
                setTimeout(() => {
                    showToast(`Attention: Candidate has ${alertTickets.length} pending ticket(s) requiring action (empty numbers or expiring/due).`, 'warning');
                }, 800);
            }
        } catch (error) {
            showToast('Failed to load candidate profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityFeed = async () => {
        setActivityLoading(true);
        try {
            const [calls, interviews] = await Promise.all([
                api.getCallHistory(),
                api.getInterviews({ candidateId })
            ]);

            const combined: any[] = [];

            // Calls
            calls.forEach((c: any) => {
                if (c.phone === candidate?.phone || c.name === candidate?.name) {
                    combined.push({
                        id: c._id,
                        type: 'Call',
                        title: `${c.callType} Call`,
                        status: c.status,
                        content: c.remark,
                        date: c.date,
                        createdBy: getCreatorName(c.createdBy),
                        icon: <PhoneIcon size={14} className="icon-info" />,
                        isPinned: c.isPinned || false,
                        duration: c.duration,
                        callType: c.callType,
                        callDirection: c.callDirection
                    });
                }
            });

            // Interviews
            interviews.forEach((i: any) => {
                combined.push({
                    id: i._id,
                    type: 'Interview',
                    title: i.stage || 'Interview',
                    status: 'Scheduled',
                    content: `At ${i.companyName} via ${i.mode}`,
                    date: i.date,
                    time: i.time,
                    createdBy: getCreatorName(i.createdBy),
                    icon: <CalendarIcon size={14} className="icon-success" />,
                    isPinned: i.isPinned || false,
                    companyName: i.companyName,
                    mode: i.mode,
                    stage: i.stage,
                    stageHistory: i.stageHistory || {}
                });
            });

            // Remarks as Notes
            if (candidate?.remarks && Array.isArray(candidate.remarks)) {
                candidate.remarks.forEach((r: any, idx: number) => {
                    combined.push({
                        id: r._id || `remark-${idx}`,
                        type: 'Note',
                        title: 'General Note',
                        status: 'Note',
                        content: r.content || r.text || '',
                        date: r.date || candidate.updatedAt,
                        createdBy: getCreatorName(r.createdBy),
                        icon: <FileTextIcon size={14} className="icon-warning" />,
                        isPinned: r.isPinned || false
                    });
                });
            } else if (candidate?.remark) {
                // Fallback for migration
                combined.push({
                    id: 'remark-legacy',
                    type: 'Note',
                    title: 'Legacy Note',
                    status: 'Note',
                    content: candidate.remark,
                    date: candidate.createdAt,
                    createdBy: 'System',
                    icon: <FileTextIcon size={14} className="icon-warning" />,
                    isPinned: false
                });
            }

            setActivities(combined.sort((a, b) => {
                // Pinned first, then by date
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }));
        } catch (error) {
            console.error('Activity feed error:', error);
        } finally {
            setActivityLoading(false);
        }
    };

    const fetchOpenJobs = async () => {
        try {
            // Fetch all jobs to ensure we have settings for both 'Open' and 'Active' statuses
            const data = await api.getJobs();
            setOpenJobs(data);
        } catch (error) {
            console.error('Failed to fetch open jobs:', error);
        }
    };

    const handleGenerateResume = async () => {
        if (!candidate) return;
        setResumeLoading(true);
        try {
            const blob = await api.generateResume(candidateId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('Resume generated successfully', 'success');
        } catch (error: any) {
            console.error('Failed to generate resume:', error);
            showToast(error.message || 'Failed to generate resume', 'error');
        } finally {
            setResumeLoading(false);
        }
    };
    const handleGenerateCustomResume = async () => {
        if (!candidate) return;
        setCustomPdfLoading(true);
        try {
            const blob = await api.generateCustomResume(candidateId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${candidate.name.replace(/\s+/g, '_')}_Custom_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast('Custom Resume generated successfully', 'success');
        } catch (error: any) {
            console.error('Failed to generate custom resume:', error);
            showToast(error.message || 'Failed to generate custom resume', 'error');
        } finally {
            setCustomPdfLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const handleSaveEdit = async () => {
        if (!editingField) return;
        try {
            await api.updateCandidate(candidateId, { [editingField]: editValue });
            setCandidate({ ...candidate, [editingField]: editValue });
            showToast('Field updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update field', 'error');
        }
        setEditingField(null);
    };

    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`${label} copied to clipboard`, 'success');
            }).catch(() => {
                fallbackCopyToClipboard(text, label);
            });
        } else {
            fallbackCopyToClipboard(text, label);
        }
    };

    const fallbackCopyToClipboard = (text: string, label: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(`${label} copied to clipboard`, 'success');
        } catch (err) {
            showToast(`Failed to copy ${label}`, 'error');
        }
        document.body.removeChild(textArea);
    };


    const handleRequestUpdate = async () => {
        try {
            await api.requestProfileUpdate(candidateId);
            showToast('Profile update request sent to candidate', 'success');
            fetchActivityFeed(); // Refresh to see the new auto-note
        } catch (error) {
            showToast('Failed to send update request', 'error');
        }
    };


    const handleTabClick = (tab: 'Note' | 'Call' | 'Interview') => {
        setActiveActivityModal(tab);
    };

    const handleFormChange = (field: string, value: any) => {
        setActivityForm(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement> | string[]) => {
        let selectedOptions: string[] = [];
        if (Array.isArray(e)) {
            selectedOptions = e;
        } else {
            selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        }

        const newDetails = { ...activityForm.perCompanyDetails };

        // Initialize details for new companies
        selectedOptions.forEach(company => {
            if (!newDetails[company]) {
                newDetails[company] = {
                    date: new Date().toISOString().split('T')[0],
                    time: '2:00 PM',
                    mode: 'Video',
                    stage: 'First Round',
                    status: 'Pending',
                    offers: 'No',
                    shortlisted: 'No'
                };
            }
        });

        // Clean up details for removed companies
        Object.keys(newDetails).forEach(company => {
            if (!selectedOptions.includes(company)) {
                delete newDetails[company];
            }
        });

        setActivityForm(prev => ({
            ...prev,
            companyNames: selectedOptions,
            perCompanyDetails: newDetails
        }));
    };

    const handleDetailChange = (company: string, field: string, value: any) => {
        setActivityForm(prev => ({
            ...prev,
            perCompanyDetails: {
                ...prev.perCompanyDetails,
                [company]: {
                    ...prev.perCompanyDetails[company],
                    [field]: value
                }
            }
        }));
    };

    // --- Ticket Management Handlers ---

    const handleUpdateTicket = async (index: number, field: string, value: any) => {
        if (!candidate || !candidate.tickets) return;
        const updatedTickets = [...candidate.tickets];
        let currentTicket = { ...updatedTickets[index], [field]: value };

        // Recalculate expiry date and CRT date if uploaddate or companyName changes
        if (field === 'uploaddate' || field === 'companyName') {
            const companyToMatch = (field === 'companyName' ? value : currentTicket.companyName)?.toLowerCase().trim();
            const job = openJobs.find(j => j.company?.toLowerCase().trim() === companyToMatch);

            const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
            const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

            const uploadDate = currentTicket.uploaddate ? new Date(currentTicket.uploaddate) : new Date();
            if (!isNaN(uploadDate.getTime())) {
                // Calculate Expiry Date
                const expDate = new Date(uploadDate);
                expDate.setDate(uploadDate.getDate() + expiryDays);
                currentTicket.expdate = expDate.toISOString().split('T')[0];

                // Calculate CRT Date
                const crtDate = new Date(uploadDate);
                crtDate.setDate(uploadDate.getDate() + crtDays);
                currentTicket.crtdate = crtDate.toISOString().split('T')[0];
            }
        }

        updatedTickets[index] = currentTicket;
        setCandidate({ ...candidate, tickets: updatedTickets });

        // Auto-save change
        try {
            await api.updateCandidate(candidateId, { tickets: updatedTickets });
        } catch (error) {
            console.error('Failed to auto-save ticket:', error);
        }
    };

    const handleAddTicketRow = async () => {
        if (!candidate) return;
        const newTicket = {
            ticketNo: '',
            companyName: '',
            uploaddate: new Date().toISOString().split('T')[0],
            expdate: '',
            crtdate: new Date().toISOString().split('T')[0],
            type: 'Banca',
            portalStatus: 'Pending'
        };
        const updatedTickets = [...(candidate.tickets || []), newTicket];
        setCandidate({ ...candidate, tickets: updatedTickets });
        await api.updateCandidate(candidateId, { tickets: updatedTickets });
    };

    const handleCloneTicket = async (index: number) => {
        if (!candidate || !candidate.tickets) return;
        const ticketToClone = candidate.tickets[index];
        const clonedTicket = { ...ticketToClone, ticketNo: '' }; // Clear ticketNo for manual entry
        const updatedTickets = [...candidate.tickets];
        updatedTickets.splice(index + 1, 0, clonedTicket);
        setCandidate({ ...candidate, tickets: updatedTickets });
        await api.updateCandidate(candidateId, { tickets: updatedTickets });
    };

    const handleDeleteTicket = async (index: number) => {
        if (!candidate || !candidate.tickets) return;
        if (window.confirm('Are you sure you want to delete this ticket row?')) {
            const updatedTickets = candidate.tickets.filter((_: any, i: number) => i !== index);
            setCandidate({ ...candidate, tickets: updatedTickets });
            await api.updateCandidate(candidateId, { tickets: updatedTickets });
        }
    };

    // --- Role-Based Access Control ---

    const isAdminOrManager = useMemo(() => {
        const role = authUser?.role?.toLowerCase().trim() || '';
        return ['admin', 'manager', 'super admin', 'superadmin'].includes(role);
    }, [authUser]);

    // --- Operations Automation: Scheduled Interviews -> Tickets ---
    useEffect(() => {
        if (!candidate || !activities.length || !openJobs.length) return;

        const scheduledCompanies = [...new Set(activities
            .filter(a => a.type === 'Interview' && (a.status === 'Scheduled' || a.stage === 'Scheduled'))
            .map(a => a.companyName?.trim())
            .filter(Boolean)
        )];

        if (scheduledCompanies.length === 0) return;

        // 1. Auto-select in companyMulti if not already there
        setTicketForm(prev => {
            const newCompanyMulti = [...new Set([...prev.companyMulti, ...scheduledCompanies])];
            if (newCompanyMulti.length !== prev.companyMulti.length) {
                return { ...prev, companyMulti: newCompanyMulti };
            }
            return prev;
        });

        // 2. Auto-generate tickets
        let ticketsChanged = false;
        const currentTickets = [...(candidate.tickets || [])];

        scheduledCompanies.forEach(company => {
            const companyMatch = company.toLowerCase().trim();
            const hasTicket = currentTickets.some(t => t.companyName?.toLowerCase().trim() === companyMatch);

            if (!hasTicket) {
                const job = openJobs.find(j => j.company?.toLowerCase().trim() === companyMatch);
                const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
                const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

                const today = new Date();
                const uploadDateStr = today.toISOString().split('T')[0];

                const expDate = new Date(today);
                expDate.setDate(today.getDate() + expiryDays);
                const expDateStr = expDate.toISOString().split('T')[0];

                const crtDate = new Date(today);
                crtDate.setDate(today.getDate() + crtDays);
                const crtDateStr = crtDate.toISOString().split('T')[0];

                currentTickets.push({
                    ticketNo: '', // Manual entry
                    companyName: company,
                    uploaddate: uploadDateStr,
                    expdate: expDateStr,
                    crtdate: crtDateStr,
                    type: 'Banca',
                    portalStatus: 'Pending'
                });
                ticketsChanged = true;
            }
        });

        if (ticketsChanged) {
            setCandidate((prev: any) => ({ ...prev, tickets: currentTickets }));
            api.updateCandidate(candidateId, { tickets: currentTickets });
        }
    }, [activities, openJobs, candidate?.tickets?.length]);

    // Auto-sync Operations tab selection with Sidebar selection (Draft state)
    useEffect(() => {
        if (activeActivityModal !== 'Interview') return;

        const sidebarSelected = activityForm.companyNames || [];
        if (sidebarSelected.length === 0) return;

        setTicketForm(prev => {
            // We ensure sidebar selected companies are present in the Operations tab selection
            const existing = prev.companyMulti || [];
            const combined = [...new Set([...existing, ...sidebarSelected])];

            if (combined.length !== existing.length) {
                return { ...prev, companyMulti: combined };
            }
            return prev;
        });
    }, [activityForm.companyNames, activeActivityModal]);

    // Auto-sync tickets management with company selection in Operations tab
    useEffect(() => {
        if (!candidate) return;
        const currentSelected = ticketForm.companyMulti || [];
        const existingTickets = candidate.tickets || [];

        // Normalize selections for robust comparison
        const selectedNormalized = new Set(currentSelected.map(c => c.toLowerCase().trim()));

        // Find companies needing new tickets
        const companiesWithoutTickets = currentSelected.filter(c => {
            const normalizedC = c.toLowerCase().trim();
            return !existingTickets.some((t: any) => t.companyName?.toLowerCase().trim() === normalizedC);
        });

        // Find tickets to remove (associated with deselected companies)
        const ticketsToRemove = existingTickets.filter((t: any) => {
            if (!t.companyName) return false; // Keep manually added rows without a company
            const normalizedT = t.companyName.toLowerCase().trim();
            return !selectedNormalized.has(normalizedT);
        });

        if (companiesWithoutTickets.length > 0 || ticketsToRemove.length > 0) {
            let updatedTickets = [...existingTickets];

            // Add defaults for new companies
            companiesWithoutTickets.forEach(comp => {
                const job = openJobs.find(j => j.company?.toLowerCase().trim() === comp.toLowerCase().trim());
                const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
                const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

                const today = new Date();
                const uploadDateStr = today.toISOString().split('T')[0];

                const expDate = new Date(today);
                expDate.setDate(today.getDate() + expiryDays);
                const expDateStr = expDate.toISOString().split('T')[0];

                const crtDate = new Date(today);
                crtDate.setDate(today.getDate() + crtDays);
                const crtDateStr = crtDate.toISOString().split('T')[0];

                updatedTickets.push({
                    ticketNo: '',
                    companyName: comp,
                    uploaddate: uploadDateStr,
                    expdate: expDateStr,
                    crtdate: crtDateStr,
                    type: 'Banca',
                    portalStatus: 'Pending'
                });
            });

            // Filter out old ones
            updatedTickets = updatedTickets.filter(t => !ticketsToRemove.includes(t));

            setCandidate((prev: any) => ({
                ...prev,
                tickets: updatedTickets,
                companyMulti: currentSelected
            }));

            // Persist the changes to the database
            api.updateCandidate(candidateId, {
                tickets: updatedTickets,
                companyMulti: currentSelected
            });
        }
    }, [ticketForm.companyMulti, candidateId, openJobs]);

    const handleSaveActivity = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const loggedInUser = userStr ? JSON.parse(userStr) : null;
            const userId = loggedInUser?._id;

            if (!activityForm.note && (activeActivityModal === 'Note' || activeActivityModal === 'Call')) {
                showToast('Please enter some content', 'warning');
                return;
            }

            if (activeActivityModal === 'Note') {
                let updatedRemarks = [...(candidate.remarks || [])];

                if (editingActivityId) {
                    // Update existing note
                    updatedRemarks = updatedRemarks.map(r =>
                        r._id === editingActivityId ? { ...r, text: activityForm.note, content: activityForm.note, date: new Date().toISOString() } : r
                    );
                } else {
                    // Add new note
                    updatedRemarks.push({
                        _id: (Date.now() + Math.random()).toString(),
                        text: activityForm.note,
                        content: activityForm.note,
                        createdBy: userId, // Send just the ID string
                        date: new Date().toISOString(),
                        isPinned: false
                    });
                }

                // Clean the payload to ensure no cyclic/invalid data
                const payload = updatedRemarks.map(r => {
                    const contentVal = r.content || r.text || '';
                    const cleanObj: any = {
                        text: contentVal,
                        content: contentVal,
                        createdBy: typeof r.createdBy === 'object' ? r.createdBy?._id : r.createdBy,
                        date: r.date,
                        isPinned: r.isPinned
                    };
                    // Only include _id if it's a real server-side ID (not a temporary timestamp-based one)
                    if (r._id && !r._id.includes(Date.now().toString().substring(0, 5))) {
                        cleanObj._id = r._id;
                    }
                    return cleanObj;
                });

                await api.updateCandidate(candidateId, { remarks: payload });
                showToast(editingActivityId ? 'Note updated successfully' : 'Note added successfully', 'success');
            } else if (activeActivityModal === 'Call') {
                const callData = {
                    candidateId,
                    phone: candidate?.phone || '',
                    name: candidate?.name || '',
                    callDirection: activityForm.callDirection,
                    callType: activityForm.callType,
                    duration: activityForm.callDuration ? parseInt(activityForm.callDuration) * 60 : 0,
                    date: activityForm.callDate,
                    time: activityForm.callTime,
                    remark: activityForm.note
                };

                if (editingActivityId) {
                    await api.updateCall(editingActivityId, callData);
                } else {
                    await api.createCall(callData);
                }
                showToast(editingActivityId ? 'Call updated successfully' : 'Call logged successfully', 'success');
            } else if (activeActivityModal === 'Interview') {
                const companies = activityForm.companyNames;

                for (const company of companies) {
                    const detail = activityForm.perCompanyDetails[company] || {};
                    const now = new Date();
                    const dateStr = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();
                    const currentStage = detail.stage || activityForm.interviewStage;
                    const stageIdx = INTERVIEW_STAGES.indexOf(currentStage);
                    const initialHistory: Record<string, string> = {};
                    INTERVIEW_STAGES.forEach((s, idx) => {
                        if (idx <= stageIdx) {
                            initialHistory[s] = dateStr;
                        }
                    });

                    const interviewData = {
                        candidateId,
                        companyName: company,
                        date: detail.date || activityForm.interviewDate,
                        time: detail.time || activityForm.interviewTime,
                        mode: detail.mode || activityForm.interviewMode,
                        stage: currentStage,
                        status: detail.status || activityForm.interviewStatus,
                        feedback: activityForm.note,
                        stageHistory: initialHistory
                    };

                    if (editingActivityId) {
                        await api.updateInterview(editingActivityId, interviewData);
                        break; // Only update one if editing
                    } else {
                        await api.scheduleInterview(interviewData);

                        // Automatically generate a ticket for the scheduled interview
                        const newTicket = {
                            ticketNo: '', // User fills manually as per requirement
                            companyName: company,
                            uploaddate: new Date().toISOString().split('T')[0],
                            expdate: '',
                            crtdate: new Date().toISOString().split('T')[0],
                            type: 'Banca',
                            portalStatus: 'Pending'
                        };

                        const updatedTickets = [...(candidate.tickets || []), newTicket];

                        setCandidate((prev: any) => ({
                            ...prev,
                            tickets: updatedTickets
                        }));

                        // Persist the new ticket to the backend
                        await api.updateCandidate(candidateId, { tickets: updatedTickets });
                    }
                }
                showToast(editingActivityId ? 'Interview updated successfully' : 'Interviews scheduled successfully and tickets generated', 'success');
            }

            // Handle Follow-up Task Creation
            if (followUpTaskChecked && !editingActivityId) {
                try {
                    const dueDate = new Date();
                    if (followUpTaskForm.dueDate === 'Tomorrow') {
                        dueDate.setDate(dueDate.getDate() + 1);
                    } else if (followUpTaskForm.dueDate === 'in 3 Business Days') {
                        let daysToAdd = 3;
                        while (daysToAdd > 0) {
                            dueDate.setDate(dueDate.getDate() + 1);
                            if (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) {
                                daysToAdd--;
                            }
                        }
                    }

                    // Set a default time for the reminder (e.g., 9:00 AM)
                    dueDate.setHours(9, 0, 0, 0);

                    await api.createTask({
                        title: `${followUpTaskForm.type}: ${candidate.name}`,
                        description: activityForm.note || `Follow up for ${activeActivityModal}`,
                        candidate: candidateId,
                        assignedTo: userId,
                        dueDate: dueDate,
                        reminderTime: dueDate,
                        priority: 'Medium',
                        status: 'Todo'
                    });
                    showToast('Follow-up task created', 'success');
                } catch (taskError: unknown) {
                    console.error('Failed to create follow-up task:', taskError);
                    showToast('Activity saved but failed to create follow-up task', 'warning');
                }
            }

            // Cleanup
            setActiveActivityModal(null);
            setEditingActivityId(null);
            setActivityForm({
                note: '', noteType: 'Note', callDirection: 'Outgoing call',
                callType: 'Outgoing', callDuration: '',
                callDate: new Date().toISOString().split('T')[0], callTime: '11:00 PM',
                interviewDate: new Date().toISOString().split('T')[0], interviewTime: '2:00 PM',
                companyNames: [], perCompanyDetails: {}, interviewMode: 'Video', interviewStage: 'First Round',
                interviewStatus: 'Pending', offers: 'No', shortlisted: 'No'
            });
            setAiSuggestions([]);
            setAiLoading(false);
            fetchActivityFeed();
            fetchCandidateData();
        } catch (error: unknown) {
            showToast('Failed to save activity', 'error');
        }
    };

    const handlePinActivity = async (id: string, type: string, currentPinned: boolean) => {
        try {
            if (type === 'Note') {
                const updatedRemarks = (candidate.remarks || []).map((r: any) =>
                    r._id === id ? { ...r, isPinned: !currentPinned } : r
                );
                await api.updateCandidate(candidateId, { remarks: updatedRemarks });
            } else if (type === 'Call') {
                await api.updateCall(id, { isPinned: !currentPinned });
            } else if (type === 'Interview') {
                await api.updateInterview(id, { isPinned: !currentPinned });
            }
            showToast('Activity updated', 'success');
            fetchActivityFeed();
            fetchCandidateData();
        } catch (error: unknown) {
            showToast('Failed to pin activity', 'error');
        }
    };



    const handleAiCompanySuggestions = async (mode: 'global' | 'openJobs' = 'global') => {
        if (!candidate) return;
        setAiLoading(true);
        try {
            const candidateData = {
                skills: candidate.skills || [],
                experience: candidate.extractedExperience || candidate.experience || [],
                education: candidate.extractedEducation || candidate.education || []
            };

            const suggestions = await api.getCompanySuggestions(candidateData, openJobs, mode);
            setAiSuggestions(suggestions);

            if (suggestions.length === 0) {
                showToast('No relevant companies found for this profile.', 'info');
            } else {
                showToast(`Generated ${suggestions.length} company suggestions.`, 'success');
            }
        } catch (error: unknown) {
            console.error('AI Suggestion error:', error);
            showToast('AI failed to generate suggestions', 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const toggleInterviewStage = (id: string) => {
        setExpandedInterviewStages(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleUpdateInterviewStage = async (activityId: string, newStage: string) => {
        try {
            const now = new Date();
            const dateStr = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();
            const timestamp = dateStr; // Using date only as per user preference

            const activity = activities.find(a => a.id === activityId);
            const existingHistory = activity?.stageHistory || {};

            // Auto-fill previous stages if missing
            const newHistory = { ...existingHistory };
            const currentStageIdx = INTERVIEW_STAGES.indexOf(newStage);

            INTERVIEW_STAGES.forEach((stage, idx) => {
                if (idx <= currentStageIdx && !newHistory[stage]) {
                    newHistory[stage] = timestamp;
                }
            });

            // Local update for instant feedback
            setActivities(prev => prev.map(a =>
                a.id === activityId ? { ...a, stage: newStage, stageHistory: newHistory, status: 'Scheduled' } : a
            ));

            await api.updateInterview(activityId, {
                stage: newStage,
                stageHistory: newHistory,
                status: 'Scheduled',
                date: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'),
                time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
            });

            // "Selected-wise" ticket generation
            if (['Short-List', 'Final Round', 'Selected', 'Document Pre-offer'].includes(newStage)) {
                const activity = activities.find(a => a.id === activityId);
                const company = activity?.companyName;

                if (company) {
                    const ticketExists = (candidate?.tickets || []).some((t: any) => t.companyName === company);
                    if (!ticketExists) {
                        const job = openJobs.find(j => j.company === company);
                        const expiryDays = parseInt(job?.managers?.[0]?.expiryDays?.toString() || '30');
                        const crtDays = parseInt(job?.managers?.[0]?.crtDays?.toString() || '0');

                        const uploadDate = new Date();
                        const expDate = new Date(uploadDate);
                        expDate.setDate(uploadDate.getDate() + expiryDays);
                        const crtDate = new Date(uploadDate);
                        crtDate.setDate(uploadDate.getDate() + crtDays);

                        const newTicket = {
                            ticketNo: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
                            companyName: company,
                            uploaddate: uploadDate.toISOString().split('T')[0],
                            expdate: expDate.toISOString().split('T')[0],
                            crtdate: crtDate.toISOString().split('T')[0],
                            type: 'Banca',
                            portalStatus: 'In Progress'
                        };
                        const updatedTickets = [...(candidate.tickets || []), newTicket];
                        setCandidate((prev: any) => ({ ...prev, tickets: updatedTickets }));
                        await api.updateCandidate(candidateId, { tickets: updatedTickets });
                    }
                }
            }

            showToast(`Stage updated to ${newStage}`, 'success');

            // Removed automatic refreshes to prevent flickering as per user request

        } catch (error: unknown) {
            console.error('Update stage error:', error);
            showToast('Failed to update stage', 'error');
        }
    };

    const handleRejectInterviewStage = async (activityId: string, currentStage: string) => {
        try {
            if (!window.confirm(`Are you sure you want to REJECT the candidate at ${currentStage} stage?`)) return;
            // Local update
            setActivities(prev => prev.map(a =>
                a.id === activityId ? { ...a, status: 'Rejected' } : a
            ));

            await api.updateInterview(activityId, {
                status: 'Rejected',
                feedback: `Rejected at ${currentStage} stage`
            });

            showToast(`Candidate rejected at ${currentStage} stage`, 'info');
        } catch (error) {
            console.error('Failed to reject:', error);
            showToast('Failed to update rejection status', 'error');
        }
    };

    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
    const [onboardingForm, setOnboardingForm] = useState({
        offerStatus: candidate?.offerStatus || 'Pending',
        isResigned: candidate?.isResigned || 'No',
        noticePeriod: candidate?.noticePeriod || '',
        doj: candidate?.doj || ''
    });

    useEffect(() => {
        if (candidate) {
            setOnboardingForm({
                offerStatus: candidate.offerStatus || 'Pending',
                isResigned: candidate.isResigned || 'No',
                noticePeriod: candidate.noticePeriod || '',
                doj: candidate.doj || ''
            });
        }
    }, [candidate]);

    const handleSaveOnboarding = async () => {
        try {
            await api.updateCandidate(candidateId, onboardingForm);
            setCandidate((prev: any) => ({ ...prev, ...onboardingForm }));
            showToast('Onboarding details saved successfully', 'success');
            setIsOnboardingModalOpen(false);
        } catch (error) {
            console.error('Save onboarding error:', error);
            showToast('Failed to save onboarding details', 'error');
        }
    };

    const handleCandidateDecision = async (activityId: string, decision: 'Accepted' | 'Rejected') => {
        try {
            if (!window.confirm(`Candidate has ${decision.toLowerCase()} the offer. Proceed?`)) return;

            if (decision === 'Accepted') {
                // Move to next stage "Document Pre-offer"
                handleUpdateInterviewStage(activityId, 'Document Pre-offer');
                setIsOnboardingModalOpen(true);
                showToast('Candidate accepted! Moved to Document Pre-offer stage.', 'success');
            } else {
                // Set status to Rejected by Candidate
                setActivities(prev => prev.map(a =>
                    a.id === activityId ? { ...a, status: 'Rejected by Candidate', feedback: 'Rejected by Candidate' } : a
                ));

                await api.updateInterview(activityId, {
                    status: 'Rejected', // Backend status is still Rejected
                    feedback: 'Rejected by Candidate'
                });
                showToast('Candidate rejected the offer.', 'info');
            }
        } catch (error) {
            console.error('Failed to update candidate decision:', error);
            showToast('Failed to update candidate decision', 'error');
        }
    };

    const handleDeleteActivity = async (id: string, type: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'Note') {
                const updatedRemarks = (candidate.remarks || []).filter((r: any) => r._id !== id);
                await api.updateCandidate(candidateId, { remarks: updatedRemarks });
            } else if (type === 'Call') {
                await api.deleteCall(id);
            } else if (type === 'Interview') {
                await api.deleteInterview(id);
            }
            showToast(`${type} deleted successfully`, 'success');
            fetchActivityFeed();
            fetchCandidateData();
        } catch (error: unknown) {
            showToast(`Failed to delete ${type}`, 'error');
        }
    };

    const handleEditActivity = (activity: any) => {
        setEditingActivityId(activity.id);
        setActivityForm({
            ...activityForm,
            note: activity.content || '',
            callDirection: activity.callDirection || 'Outgoing call',
            callType: activity.callType || 'Outgoing',
            callDuration: activity.duration ? (activity.duration / 60).toString() : '',
            callDate: activity.date ? new Date(activity.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            callTime: activity.time || '11:00 PM',
            interviewDate: activity.date ? new Date(activity.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            interviewTime: activity.time || '2:00 PM',
            companyNames: activity.companyName ? [activity.companyName] : [],
            perCompanyDetails: activity.companyName ? {
                [activity.companyName]: {
                    date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    time: activity.time || '2:00 PM',
                    mode: activity.mode || 'Video',
                    stage: activity.stage || 'First Round',
                    status: activity.status || 'Pending',
                    offers: activity.offers || 'No',
                    shortlisted: activity.shortlisted || 'No'
                }
            } : {},
            interviewMode: activity.mode || 'Video',
            interviewStage: activity.stage || 'First Round',
            interviewStatus: activity.status || 'Pending',
        });
        setActiveActivityModal(activity.type as any);
    };

    const handleSaveWorkEx = async () => {
        try {
            let updatedWork = [...(candidate.extractedExperience || [])];
            if (editingExperienceIndex !== null) {
                updatedWork[editingExperienceIndex] = { ...workForm };
            } else {
                updatedWork.push({ ...workForm, id: Date.now().toString() });
            }
            await api.updateCandidate(candidateId, { extractedExperience: updatedWork });
            showToast(editingExperienceIndex !== null ? 'Work experience updated' : 'Work experience added', 'success');
            setCandidate({ ...candidate, extractedExperience: updatedWork });
            setIsWorkModalOpen(false);
            setEditingExperienceIndex(null);
            setWorkForm({
                title: '', companyName: '', employmentType: 'Please Select',
                location: '', salary: 0, currentlyWorking: false,
                startDate: '', endDate: '', description: ''
            });
        } catch (error: unknown) {
            showToast('Failed to save work experience', 'error');
        }
    };

    const handleDeleteExperience = async (index: number) => {
        if (!window.confirm('Delete this work experience?')) return;
        try {
            const updatedWork = (candidate.extractedExperience || []).filter((_: any, i: number) => i !== index);
            await api.updateCandidate(candidateId, { extractedExperience: updatedWork });
            showToast('Experience deleted', 'success');
            setCandidate({ ...candidate, extractedExperience: updatedWork });
        } catch (error: unknown) {
            showToast('Failed to delete experience', 'error');
        }
    };

    const handleSaveEducation = async () => {
        try {
            let updatedEdu = [...(candidate.extractedEducation || [])];
            if (editingEducationIndex !== null) {
                updatedEdu[editingEducationIndex] = { ...educationForm };
            } else {
                updatedEdu.push({ ...educationForm, id: Date.now().toString() });
            }
            await api.updateCandidate(candidateId, { extractedEducation: updatedEdu });
            showToast(editingEducationIndex !== null ? 'Education history updated' : 'Education history added', 'success');
            setCandidate({ ...candidate, extractedEducation: updatedEdu });
            setIsEducationModalOpen(false);
            setEditingEducationIndex(null);
            setEducationForm({
                schoolName: '', qualification: '', specialization: '',
                grade: '', location: '', startDate: '', endDate: '',
                description: ''
            });
        } catch (error: unknown) {
            showToast('Failed to save education history', 'error');
        }
    };

    const handleDeleteEducation = async (index: number) => {
        if (!window.confirm('Delete this education history?')) return;
        try {
            const updatedEdu = (candidate.extractedEducation || []).filter((_: any, i: number) => i !== index);
            await api.updateCandidate(candidateId, { extractedEducation: updatedEdu });
            showToast('Education deleted', 'success');
            setCandidate({ ...candidate, extractedEducation: updatedEdu });
        } catch (error: unknown) {
            showToast('Failed to delete education', 'error');
        }
    };

    if (loading) return <div className="flex-center h-full bg-main">Loading Profile...</div>;
    if (!candidate) return <div className="p-24">Candidate not found.</div>;


    const AccordionSection = ({ title, id, count, children }: { title: string, id: string, count?: number, children: React.ReactNode }) => (
        <div className="accordion-section">
            <div className="accordion-header" onClick={() => toggleSection(id)}>
                <h3 className="text-base text-bold m-0">
                    {title} {count !== undefined && <span className="text-muted text-normal ml-4">{count}</span>}
                </h3>
                {expandedSections.includes(id) ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
            </div>
            {expandedSections.includes(id) && (
                <div className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );

    const EditableInfoItem = ({ label, value, fieldKey }: { label: string, value: any, fieldKey: string }) => (
        <div className="info-item">
            <label>{label}</label>
            <div className="editable-info-item" onClick={() => { setEditingField(fieldKey); setEditValue(value); }}>
                <span>{value || 'Not available'}</span>
                <div className="edit-pencil-icon"><EditIcon size={14} /></div>

                {editingField === fieldKey && (
                    <div className="edit-popover" onClick={(e) => e.stopPropagation()}>
                        <h4>{label}</h4>
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                        />
                        <div className="edit-popover-footer">
                            <a href="#" className="replace-field-link">Replace Field</a>
                            <button className="btn-white text-sm" onClick={() => setEditingField(null)}>Close</button>
                            <button className="btn-mint" onClick={handleSaveEdit}>Save</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="profile-drawer-container">
            {/* Top Navigation Navbar */}
            <div className="profile-top-navbar">
                <div className="nav-left-actions">
                    <button className="req-update-btn" onClick={handleRequestUpdate}>Request Updated Profile</button>
                    <div className="nav-icon-row">
                        <div className="nav-icon-btn" onClick={() => setIsEditCandidateModalOpen(true)} title="Edit Candidate"><EditIcon size={16} /></div>
                    </div>
                </div>
                <div className="nav-right-actions">
                    {candidateIds.length > 1 && (
                        <div className="flex-align-center gap-8 mr-16 pr-16 border-r-slate">
                            <button
                                className="nav-icon-btn"
                                onClick={() => {
                                    const idx = candidateIds.indexOf(candidateId);
                                    if (idx > 0) onNavigate?.(candidateIds[idx - 1]);
                                }}
                                disabled={candidateIds.indexOf(candidateId) <= 0}
                                style={{ opacity: candidateIds.indexOf(candidateId) <= 0 ? 0.4 : 1, cursor: candidateIds.indexOf(candidateId) <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                                <ArrowLeftIcon size={18} />
                            </button>
                            <button
                                className="nav-icon-btn"
                                onClick={() => {
                                    const idx = candidateIds.indexOf(candidateId);
                                    if (idx < candidateIds.length - 1) onNavigate?.(candidateIds[idx + 1]);
                                }}
                                disabled={candidateIds.indexOf(candidateId) >= candidateIds.length - 1}
                                style={{ opacity: candidateIds.indexOf(candidateId) >= candidateIds.length - 1 ? 0.4 : 1, cursor: candidateIds.indexOf(candidateId) >= candidateIds.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ArrowRightIcon size={18} />
                            </button>
                        </div>
                    )}
                    <div className="nav-icon-btn" onClick={onClose}><XIcon size={18} /></div>
                </div>
            </div>

            <div className="profile-content-split">
                {/* Main Scroll Area */}
                <div className="profile-main-scroll">
                    {/* Header Banner */}
                    <div className="profile-banner-card">
                        <div className="banner-left">
                            <div className="profile-avatar-circle">
                                {candidate.photograph?.fileUrl ? (
                                    <img
                                        src={candidate.photograph.fileUrl.startsWith('http') ? candidate.photograph.fileUrl : `${BASE_URL}${candidate.photograph.fileUrl}`}
                                        alt={candidate.name}
                                        className="candidate-avatar-img"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <UserIcon size={32} />
                                )}
                            </div>
                            <div className="banner-info">
                                <div className="flex-align-center gap-8">
                                    <h1>{candidate.name}</h1>
                                    <span className="text-xs text-muted flex-align-center gap-4">
                                        ID {candidate.applicationId || candidate._id.substring(0, 4)} <div onClick={() => copyToClipboard(candidate.applicationId || candidate._id, 'ID')} className="cursor-pointer"><CopyIcon size={12} /></div>
                                    </span>
                                </div>
                                <div className="flex-align-center gap-16 mt-4 text-sm text-muted">
                                    <span className="flex-align-center gap-4"><PhoneIcon size={12} /> {candidate.phone || 'Not available'}</span>
                                    <span className="flex-align-center gap-4"><MailIcon size={12} /> {candidate.email}</span>
                                </div>
                                <div className="social-icon-row mt-12 gap-12">
                                    <div className="social-mini-icon"><LinkedinIcon size={14} /></div>
                                    <div className="social-mini-icon"><GithubIcon size={14} /></div>
                                    <div className="social-mini-icon"><TwitterIcon size={14} /></div>
                                    <div className="social-mini-icon"><FacebookIcon size={14} /></div>
                                    <div className="social-mini-icon whatsapp">
                                        <a href={`https://wa.me/${candidate.phone?.replace(/[^0-9]/g, '') || ''}`} target="_blank" rel="noopener noreferrer" className="flex-align-center bg-transparent border-none p-0 text-white">
                                            <WhatsappIcon size={14} />
                                        </a>
                                    </div>
                                    <div className="social-mini-icon"><GlobeIcon size={14} /></div>
                                </div>
                            </div>
                        </div>
                        <div className="banner-right">
                            <button
                                className="custom-pdf-btn"
                                onClick={handleGenerateCustomResume}
                                disabled={customPdfLoading}
                            >
                                <FileTextIcon size={14} />
                                {customPdfLoading ? 'Generating...' : 'Custom HTML2PDF'}
                            </button>

                            <button
                                className="generate-resume-btn"
                                onClick={handleGenerateResume}
                                disabled={resumeLoading}
                            >
                                <SparklesIcon size={14} />
                                {resumeLoading ? 'Generating...' : 'Generate Resume'}
                            </button>
                            <button className="contact-linked-btn">Contact Linked</button>
                            <div className="flex-align-center gap-16 text-muted text-sm">
                                <span className="flex-align-center gap-6"><MapPinIcon size={14} /> {candidate.location || 'Vadodara'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Meta Contact Row */}
                    <div className="profile-meta-bar">
                        <div className="meta-left-group flex-align-center gap-20">
                            <div className="flex-align-center gap-12">
                                <PhoneIcon size={16} color="#3b82f6" />
                                <span className="text-semibold">{candidate.phone || '9876543210'}</span>
                                <div onClick={() => copyToClipboard(candidate.phone || '9876543210', 'Phone')} className="cursor-pointer flex-align-center">
                                    <CopyIcon size={14} color="#94a3b8" />
                                </div>
                                <a href={`https://wa.me/${candidate.phone?.replace(/[^0-9]/g, '') || '9876543210'}`} target="_blank" rel="noopener noreferrer" className="flex-align-center text-green">
                                    <WhatsappIcon size={18} />
                                </a>
                            </div>
                            <div className="flex-align-center gap-12 ml-20">
                                <MailIcon size={16} color="#3b82f6" />
                                <span className="text-semibold">{candidate.email}</span>
                                <div onClick={() => copyToClipboard(candidate.email, 'Email')} className="cursor-pointer flex-align-center">
                                    <CopyIcon size={14} color="#94a3b8" />
                                </div>
                            </div>
                        </div>
                        <div className="meta-right-group flex-align-center gap-16">
                            <span className="flex-align-center gap-6"><UserIcon size={14} /> {candidate.createdBy?.name || 'Bhavesh Prajapati'}</span>
                            <span className="flex-align-center gap-6"><ClockIcon size={14} /> {safeFormatFullDate(candidate.createdAt)}</span>
                        </div>
                    </div>

                    {/* Information Overview Grid */}
                    <div className="info-overview-card">
                        <div className="info-header-row" style={{ cursor: 'default' }}>
                            <div className="info-title-row">
                                <SparklesIcon size={16} color="#3b82f6" />
                                <h3 className="text-lg text-bold m-0">Information Overview</h3>
                                <span className="info-count-badge">24</span>
                            </div>
                            <div className="info-search-row">
                                <div className="search-input-group">
                                    <SearchIcon size={14} color="#94a3b8" />
                                    <input
                                        type="text"
                                        className="grid-search-input"
                                        placeholder="Search fields or values..."
                                        value={searchOverview}
                                        onChange={(e) => setSearchOverview(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="header-action-group">
                                    <FilterIcon size={14} color="#64748b" className="cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                </div>
                            </div>
                        </div>
                        <div className="info-grid-4col">
                            {(() => {
                                const infoItems = [
                                    {
                                        label: 'Current Organization', value: candidate.currentCompany ? (
                                            <Link to={`/company/${encodeURIComponent(candidate.currentCompany)}`} className="text-blue text-semibold" onClick={(e) => e.stopPropagation()}>
                                                {candidate.currentCompany}
                                            </Link>
                                        ) : 'Not available', fieldKey: 'currentCompany', type: 'readonly'
                                    },
                                    { label: 'Current Salary', value: `₹ ${candidate.currentCTC?.toLocaleString() || '0'}`, fieldKey: 'currentCTC', type: 'editable' },
                                    { label: 'Skills', value: candidate.sector, type: 'skills' },
                                    { label: 'Salary Expectation', value: `₹ ${candidate.expectedCTC?.toLocaleString() || '0'}`, fieldKey: 'expectedCTC', type: 'editable' },
                                    { label: 'Resume', value: 'candidate_resume.pdf', type: 'resume' },
                                    { label: 'Assessment', value: candidate.assessment || 'Pending', fieldKey: 'assessment', type: 'editable' },
                                    { label: 'Gender', value: candidate.gender || 'Male', fieldKey: 'gender', type: 'editable' },
                                    { label: 'Birth Date', value: safeFormatDate(candidate.dob), fieldKey: 'dob', type: 'editable' },
                                    { label: 'Source', value: candidate.channel, fieldKey: 'channel', type: 'editable' },
                                    { label: 'Total Experience', value: `${candidate.totalWorkExp || 0} Years`, fieldKey: 'totalWorkExp', type: 'editable' },
                                    { label: 'Relevant Experience', value: `${candidate.relevantExp || 0} Years`, fieldKey: 'relevantExp', type: 'editable' },
                                    { label: 'Notice Period (days)', value: candidate.noticePeriod, fieldKey: 'noticePeriod', type: 'editable' },
                                    { label: 'Postal Code', value: candidate.postalCode, fieldKey: 'postalCode', type: 'editable' },
                                    { label: 'Full Address', value: candidate.location, fieldKey: 'location', type: 'editable' },
                                    { label: 'State', value: candidate.state, fieldKey: 'state', type: 'editable' },
                                    { label: 'Country', value: candidate.country, fieldKey: 'country', type: 'editable' },
                                    { label: 'Employment Status', value: candidate.willingToRelocate ? 'Relocating' : 'Local', fieldKey: 'willingToRelocate', type: 'editable' }
                                ];

                                const filtered = infoItems.filter(item => {
                                    if (!searchOverview.trim()) return true;
                                    const query = searchOverview.toLowerCase();

                                    // Improved search that extracts text from React nodes if value is not a simple string/number
                                    const getSearchableValue = (val: any): string => {
                                        if (val === null || val === undefined) return '';
                                        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val).toLowerCase();

                                        // Handle React elements (simplified approach: if it has props.children, search those)
                                        if (React.isValidElement(val)) {
                                            const children = (val.props as any)?.children;
                                            if (Array.isArray(children)) return children.map(c => getSearchableValue(c)).join(' ');
                                            return getSearchableValue(children);
                                        }
                                        return '';
                                    };

                                    return (
                                        item.label.toLowerCase().includes(query) ||
                                        getSearchableValue(item.value).includes(query)
                                    );
                                });


                                if (filtered.length === 0) {
                                    return (
                                        <div className="col-span-full p-40 text-center text-muted">
                                            <InboxIcon size={32} className="mt-12" />
                                            <p>No matching fields found for "{searchOverview}"</p>
                                        </div>
                                    );
                                }

                                return filtered.map((item, idx) => {
                                    if (item.type === 'readonly') {
                                        return (
                                            <div key={idx} className="info-item">
                                                <label>{item.label}</label>
                                                <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        );
                                    }
                                    if (item.type === 'editable') {
                                        return <EditableInfoItem key={idx} label={item.label} value={item.value} fieldKey={item.fieldKey!} />;
                                    }
                                    if (item.type === 'skills') {
                                        return (
                                            <div key={idx} className="info-item">
                                                <label>Skills</label>
                                                <div className="d-flex gap-8 flex-wrap">
                                                    {candidate.sector?.split(',').map((skill: string) => (
                                                        <span key={skill} className="skill-tag">{skill.trim()}</span>
                                                    )) || <span>Not available</span>}
                                                </div>
                                            </div>
                                        );
                                    }
                                    if (item.type === 'resume') {
                                        return (
                                            <div key={idx} className="info-item">
                                                <label>Resume</label>
                                                <div className="flex-align-center gap-8 text-blue text-semibold cursor-pointer">
                                                    <FileTextIcon size={16} />
                                                    <span>{item.value}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                });
                            })()}
                        </div>
                    </div>

                    {/* Tabs Row */}
                    <div className="bottom-tabs-row">
                        {[
                            { name: 'Details', count: null, visible: true },
                            { name: 'Operations', count: candidate?.tickets?.length || 0, visible: isAdminOrManager },
                            { name: 'Questions', count: 0, visible: true },
                            { name: 'Related Emails', count: null, visible: true },
                            { name: 'Files', count: (candidate?.resume ? 1 : 0) + (candidate?.photograph ? 1 : 0) + (candidate?.panCard ? 1 : 0) + (candidate?.aadhaarCard ? 1 : 0), visible: true }
                        ].filter(tab => tab.visible).map(tab => (
                            <div
                                key={tab.name}
                                className={`bottom-tab ${activeBottomTab === tab.name ? 'active' : ''}`}
                                onClick={() => setActiveBottomTab(tab.name)}
                            >
                                {tab.name}
                                {tab.count !== null && <span className="bottom-tab-count">{tab.count}</span>}
                            </div>
                        ))}
                    </div>

                    {activeBottomTab === 'Details' && (
                        <div className="flex-column">
                            <div className="history-grid-layout">
                                <AccordionSection title="Work History" id="Work" count={candidate?.extractedExperience?.length || 0}>
                                    <div className="history-scroll-container custom-scrollbar">
                                        <div className="flex-column gap-12">
                                            {candidate?.extractedExperience?.length > 0 ? (
                                                candidate.extractedExperience.map((exp: any, idx: number) => (
                                                    <div key={idx} className="history-card">
                                                        <div className="history-card-actions">
                                                            <button className="btn-history-action" title="Edit" onClick={() => {
                                                                setWorkForm({ ...exp });
                                                                setEditingExperienceIndex(idx);
                                                                setIsWorkModalOpen(true);
                                                            }}>
                                                                <EditIcon size={14} />
                                                            </button>
                                                            <button className="btn-history-action delete" title="Delete" onClick={() => handleDeleteExperience(idx)}>
                                                                <TrashIcon size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="history-card-header">
                                                            <div className="history-company-logo">
                                                                <BriefcaseIcon size={18} />
                                                            </div>
                                                            <div className="history-title-info">
                                                                <h4 className="history-title">{exp.title}</h4>
                                                                <p className="history-subtitle">{exp.companyName} • {exp.employmentType}</p>
                                                            </div>
                                                        </div>
                                                        <div className="history-card-body">
                                                            <div className="history-date-location">
                                                                <span className="history-date"><CalendarIcon size={12} /> {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                                                                <span className="history-location"><MapPinIcon size={12} /> {exp.location}</span>
                                                            </div>
                                                            {exp.description && (
                                                                <div className="history-description">
                                                                    {exp.description.split('\n').map((line: string, i: number) => (
                                                                        <p key={i}>{line}</p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-history-placeholder">
                                                    <p>No work history found</p>
                                                    <button className="btn-outline-blue" onClick={() => setIsWorkModalOpen(true)}>+ Add Experience</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {candidate?.extractedExperience?.length > 0 && (
                                        <button className="add-more-link" onClick={() => {
                                            setEditingExperienceIndex(null);
                                            setWorkForm({
                                                title: '', companyName: '', employmentType: 'Please Select',
                                                location: '', salary: 0, currentlyWorking: false,
                                                startDate: '', endDate: '', description: ''
                                            });
                                            setIsWorkModalOpen(true);
                                        }}>+ Add more experience</button>
                                    )}
                                </AccordionSection>

                                <AccordionSection title="Education History" id="Education" count={candidate?.extractedEducation?.length || 0}>
                                    <div className="history-scroll-container custom-scrollbar">
                                        <div className="flex-column gap-12">
                                            {candidate?.extractedEducation?.length > 0 ? (
                                                candidate.extractedEducation.map((edu: any, idx: number) => (
                                                    <div key={idx} className="history-card">
                                                        <div className="history-card-actions">
                                                            <button className="btn-history-action" title="Edit" onClick={() => {
                                                                setEducationForm({ ...edu });
                                                                setEditingEducationIndex(idx);
                                                                setIsEducationModalOpen(true);
                                                            }}>
                                                                <EditIcon size={14} />
                                                            </button>
                                                            <button className="btn-history-action delete" title="Delete" onClick={() => handleDeleteEducation(idx)}>
                                                                <TrashIcon size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="history-card-header">
                                                            <div className="history-company-logo education">
                                                                <UserIcon size={18} />
                                                            </div>
                                                            <div className="history-title-info">
                                                                <h4 className="history-title">{edu.qualification}</h4>
                                                                <p className="history-subtitle">{edu.schoolName} • {edu.specialization}</p>
                                                            </div>
                                                        </div>
                                                        <div className="history-card-body">
                                                            <div className="history-date-location">
                                                                <span className="history-date"><CalendarIcon size={12} /> {edu.startDate} - {edu.endDate}</span>
                                                                <span className="history-location"><MapPinIcon size={12} /> {edu.location}</span>
                                                            </div>
                                                            {edu.grade && <p className="history-grade">Grade: <strong>{edu.grade}</strong></p>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-history-placeholder">
                                                    <p>No education history found</p>
                                                    <button className="btn-outline-blue" onClick={() => setIsEducationModalOpen(true)}>+ Add Education</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {candidate?.extractedEducation?.length > 0 && (
                                        <button className="add-more-link" onClick={() => {
                                            setEditingEducationIndex(null);
                                            setEducationForm({
                                                schoolName: '', qualification: '', specialization: '',
                                                grade: '', location: '', startDate: '', endDate: '',
                                                description: ''
                                            });
                                            setIsEducationModalOpen(true);
                                        }}>+ Add more education</button>
                                    )}
                                </AccordionSection>
                            </div>

                            <AccordionSection title="System Information" id="System" count={4}>
                                <div className="system-info-grid">
                                    <div className="info-item">
                                        <label>Created On</label>
                                        <span>{safeFormatFullDate(candidate.createdAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Created By</label>
                                        <span>{candidate.createdBy?.name || 'Not Available'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Last Updated On</label>
                                        <span>{safeFormatFullDate(candidate.updatedAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Last Updated By</label>
                                        <span>{candidate.updatedBy?.name || 'Not Available'}</span>
                                    </div>
                                </div>
                            </AccordionSection>
                        </div>
                    )}

                    {activeBottomTab === 'Operations' && isAdminOrManager && (
                        <div className="operations-unified-container mt-16">
                            <div className="ops-header-section">
                                <div className="form-field-group">
                                    <label>Company (Multi-select)</label>
                                    <div className="multi-select-container">
                                        <div className="custom-multi-select-container">
                                            <div className="multi-select-trigger" onClick={() => setIsOpsCompanyDropdownOpen(!isOpsCompanyDropdownOpen)}>
                                                <span className="trigger-value">
                                                    {ticketForm.companyMulti.length > 0
                                                        ? ticketForm.companyMulti.join(', ')
                                                        : 'Select Companies'}
                                                </span>
                                                <ChevronDownIcon size={16} />
                                            </div>

                                            {isOpsCompanyDropdownOpen && (
                                                <div className="multi-select-dropdown">
                                                    <div className="dropdown-search">
                                                        <button className="text-link-button" onClick={() => setTicketForm({ ...ticketForm, companyMulti: uniqueOpenCompanies })}>Select All</button>
                                                    </div>
                                                    <div className="dropdown-options">
                                                        {uniqueOpenCompanies.map((company: string) => {
                                                            const isSelected = ticketForm.companyMulti.includes(company);
                                                            return (
                                                                <div
                                                                    key={company}
                                                                    className={`multi-option-item ${isSelected ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        const current = [...ticketForm.companyMulti];
                                                                        if (isSelected) {
                                                                            setTicketForm({ ...ticketForm, companyMulti: current.filter(c => c !== company) });
                                                                        } else {
                                                                            setTicketForm({ ...ticketForm, companyMulti: [...current, company] });
                                                                        }
                                                                    }}
                                                                >
                                                                    <span>{company}</span>
                                                                    {isSelected && <CheckIcon size={14} />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-field-group">
                                    <label>Date Filed</label>
                                    <div className="w-full">
                                        <input
                                            type="date"
                                            className="ops-inputs"
                                            value={ticketForm.dateFiled}
                                            onChange={(e) => setTicketForm({ ...ticketForm, dateFiled: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="tickets-management-section">
                                <h4 className="flex-align-center gap-8">
                                    <FileTextIcon size={18} /> Tickets Management
                                </h4>

                                <div className="modern-editable-table-container">
                                    <table className="modern-editable-table">
                                        <thead>
                                            <tr>
                                                <th>Ticket No</th>
                                                <th>Company</th>
                                                <th>Upload Date</th>
                                                <th>Exp. Date</th>
                                                <th>Crt Date</th>
                                                <th>Type</th>
                                                <th>Status Changes</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(candidate.tickets || []).map((t: any, idx: number) => {
                                                const isTicketEmpty = !t.ticketNo?.trim();
                                                const isExpDateAlert = isCrtOrExpAlert(t.expdate);
                                                const isCrtDateAlert = isCrtOrExpAlert(t.crtdate);
                                                const isDateMatch = isExpDateAlert || isCrtDateAlert;
                                                const isNotUpdated = t.portalStatus !== 'Complete' && t.portalStatus !== 'Completed';
                                                const isAlertRow = isDateMatch && isNotUpdated;

                                                let trClass = '';
                                                if (isTicketEmpty) {
                                                    trClass = 'empty-row';
                                                } else if (isAlertRow) {
                                                    trClass = 'alert-row';
                                                }

                                                return (
                                                    <tr key={`ticket-${idx}`} className={trClass}>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className={`table-input ${isTicketEmpty ? 'input-alert-border' : ''}`}
                                                                value={t.ticketNo}
                                                                onChange={(e) => handleUpdateTicket(idx, 'ticketNo', e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="table-select company-select"
                                                                value={t.companyName}
                                                                onChange={(e) => handleUpdateTicket(idx, 'companyName', e.target.value)}
                                                                disabled={!t.ticketNo?.trim()}
                                                            >
                                                                <option value="">Select Company</option>
                                                                {ticketForm.companyMulti.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="date"
                                                                className="table-input"
                                                                value={t.uploaddate}
                                                                onChange={(e) => handleUpdateTicket(idx, 'uploaddate', e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="date"
                                                                className={`table-input bg-main ${isExpDateAlert ? 'input-alert-border' : ''}`}
                                                                value={t.expdate}
                                                                onChange={(e) => handleUpdateTicket(idx, 'expdate', e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="date"
                                                                className={`table-input ${isCrtDateAlert ? 'input-alert-border' : ''}`}
                                                                value={t.crtdate}
                                                                onChange={(e) => handleUpdateTicket(idx, 'crtdate', e.target.value)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="table-select"
                                                                value={t.type}
                                                                onChange={(e) => handleUpdateTicket(idx, 'type', e.target.value)}
                                                            >
                                                                <option>Banca</option>
                                                                <option>Agency</option>
                                                                <option>Direct</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="table-select"
                                                                value={t.portalStatus}
                                                                onChange={(e) => handleUpdateTicket(idx, 'portalStatus', e.target.value)}
                                                            >
                                                                <option>Pending</option>
                                                                <option>Completed</option>
                                                                <option>In Progress</option>
                                                            </select>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="action-btn-group">
                                                                <button
                                                                    onClick={() => handleCloneTicket(idx)}
                                                                    className="icon-action-btn blue"
                                                                    title="Clone Ticket"
                                                                >
                                                                    <CopyIcon size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTicket(idx)}
                                                                    className="icon-action-btn red"
                                                                    title="Delete Ticket"
                                                                >
                                                                    <TrashIcon size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!candidate.tickets || candidate.tickets.length === 0) && (
                                                <tr>
                                                    <td colSpan={8} className="p-24 text-center text-muted text-sm">
                                                        No tickets found. Add one to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    onClick={handleAddTicketRow}
                                    className="btn-add-ticket"
                                >
                                    + Add New Ticket
                                </button>
                            </div>

                            <div className="fulfillment-checklist-card">
                                <h4 className="text-bold text-sm text-uppercase color-slate-800 mb-20">Fulfillment Checklist</h4>
                                <div className="checklist-grid-modern">
                                    {[
                                        { key: 'verifyField', label: 'Verify Field' },
                                        { key: 'noPoachInCV', label: 'No Poach in CV' },
                                        { key: 'removeNoPoach', label: 'Remove No Poach' },
                                        { key: 'readyToMove', label: 'Ready to Move' },
                                        { key: 'vehicle', label: 'Vehicle' },
                                        { key: 'graduation', label: 'Graduation' },
                                        { key: 'degreeCertificate', label: 'Degree Certificate' },
                                        { key: 'rehiring', label: 'Rehiring' }
                                    ].map(item => (
                                        <div key={item.key} className="checklist-item-modern">
                                            <span className="text-sm text-semibold color-slate-600 mb-12 d-block">{item.label}</span>
                                            <div className="radio-group-modern flex-align-center gap-20">
                                                {['Yes', 'No'].map(opt => (
                                                    <label key={opt} className="flex-align-center gap-8 cursor-pointer text-sm text-muted">
                                                        <input
                                                            type="radio"
                                                            name={item.key}
                                                            value={opt}
                                                            checked={checklistForm[item.key] === opt}
                                                            onChange={(e) => setChecklistForm({ ...checklistForm, [item.key]: e.target.value })}
                                                            className="radio-input-modern"
                                                        /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="operation-remark-container">
                                    <label className="text-xs text-bold text-muted text-uppercase mb-8 d-block">Operation Remark</label>
                                    <RichTextEditor
                                        value={operationRemark}
                                        onChange={(val) => setOperationRemark(val)}
                                        placeholder="Add any operational notes here..."
                                        users={users}
                                        candidateName={candidate.name}
                                    />
                                </div>
                                <div className="flex-justify-end mt-32">
                                    <button className="btn-primary-blue px-32 py-12" onClick={async () => {
                                        try {
                                            const updateData = {
                                                tickets: candidate.tickets,
                                                fulfillmentChecklist: checklistForm,
                                                operationRemark: operationRemark,
                                                companyMulti: ticketForm.companyMulti,
                                                dateFiled: ticketForm.dateFiled
                                            };
                                            await api.updateCandidate(candidateId, updateData);

                                            setCandidate((prev: any) => ({
                                                ...prev,
                                                ...updateData
                                            }));

                                            showToast('Operations data saved successfully', 'success');
                                        } catch (error: unknown) {
                                            console.error('Save operations error:', error);
                                            showToast('Failed to save operations data', 'error');
                                        }
                                    }}>Save Operations Data</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeBottomTab === 'Questions' && (
                        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', marginTop: '16px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <InfoIcon size={40} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Questions</h3>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>No screening questions recorded for this candidate.</p>
                        </div>
                    )}

                    {activeBottomTab === 'Related Emails' && (
                        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', marginTop: '16px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <MailIcon size={40} color="#94a3b8" />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Related Emails</h3>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>No related correspondence found in the system.</p>
                        </div>
                    )}

                    {activeBottomTab === 'Files' && (
                        <div style={{ marginTop: '24px' }}>
                            <div className="files-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <h3 className="section-title">Candidate Documents</h3>
                                    <p className="section-subtitle">Manage and view all documents associated with this candidate profile.</p>
                                </div>
                                <div className="view-toggle-pills">
                                    <button
                                        className={`pill-btn ${!isCodeView ? 'active' : ''}`}
                                        onClick={() => setIsCodeView(false)}
                                    >
                                        <ListIcon size={14} />
                                        Grid View
                                    </button>
                                    <button
                                        className={`pill-btn ${isCodeView ? 'active' : ''}`}
                                        onClick={() => setIsCodeView(true)}
                                    >
                                        <SparklesIcon size={14} />
                                        JSON View
                                    </button>
                                </div>
                            </div>

                            {isCodeView ? (
                                <div className="json-payload-view">
                                    <div className="json-header">
                                        <span>PAYLOAD SHAPE (DEBUG)</span>
                                        <button className="copy-json-btn" onClick={() => handleCopyLink(JSON.stringify(candidate, null, 2), 'Candidate JSON')}>
                                            <CopyIcon size={14} />
                                            Copy JSON
                                        </button>
                                    </div>
                                    <pre className="json-pre">
                                        <code>{JSON.stringify({
                                            source: "Naukri",
                                            importedAt: candidate.createdAt || new Date().toISOString(),
                                            owner: candidate.assignedTo || "Unassigned",
                                            page: {
                                                url: window.location.href,
                                                title: document.title
                                            },
                                            candidate: candidate
                                        }, null, 2)}</code>
                                    </pre>
                                </div>
                            ) : (
                                <div className="files-grid-modern">
                                    {[
                                        { id: 'resume', name: 'Resume', file: candidate.resume, type: 'PDF', required: true },
                                        { id: 'photograph', name: 'Photograph', file: candidate.photograph, type: 'IMG', required: true },
                                        { id: 'panCard', name: 'PAN Card', file: candidate.panCard, type: 'PDF', required: true },
                                        { id: 'aadhaarCard', name: 'Aadhaar Card', file: candidate.aadhaarCard, type: 'PDF', required: true },
                                        { id: 'educationProof', name: 'Education Proof', file: candidate.educationProof, type: 'PDF', required: false },
                                        { id: 'offerLetter', name: 'Offer Letter', file: candidate.offerLetter, type: 'PDF', required: false },
                                        { id: 'salarySlip', name: 'Salary Slip', file: candidate.salarySlip, type: 'PDF', required: false },
                                        { id: 'experienceLetter', name: 'Experience Letter', file: (candidate as any).experienceLetter, type: 'PDF', required: false },
                                        { id: 'voterId', name: 'Voter ID', file: (candidate as any).voterId, type: 'PDF', required: false }
                                    ].map((f, idx) => {
                                        const fileUrl = f.file ? `${BASE_URL}/uploads/${f.file}` : '';
                                        return (
                                            <div key={idx} className={`file-card-modern ${!f.file ? 'empty' : ''}`}>
                                                <div className="file-card-main">
                                                    <div className="file-type-icon">
                                                        {f.type === 'IMG' ? (
                                                            <UserIcon size={24} className="icon-pink" />
                                                        ) : (
                                                            <FileTextIcon size={24} className="icon-blue" />
                                                        )}
                                                        {f.file && <div className="status-dot online"></div>}
                                                    </div>
                                                    <div className="file-details">
                                                        <div className="file-name-row">
                                                            <span className="file-display-name">{f.name}</span>
                                                            {f.required && !f.file && <span className="required-tag">Required</span>}
                                                        </div>
                                                        <span className="file-status-text">
                                                            {f.file ? `${f.type} • Verified` : 'Missing Document'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="file-card-actions">
                                                    {f.file ? (
                                                        <>
                                                            <button
                                                                className="file-action-btn view"
                                                                title="Preview Document"
                                                                onClick={() => {
                                                                    setPreviewFile({ url: fileUrl, name: f.name });
                                                                    setIsPreviewOpen(true);
                                                                }}
                                                            >
                                                                <EyeIcon size={16} />
                                                                <span>View</span>
                                                            </button>
                                                            <button
                                                                className="file-action-btn download"
                                                                title="Copy direct link"
                                                                onClick={() => handleCopyLink(`${BASE_URL}/uploads/${f.file}`, f.name)}
                                                            >
                                                                <PinIcon size={16} />
                                                                <span>Link</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            className="file-action-btn upload"
                                                            onClick={() => setIsEditCandidateModalOpen(true)}
                                                        >
                                                            <PlusIcon size={16} />
                                                            <span>Upload</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Sidebar Area */}
                <div className="sidebar-activity-portal">
                    <div className="activity-top-actions">
                        <button className={`activity-action-btn ${activeActivityModal === 'Note' ? 'active' : ''}`} onClick={() => handleTabClick('Note')}>
                            <FileTextIcon size={16} /> Note
                        </button>
                        <button className={`activity-action-btn ${activeActivityModal === 'Call' ? 'active' : ''}`} onClick={() => handleTabClick('Call')}>
                            <PhoneIcon size={16} /> Call Log
                        </button>
                        <button className={`activity-action-btn ${activeActivityModal === 'Interview' ? 'active' : ''}`} onClick={() => handleTabClick('Interview')}>
                            <CalendarIcon size={16} /> Schedule
                        </button>
                    </div>

                    <div className="activity-sub-tabs">
                        <div
                            className={`sub-tab ${activeSubTab === 'All' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('All')}
                        >
                            All <span className="sub-tab-count">{activityCounts.All}</span>
                        </div>
                        <div
                            className={`sub-tab ${activeSubTab === 'Notes&Calls' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('Notes&Calls')}
                        >
                            Notes & Calls <span className="sub-tab-count">{activityCounts['Notes&Calls']}</span>
                        </div>
                        <div
                            className={`sub-tab ${activeSubTab === 'Interviews' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('Interviews')}
                        >
                            Interviews <span className="sub-tab-count">{activityCounts.Interviews}</span>
                        </div>
                    </div>

                    <div className="sidebar-search-row">
                        <div className="search-input-wrapper">
                            <SearchIcon size={16} className="search-icon-left" />
                            <input
                                type="text"
                                className="activity-search-input"
                                placeholder="Search activity, notes, files..."
                                value={searchActivity}
                                onChange={(e) => setSearchActivity(e.target.value)}
                            />
                            {searchActivity && (
                                <button className="search-clear-btn" onClick={() => setSearchActivity('')}>
                                    <XIcon size={14} />
                                </button>
                            )}
                        </div>
                        <div className="filter-actions-group">
                            <button className={`filter-toggle-pill ${isFilterPopoverOpen ? 'active' : ''}`} onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}>
                                <FilterIcon size={14} />
                                <span>Filters</span>
                                {activityTypeFilter.length < 5 && <span className="filter-badge">{activityTypeFilter.length}</span>}
                            </button>
                            {isFilterPopoverOpen && (
                                <div className="activity-filter-popover-modern">
                                    <div className="popover-header">
                                        <h4>Filter Activity</h4>
                                        <button onClick={() => setIsFilterPopoverOpen(false)}><XIcon size={16} /></button>
                                    </div>
                                    <div className="popover-body">
                                        <div className="filter-group">
                                            <label className="filter-label">Activity Type</label>
                                            <div className="filter-options-grid">
                                                {['Note', 'Call', 'Interview', 'To Do', 'Interview Feedback'].map(type => (
                                                    <label key={type} className="custom-checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={activityTypeFilter.includes(type)}
                                                            onChange={() => toggleTypeFilter(type)}
                                                        />
                                                        <span className="checkbox-box"></span>
                                                        <span className="checkbox-label">{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="popover-footer">
                                        <button className="reset-btn" onClick={() => setActivityTypeFilter(['Note', 'Call', 'Interview', 'To Do', 'Interview Feedback'])}>Reset All</button>
                                        <button className="apply-btn" onClick={() => setIsFilterPopoverOpen(false)}>Done</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="activity-feed-container">

                        {activeActivityModal && (
                            <div className="activity-drawer-overlay">
                                <div className="activity-drawer-header">
                                    <h3>{activeActivityModal === 'EditProfile' ? 'Edit Profile' : `Add ${activeActivityModal}`}</h3>
                                    <div className="nav-icon-btn" onClick={() => setActiveActivityModal(null)}><XIcon size={20} /></div>
                                </div>
                                <div className="activity-drawer-body">
                                    {(activeActivityModal === 'Note') && (
                                        <>
                                            <div className="form-field-group">
                                                <label>Note Content *</label>
                                                <RichTextEditor
                                                    value={activityForm.note}
                                                    onChange={(val) => handleFormChange('note', val)}
                                                    placeholder="Write your note here..."
                                                    users={users}
                                                    candidateName={candidate.name}
                                                />
                                            </div>
                                            <div className="form-field-group">
                                                <label>Select Note Type</label>
                                                <select
                                                    value={activityForm.noteType}
                                                    onChange={(e) => handleFormChange('noteType', e.target.value)}
                                                >
                                                    <option>Note</option>
                                                    <option>Call</option>
                                                    <option>To Do</option>
                                                    <option>Interview Feedback</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={followUpTaskChecked}
                                                            onChange={(e) => {
                                                                setFollowUpTaskChecked(e.target.checked);
                                                                if (e.target.checked) setShowFollowUpPopup(true);
                                                            }}
                                                        />
                                                        Create a follow up task
                                                    </label>

                                                    {showFollowUpPopup && followUpTaskChecked && (
                                                        <div className="follow-up-popup">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: '700', fontSize: '13px' }}>Create a follow up task</span>
                                                                <div className="toolbar-btn" onClick={() => setShowFollowUpPopup(false)}><XIcon size={14} /></div>
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Select Task Type</label>
                                                                <select
                                                                    value={followUpTaskForm.type}
                                                                    onChange={(e) => setFollowUpTaskForm({ ...followUpTaskForm, type: e.target.value })}
                                                                >
                                                                    <option>Follow Up</option>
                                                                    <option>Meeting</option>
                                                                    <option>Call</option>
                                                                </select>
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Select Date for Follow up task</label>
                                                                <select
                                                                    value={followUpTaskForm.dueDate}
                                                                    onChange={(e) => setFollowUpTaskForm({ ...followUpTaskForm, dueDate: e.target.value })}
                                                                >
                                                                    <option>Tomorrow</option>
                                                                    <option>in 3 Business Days</option>
                                                                </select>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                                                <button className="btn-white" style={{ padding: '6px 12px' }} onClick={() => setFollowUpTaskChecked(false)}>Reset</button>
                                                                <button className="btn-mint" style={{ padding: '6px 16px' }} onClick={() => setShowFollowUpPopup(false)}>Apply</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeActivityModal === 'Call' && (
                                        <>
                                            <div className="call-log-grid">
                                                <div className="form-field-group">
                                                    <label>Call Direction</label>
                                                    <select
                                                        value={activityForm.callDirection}
                                                        onChange={(e) => handleFormChange('callDirection', e.target.value)}
                                                    >
                                                        <option>Outgoing call</option>
                                                        <option>Incoming call</option>
                                                    </select>
                                                </div>
                                                <div className="form-field-group">
                                                    <label>Call Type</label>
                                                    <select
                                                        value={activityForm.callType}
                                                        onChange={(e) => handleFormChange('callType', e.target.value)}
                                                    >
                                                        <option>Select Call Type</option>
                                                        <option>Discovery Call</option>
                                                        <option>Follow Up</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="call-log-grid">
                                                <div className="form-field-group">
                                                    <label>Related To</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="text" defaultValue={candidate.name} />
                                                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}><XIcon size={14} /></div>
                                                    </div>
                                                </div>
                                                <div className="form-field-group">
                                                    <label>Call Duration</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="HH : MM : SS"
                                                            value={activityForm.callDuration}
                                                            onChange={(e) => handleFormChange('callDuration', e.target.value)}
                                                        />
                                                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}><XIcon size={14} /></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="call-log-grid">
                                                <div className="form-field-group">
                                                    <label>Starting</label>
                                                    <div className="flex-row-gap">
                                                        <input
                                                            type="date"
                                                            value={activityForm.callDate}
                                                            onChange={(e) => handleFormChange('callDate', e.target.value)}
                                                            style={{ flex: 1 }}
                                                        />
                                                        <IntervalTimePicker
                                                            value={activityForm.callTime}
                                                            onChange={(val) => handleFormChange('callTime', val)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-field-group">
                                                    <label>Contact Number</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <input type="text" defaultValue={candidate.phone || '9876543210'} />
                                                        <div style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}><XIcon size={14} /></div>
                                                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><ChevronDownIcon size={14} /></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-field-group">
                                                <label>Collaborators</label>
                                                <select><option>Select Users</option></select>
                                            </div>
                                            <div className="form-field-group">
                                                <label>Call Notes</label>
                                                <RichTextEditor
                                                    value={activityForm.note}
                                                    onChange={(val) => handleFormChange('note', val)}
                                                    placeholder="Start typing your call notes here..."
                                                />
                                            </div>

                                            <div className="form-field-group">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ margin: 0 }}>Follow-up Task</label>
                                                    <label className="switch-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={followUpTaskChecked}
                                                            onChange={(e) => {
                                                                setFollowUpTaskChecked(e.target.checked);
                                                                if (e.target.checked) setShowFollowUpPopup(true);
                                                            }}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>

                                                {showFollowUpPopup && followUpTaskChecked && (
                                                    <div className="follow-up-popup">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', fontSize: '13px' }}>Create a follow up task</span>
                                                            <div className="toolbar-btn" onClick={() => setShowFollowUpPopup(false)}><XIcon size={14} /></div>
                                                        </div>
                                                        <div className="form-field-group">
                                                            <label>Select Task Type</label>
                                                            <select
                                                                value={followUpTaskForm.type}
                                                                onChange={(e) => setFollowUpTaskForm({ ...followUpTaskForm, type: e.target.value })}
                                                            >
                                                                <option>Follow Up</option>
                                                                <option>Meeting</option>
                                                                <option>Call</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-field-group">
                                                            <label>Select Date for Follow up task</label>
                                                            <select
                                                                value={followUpTaskForm.dueDate}
                                                                onChange={(e) => setFollowUpTaskForm({ ...followUpTaskForm, dueDate: e.target.value })}
                                                            >
                                                                <option>Tomorrow</option>
                                                                <option>in 3 Business Days</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {activeActivityModal === 'Interview' && (
                                        <div className="activity-drawer-scrollable-body">
                                            <div className="form-field-group">
                                                <label>Company (Multi-select)</label>
                                                <div className="custom-multi-select-container">
                                                    <div className="multi-select-trigger" onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}>
                                                        <span className="trigger-value">
                                                            {activityForm.companyNames.length > 0
                                                                ? activityForm.companyNames.join(', ')
                                                                : 'Select Companies'}
                                                        </span>
                                                        <ChevronDownIcon size={16} />
                                                    </div>

                                                    {isCompanyDropdownOpen && (
                                                        <div className="multi-select-dropdown">
                                                            <div className="dropdown-search">
                                                                <button className="text-link-button" onClick={() => handleMultiSelectChange(uniqueOpenCompanies)}>Select All</button>
                                                            </div>
                                                            <div className="dropdown-options">
                                                                {uniqueOpenCompanies.map((company: string) => {
                                                                    const isSelected = activityForm.companyNames.includes(company);
                                                                    return (
                                                                        <div
                                                                            key={company}
                                                                            className={`multi-option-item ${isSelected ? 'selected' : ''}`}
                                                                            onClick={() => {
                                                                                const current = [...activityForm.companyNames];
                                                                                if (isSelected) {
                                                                                    handleMultiSelectChange(current.filter(c => c !== company));
                                                                                } else {
                                                                                    handleMultiSelectChange([...current, company]);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span>{company}</span>
                                                                            {isSelected && <CheckIcon size={14} />}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="ai-suggestions-section">
                                                    <div className="ai-suggestion-header">
                                                        <span className="ai-sparkle-text">
                                                            <SparklesIcon size={12} /> AI Suggestions
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                className={`ai-action-btn ${aiLoading ? 'opacity-50' : ''}`}
                                                                onClick={() => handleAiCompanySuggestions('global')}
                                                                disabled={aiLoading}
                                                            >
                                                                {aiLoading ? '...' : 'Global'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`ai-action-btn ${aiLoading ? 'opacity-50' : ''}`}
                                                                onClick={() => handleAiCompanySuggestions('openJobs')}
                                                                disabled={aiLoading}
                                                            >
                                                                {aiLoading ? '...' : 'Open Jobs'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {aiSuggestions.length > 0 && (
                                                        <div className="ai-suggestion-badges">
                                                            {aiSuggestions.map(s => (
                                                                <span
                                                                    key={s}
                                                                    className={`ai-badge ${activityForm.companyNames.includes(s) ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        const current = [...activityForm.companyNames];
                                                                        if (activityForm.companyNames.includes(s)) {
                                                                            handleMultiSelectChange(current.filter(c => c !== s));
                                                                        } else {
                                                                            handleMultiSelectChange([...current, s]);
                                                                        }
                                                                    }}
                                                                >
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {activityForm.companyNames.length > 0 && (
                                                <div className="accordion-utilities-row">
                                                    <button
                                                        type="button"
                                                        className="text-link-button"
                                                        onClick={() => setExpandedAccordions(activityForm.companyNames)}
                                                    >
                                                        Expand All
                                                    </button>
                                                    <span className="divider">|</span>
                                                    <button
                                                        type="button"
                                                        className="text-link-button"
                                                        onClick={() => setExpandedAccordions([])}
                                                    >
                                                        Collapse All
                                                    </button>
                                                </div>
                                            )}

                                            {activityForm.companyNames.map((company: string) => {
                                                const detail = activityForm.perCompanyDetails[company] || {};
                                                const isExpanded = expandedAccordions.includes(company);
                                                const hasValidTicket = (candidate.tickets || []).some((t: any) =>
                                                    t.companyName?.toLowerCase().trim() === company.toLowerCase().trim() && t.ticketNo?.trim()
                                                );

                                                return (
                                                    <div key={company} className={`company-accordion-card ${!hasValidTicket ? 'disabled-accordion' : ''}`}>
                                                        <div
                                                            className="accordion-header"
                                                            onClick={() => {
                                                                if (!hasValidTicket) return;
                                                                setExpandedAccordions(prev =>
                                                                    prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
                                                                )
                                                            }}
                                                        >
                                                            <div className="header-left">
                                                                <ListIcon size={14} />
                                                                <span className="company-title">{company}</span>
                                                            </div>
                                                            {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="accordion-content">
                                                                <div className="accordion-field-grid">
                                                                    <div className="form-field-group">
                                                                        <label>Interview Date *</label>
                                                                        <CustomDatePicker
                                                                            value={detail.date || activityForm.interviewDate}
                                                                            onChange={(val) => handleDetailChange(company, 'date', val)}
                                                                        />
                                                                    </div>
                                                                    <div className="form-field-group">
                                                                        <label>Interview Time *</label>
                                                                        <IntervalTimePicker
                                                                            value={detail.time || activityForm.interviewTime}
                                                                            onChange={(val) => handleDetailChange(company, 'time', val)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="form-field-group" style={{ marginTop: '16px' }}>
                                                                    <label>Interview Mode</label>
                                                                    <div className="radio-group-horizontal modern">
                                                                        {['Face to Face', 'Phone', 'Video'].map(mode => (
                                                                            <label key={mode} className="radio-option">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`mode-${company}`}
                                                                                    value={mode}
                                                                                    checked={(detail.mode || activityForm.interviewMode) === mode}
                                                                                    onChange={(e) => handleDetailChange(company, 'mode', e.target.value)}
                                                                                /> {mode}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="accordion-field-grid" style={{ marginTop: '16px' }}>
                                                                    <div className="form-field-group">
                                                                        <label>Interview Stage</label>
                                                                        <select
                                                                            value={detail.stage || activityForm.interviewStage}
                                                                            onChange={(e) => handleDetailChange(company, 'stage', e.target.value)}
                                                                            className="accordion-select"
                                                                        >
                                                                            {INTERVIEW_STAGES.map(s => <option key={s}>{s}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div className="form-field-group">
                                                                        <label>Initial Status</label>
                                                                        <select
                                                                            value={detail.status || 'Pending'}
                                                                            onChange={(e) => handleDetailChange(company, 'status', e.target.value)}
                                                                            style={{ color: '#2563eb', fontWeight: '600' }}
                                                                            className="accordion-select"
                                                                        >
                                                                            <option>Pending</option>
                                                                            <option>Scheduled</option>
                                                                            <option>Completed</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="accordion-field-grid" style={{ marginTop: '16px' }}>
                                                                    <div className="form-field-group">
                                                                        <label>Offers Extended?</label>
                                                                        <select
                                                                            value={detail.offers || 'No'}
                                                                            onChange={(e) => handleDetailChange(company, 'offers', e.target.value)}
                                                                            className="accordion-select"
                                                                        >
                                                                            <option>No</option>
                                                                            <option>Yes</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="form-field-group">
                                                                        <label>Shortlisted?</label>
                                                                        <select
                                                                            value={detail.shortlisted || 'No'}
                                                                            onChange={(e) => handleDetailChange(company, 'shortlisted', e.target.value)}
                                                                            className="accordion-select"
                                                                        >
                                                                            <option>No</option>
                                                                            <option>Yes</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <div className="form-field-group" style={{ marginBottom: '24px' }}>
                                                <label>Feedback / Remark</label>
                                                <RichTextEditor
                                                    value={activityForm.note}
                                                    onChange={(val) => handleFormChange('note', val)}
                                                    placeholder="Enter any general feedback or internal remarks for this set of interviews..."
                                                    users={users}
                                                    candidateName={candidate.name}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeActivityModal === 'EditProfile' && (
                                        <>
                                            <div className="range-picker-row">
                                                <div className="form-field-group">
                                                    <label>First Name</label>
                                                    <input type="text" defaultValue={candidate.firstName} />
                                                </div>
                                                <div className="form-field-group">
                                                    <label>Last Name</label>
                                                    <input type="text" defaultValue={candidate.lastName} />
                                                </div>
                                            </div>
                                            <div className="form-field-group">
                                                <label>Email Address</label>
                                                <input type="email" defaultValue={candidate.email} />
                                            </div>
                                            <div className="form-field-group">
                                                <label>Phone Number</label>
                                                <input type="text" defaultValue={candidate.phone} />
                                            </div>
                                            <div className="form-field-group">
                                                <label>Location</label>
                                                <input type="text" defaultValue={candidate.location} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="activity-drawer-footer">
                                    <button className="btn-white" onClick={() => setActiveActivityModal(null)}>Close</button>
                                    <button className="btn-mint" onClick={handleSaveActivity}>Add {activeActivityModal}</button>
                                </div>
                            </div>
                        )}

                        <div className="activity-stream">
                            {activityLoading ? (
                                <div className="p-20 text-center text-muted">Loading feed...</div>
                            ) : filteredActivities.length > 0 ? (
                                filteredActivities.map(activity => {
                                    const isRejected = activity.type === 'Interview' && activity.status === 'Rejected';
                                    const isFollowUp = activity.type === 'Note' && (
                                        activity.title?.toLowerCase().includes('follow up') ||
                                        activity.content?.toLowerCase().includes('follow up') ||
                                        activity.status?.toLowerCase().includes('task') ||
                                        activity.status?.toLowerCase().includes('to do')
                                    );

                                    // Dynamic Card Border Class
                                    let cardBorderClass = 'activity-card-note-general';
                                    if (activity.type === 'Interview') {
                                        cardBorderClass = isRejected ? 'activity-card-interview-rejected' : 'activity-card-interview-shortlisted';
                                    } else if (activity.type === 'Call') {
                                        cardBorderClass = 'activity-card-call';
                                    } else if (isFollowUp) {
                                        cardBorderClass = 'activity-card-note-followup';
                                    }

                                    // Dynamic Circle Container Icon & Color
                                    let iconContainer = null;
                                    let activityHeaderLabel = 'NOTE';
                                    if (activity.type === 'Interview') {
                                        activityHeaderLabel = 'INTERVIEW';
                                        iconContainer = (
                                            <div className="activity-icon-container interview">
                                                <CalendarIcon size={16} color="#8b5cf6" />
                                            </div>
                                        );
                                    } else if (activity.type === 'Call') {
                                        activityHeaderLabel = 'CALL LOG';
                                        iconContainer = (
                                            <div className="activity-icon-container call">
                                                <PhoneIcon size={16} color="#10b981" />
                                            </div>
                                        );
                                    } else if (isFollowUp) {
                                        activityHeaderLabel = 'NOTE';
                                        iconContainer = (
                                            <div className="activity-icon-container note-followup">
                                                <UserClockIcon size={16} color="#8b5cf6" />
                                            </div>
                                        );
                                    } else {
                                        activityHeaderLabel = 'NOTE';
                                        iconContainer = (
                                            <div className="activity-icon-container note-general">
                                                <FileTextIcon size={16} color="#0284c7" />
                                            </div>
                                        );
                                    }

                                    // Dynamic Bottom Avatar & Text style
                                    let avatarClass = 'user-avatar-small-orange';
                                    if (activity.type === 'Interview') {
                                        avatarClass = isRejected ? 'user-avatar-small-grey' : 'user-avatar-small-blue';
                                    } else if (activity.type === 'Call') {
                                        avatarClass = 'user-avatar-small-green';
                                    } else if (isFollowUp) {
                                        avatarClass = 'user-avatar-small-purple';
                                    }

                                    return (
                                        <div key={activity.id} className={`refined-activity-card ${activity.isPinned ? 'pinned' : ''} ${cardBorderClass}`} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            {/* Card Header (Mockup Design) */}
                                            <div className="activity-card-header" style={{ padding: '1rem 1rem 0', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    {iconContainer}
                                                    <div className="activity-type-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span className="activity-type-label" style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                                                            {activityHeaderLabel}
                                                        </span>
                                                        <span className="activity-subtype-label" style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                                            {isFollowUp && activity.title === 'General Note' ? 'Follow Up' : activity.title}
                                                        </span>
                                                    </div>
                                                    {activity.isPinned && <PinIcon size={12} className="pinned-icon" />}
                                                </div>
                                                <div className="activity-card-actions">
                                                    <div className="dropdown">
                                                        <button className="action-menu-trigger-circular">
                                                            <MoreVerticalIcon size={14} />
                                                        </button>
                                                        <div className="dropdown-content">
                                                            <a onClick={() => handlePinActivity(activity.id, activity.type, activity.isPinned)}>
                                                                <PinIcon size={14} /> {activity.isPinned ? 'Unpin' : 'Pin to top'}
                                                            </a>
                                                            <a onClick={() => handleEditActivity(activity)}>
                                                                <EditIcon size={14} /> Edit {activity.type}
                                                            </a>
                                                            <a onClick={() => handleDeleteActivity(activity.id, activity.type)} className="delete-action">
                                                                <TrashIcon size={14} /> Delete
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Divider (Mockup Design) */}
                                            <div style={{ borderBottom: '1px solid #f1f5f9', width: '100%' }}></div>

                                            {/* Card Body (Mockup Design) */}
                                            {activity.type === 'Interview' ? (
                                                <>
                                                    <div className="refined-activity-content" style={{ padding: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {/* Video/Phone Badge */}
                                                                <div>
                                                                    <span className="meta-tag-badge">{activity.status === 'Completed' ? 'Interview Done' : activity.mode}</span>
                                                                </div>
                                                                {/* Location/Company Details */}
                                                                <div style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                                    At {activity.companyName} via {activity.mode}
                                                                </div>
                                                            </div>

                                                            {/* Right Side Info: Date, Time and Creator */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                                                    {safeFormatDate(activity.date)}, {activity.time}
                                                                </span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div className={avatarClass}>
                                                                        {getCreatorName(activity.createdBy).charAt(0) || 'U'}
                                                                    </div>
                                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                                                                        {getCreatorName(activity.createdBy)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Stepper block */}
                                                        {expandedInterviewStages.includes(activity.id) && (
                                                            <div className="interview-stage-vertical-stepper" style={{ marginTop: '8px', padding: '16px' }}>
                                                                {INTERVIEW_STAGES.map((stage, idx) => {
                                                                    const currentStage = activity.stage || 'Applied';
                                                                    const currentIdx = INTERVIEW_STAGES.indexOf(currentStage);
                                                                    const isRejected = activity.status === 'Rejected';

                                                                    const isPast = idx < currentIdx;
                                                                    const isCurrent = idx === currentIdx;
                                                                    const isFuture = idx > currentIdx;
                                                                    const isDisabled = isRejected && isFuture;

                                                                    const stageHistory = activity.stageHistory || {};
                                                                    const stageTimestamp = stageHistory[stage] || ((isPast || (isCurrent && !isRejected)) ? (activity.date ? (() => {
                                                                        const d = new Date(activity.date);
                                                                        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
                                                                    })() : '') : '');
                                                                    const isCompleted = !!stageTimestamp || isPast;

                                                                    // Semantic Color Logic
                                                                    let stageColor = '#9CA3AF'; // Default gray
                                                                    if (isCurrent) {
                                                                        stageColor = isRejected ? '#ef4444' : '#2563EB'; // Red if rejected, Blue if current
                                                                    } else if (isCompleted) {
                                                                        stageColor = '#10B981'; // Green
                                                                    } else if (isDisabled) {
                                                                        stageColor = '#f1f5f9'; // Very light gray for disabled
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={stage}
                                                                            className={`vertical-stepper-step ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''} ${isDisabled ? 'disabled' : ''} ${isRejected && isCurrent ? 'rejected' : ''}`}
                                                                            onClick={() => !isDisabled && handleUpdateInterviewStage(activity.id, stage)}
                                                                            style={{
                                                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                                opacity: isDisabled ? 0.5 : 1
                                                                            }}
                                                                        >
                                                                            <div className="vertical-step-indicator">
                                                                                <div
                                                                                    className="vertical-step-circle"
                                                                                    style={{
                                                                                        backgroundColor: stageColor,
                                                                                        borderColor: stageColor,
                                                                                        color: 'white',
                                                                                        borderWidth: '2px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        width: '24px',
                                                                                        height: '24px',
                                                                                        borderRadius: '50%',
                                                                                        fontSize: '10px',
                                                                                        fontWeight: '700',
                                                                                        transition: 'all 0.2s ease',
                                                                                        boxShadow: isCurrent && !isRejected ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
                                                                                    }}
                                                                                >
                                                                                    {isRejected && isCurrent ? (
                                                                                        <XIcon size={12} />
                                                                                    ) : (isCompleted ? <CheckIcon size={12} /> : (idx + 1))}
                                                                                </div>
                                                                                {idx < INTERVIEW_STAGES.length - 1 && (
                                                                                    <div
                                                                                        className="vertical-step-line"
                                                                                        style={{ backgroundColor: isCompleted ? '#10B981' : '#e2e8f0' }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <div className="vertical-step-content gap-12" style={{ flex: 1 }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                                                    <span
                                                                                        className="vertical-step-label"
                                                                                        style={{
                                                                                            color: isDisabled ? '#94a3b8' : ((isCompleted || isCurrent) ? '#1e293b' : '#64748b'),
                                                                                            fontWeight: (isCurrent || isCompleted) ? '600' : '400',
                                                                                            textDecoration: isDisabled ? 'line-through' : 'none',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '8px'
                                                                                        }}
                                                                                    >
                                                                                        {stage}
                                                                                        {stage === 'Document Pre-offer' && !isDisabled && (
                                                                                            <div
                                                                                                className="nav-icon-btn"
                                                                                                style={{ width: '20px', height: '20px', padding: 0 }}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setIsOnboardingModalOpen(true);
                                                                                                }}
                                                                                            >
                                                                                                <SettingsIcon size={12} />
                                                                                            </div>
                                                                                        )}
                                                                                    </span>

                                                                                    {isCurrent && !isRejected && stage !== 'Selected' && (
                                                                                        <button
                                                                                            className="reject-stage-btn"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleRejectInterviewStage(activity.id, stage);
                                                                                            }}
                                                                                            style={{
                                                                                                padding: '2px 8px',
                                                                                                fontSize: '10px',
                                                                                                borderRadius: '4px',
                                                                                                background: '#fee2e2',
                                                                                                color: '#ef4444',
                                                                                                border: '1px solid #fecaca',
                                                                                                cursor: 'pointer',
                                                                                                fontWeight: '600'
                                                                                            }}
                                                                                        >
                                                                                            Reject
                                                                                        </button>
                                                                                    )}

                                                                                    {isCurrent && !isRejected && stage === 'Selected' && (
                                                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                                                            <button
                                                                                                className="accept-candidate-btn"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleCandidateDecision(activity.id, 'Accepted');
                                                                                                }}
                                                                                                style={{
                                                                                                    padding: '2px 8px',
                                                                                                    fontSize: '10px',
                                                                                                    borderRadius: '4px',
                                                                                                    background: '#dcfce7',
                                                                                                    color: '#15803d',
                                                                                                    border: '1px solid #bbf7d0',
                                                                                                    cursor: 'pointer',
                                                                                                    fontWeight: '600'
                                                                                                }}
                                                                                            >
                                                                                                Accept by Candidate
                                                                                            </button>
                                                                                            <button
                                                                                                className="reject-candidate-btn"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleCandidateDecision(activity.id, 'Rejected');
                                                                                                }}
                                                                                                style={{
                                                                                                    padding: '2px 8px',
                                                                                                    fontSize: '10px',
                                                                                                    borderRadius: '4px',
                                                                                                    background: '#fee2e2',
                                                                                                    color: '#ef4444',
                                                                                                    border: '1px solid #fecaca',
                                                                                                    cursor: 'pointer',
                                                                                                    fontWeight: '600'
                                                                                                }}
                                                                                            >
                                                                                                Reject by Candidate
                                                                                            </button>
                                                                                        </div>
                                                                                    )}

                                                                                    {isRejected && isCurrent && (
                                                                                        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase' }}>
                                                                                            {activity.feedback === 'Rejected by Candidate' ? 'Rejected by Candidate' : 'Rejected'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {stageTimestamp && (
                                                                                    <span className="vertical-step-timestamp m-0 whitespace-nowrap">
                                                                                        {stageTimestamp}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Collapsible Bar */}
                                                    <div
                                                        className="stage-toggle-banner-bottom"
                                                        onClick={() => toggleInterviewStage(activity.id)}
                                                    >
                                                        {isRejected ? (
                                                            <span className="interview-bottom-status-badge rejected">Rejected</span>
                                                        ) : (
                                                            <span className="interview-bottom-status-badge shortlisted">Shortlisted</span>
                                                        )}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>{expandedInterviewStages.includes(activity.id) ? 'Hide Interview Stage' : 'Show Interview Stage'}</span>
                                                            <ChevronDownIcon size={14} className={`chevron-rotated ${expandedInterviewStages.includes(activity.id) ? 'active' : ''}`} />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="refined-activity-content" style={{ padding: '20px 20px', margin: 0 }}>
                                                        {isFollowUp && (
                                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
                                                                Follow up task : <span style={{ color: '#475569' }}>in 3 Business Days</span>
                                                            </div>
                                                        )}

                                                        {activity.type === 'Call' ? (
                                                            <div className="call-info-columns" style={{ display: 'flex', gap: '40px', margin: '0 0 12px 0' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Type</span>
                                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{activity.callType || 'Follow UP'}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Duration</span>
                                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{activity.duration ? `${Math.floor(activity.duration / 60).toString().padStart(2, '0')}:${(activity.duration % 60).toString().padStart(2, '0')} min` : '03:00 min'}</span>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <div className="activity-body-text" dangerouslySetInnerHTML={{ __html: activity.content || '' }} />

                                                        {activity.type === 'Call' && activity.callDirection && !activity.content && (
                                                            <div className="activity-meta-tags" style={{ marginTop: '12px' }}>
                                                                <span className="meta-tag"><PhoneIcon size={10} /> {activity.callDirection}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Attribution Banner (Cream / Yellow / Purple / Green) */}
                                                    <div className="attribution-banner-bottom">
                                                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>
                                                            {safeFormatFullDate(activity.date)}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div className={avatarClass}>
                                                                {getCreatorName(activity.createdBy).charAt(0) || 'U'}
                                                            </div>
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                                                                {getCreatorName(activity.createdBy)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="activity-empty-state">
                                    <div className="empty-illustration-premium">
                                        <div className="empty-circle-bg">
                                            <InboxIcon size={48} color="#94a3b8" />
                                        </div>
                                    </div>
                                    <h3>No activities yet</h3>
                                    <p>Start by adding a note, logging a call or scheduling an interview for this candidate.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Work Experience Modal Overlay */}
                {isWorkModalOpen && (
                    <div className="modal-overlay">
                        <div className="candidate-modal-container">
                            <div className="modal-header">
                                <h2>Add Work Experience</h2>
                                <div className="nav-icon-btn" onClick={() => setIsWorkModalOpen(false)}><XIcon size={20} /></div>
                            </div>
                            <div className="modal-body">
                                <div className="form-field-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        placeholder="Paper Sales Executive"
                                        value={workForm.title}
                                        onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-field-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="Dunder Muffin"
                                        value={workForm.companyName}
                                        onChange={(e) => setWorkForm({ ...workForm, companyName: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Employment Type</label>
                                        <select
                                            value={workForm.employmentType}
                                            onChange={(e) => setWorkForm({ ...workForm, employmentType: e.target.value })}
                                        >
                                            <option>Please Select</option>
                                            <option>Full Time</option>
                                            <option>Part Time</option>
                                            <option>Contract</option>
                                            <option>Internship</option>
                                            <option>Freelance</option>
                                        </select>
                                    </div>
                                    <div className="form-field-group">
                                        <label>Industry Type</label>
                                        <select
                                            value={(workForm as any).industryType || 'Please Select'}
                                            onChange={(e) => setWorkForm({ ...workForm, industryType: e.target.value } as any)}
                                        >
                                            <option>Please Select</option>
                                            {industryTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Location"
                                            value={workForm.location}
                                            onChange={(e) => setWorkForm({ ...workForm, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-field-group">
                                        <label>Salary</label>
                                        <input
                                            type="number"
                                            value={workForm.salary}
                                            onChange={(e) => setWorkForm({ ...workForm, salary: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="flex-align-center gap-12 my-12">
                                    <span className="text-sm text-semibold">Currently working in this role</span>
                                    <label className="switch-toggle">
                                        <input
                                            type="checkbox"
                                            checked={workForm.currentlyWorking}
                                            onChange={(e) => setWorkForm({ ...workForm, currentlyWorking: e.target.checked })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={workForm.startDate}
                                            onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    {!workForm.currentlyWorking && (
                                        <div className="form-field-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                value={workForm.endDate}
                                                onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="form-field-group">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="Add Description"
                                        value={workForm.description}
                                        onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-white" onClick={() => setIsWorkModalOpen(false)}>Close</button>
                                <button className="btn-primary-blue" style={{ background: '#3b82f6' }} onClick={handleSaveWorkEx}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Education History Modal Overlay */}
                {isEducationModalOpen && (
                    <div className="modal-overlay">
                        <div className="candidate-modal-container">
                            <div className="modal-header">
                                <h2>Add Education History</h2>
                                <div className="nav-icon-btn" onClick={() => setIsEducationModalOpen(false)}><XIcon size={20} /></div>
                            </div>
                            <div className="modal-body">
                                <div className="form-field-group">
                                    <label>School/College Name</label>
                                    <input
                                        type="text"
                                        placeholder="The University of Manchester"
                                        value={educationForm.schoolName}
                                        onChange={(e) => setEducationForm({ ...educationForm, schoolName: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Educational Qualification*</label>
                                        <input
                                            type="text"
                                            placeholder="Masters in Computer Application"
                                            value={educationForm.qualification}
                                            onChange={(e) => setEducationForm({ ...educationForm, qualification: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-field-group">
                                        <label>Educational Specialization</label>
                                        <input
                                            type="text"
                                            placeholder="Public Finance"
                                            value={educationForm.specialization}
                                            onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Grade</label>
                                        <input
                                            type="text"
                                            placeholder="A+"
                                            value={educationForm.grade}
                                            onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-field-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            placeholder="Pune Area, India"
                                            value={educationForm.location}
                                            onChange={(e) => setEducationForm({ ...educationForm, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-field-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={educationForm.startDate}
                                            onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-field-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            value={educationForm.endDate}
                                            onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-field-group">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="Add Description"
                                        value={educationForm.description}
                                        onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-white" onClick={() => setIsEducationModalOpen(false)}>Close</button>
                                <button className="btn-primary-blue" style={{ background: '#3b82f6' }} onClick={handleSaveEducation}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Candidate Modal Overlay */}
                {isEditCandidateModalOpen && (
                    <div className="modal-overlay z-high">
                        <div className="candidate-modal-container modal-wide">
                            <div className="modal-header">
                                <h2>Edit Candidate</h2>
                                <div className="nav-icon-btn" onClick={() => setIsEditCandidateModalOpen(false)}><XIcon size={20} /></div>
                            </div>
                            <div className="modal-body modal-body-p-12">
                                <CandidateForm
                                    candidateId={candidateId}
                                    onClose={() => {
                                        setIsEditCandidateModalOpen(false);
                                        fetchCandidateData();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <DocumentPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    fileUrl={previewFile?.url || ''}
                    fileName={previewFile?.name || ''}
                />
                {/* Onboarding Details Modal */}
                {isOnboardingModalOpen && (
                    <div className="modal-overlay">
                        <div className="candidate-modal-container onboarding-modal" style={{ maxWidth: '600px' }}>
                            <div className="modal-header" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                                        <FileTextIcon size={20} />
                                    </div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Onboarding Details</h2>
                                </div>
                                <div className="nav-icon-btn" onClick={() => setIsOnboardingModalOpen(false)}><XIcon size={20} /></div>
                            </div>
                            <div className="modal-body" style={{ padding: '24px' }}>
                                <div className="onboarding-section mb-24">
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '16px' }}>Documentation Check</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {[
                                            { label: 'PAN Card', key: 'panCard' },
                                            { label: 'Aadhaar Card', key: 'aadhaarCard' },
                                            { label: 'Education Proof', key: 'educationProof' },
                                            { label: 'Offer Letter', key: 'offerLetter' },
                                            { label: 'Relieving Letter', key: 'relativeLetter' }
                                        ].map(doc => {
                                            const isAvailable = candidate ? !!candidate[doc.key] : false;
                                            return (
                                                <div
                                                    key={doc.key}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        background: isAvailable ? '#f0fdf4' : '#f8fafc',
                                                        color: isAvailable ? '#15803d' : '#64748b',
                                                        border: `1px solid ${isAvailable ? '#bbf7d0' : '#e2e8f0'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {isAvailable && <CheckIcon size={14} />}
                                                    {doc.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div className="form-field-group">
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Offer Status</label>
                                        <select
                                            value={onboardingForm.offerStatus}
                                            onChange={(e) => setOnboardingForm({ ...onboardingForm, offerStatus: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Released">Released</option>
                                            <option value="Joined">Joined</option>
                                        </select>
                                    </div>
                                    <div className="form-field-group">
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Resign Status</label>
                                        <select
                                            value={onboardingForm.isResigned}
                                            onChange={(e) => setOnboardingForm({ ...onboardingForm, isResigned: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div className="form-field-group">
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Notice Period</label>
                                        <input
                                            type="text"
                                            placeholder="Not specified"
                                            value={onboardingForm.noticePeriod}
                                            onChange={(e) => setOnboardingForm({ ...onboardingForm, noticePeriod: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                        />
                                    </div>
                                    <div className="form-field-group">
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date of Joining</label>
                                        <input
                                            type="date"
                                            value={onboardingForm.doj}
                                            onChange={(e) => setOnboardingForm({ ...onboardingForm, doj: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button className="btn-white" onClick={() => setIsOnboardingModalOpen(false)}>Close</button>
                                <button className="btn-primary-blue" style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '600' }} onClick={handleSaveOnboarding}>Save Details</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateProfileView;
