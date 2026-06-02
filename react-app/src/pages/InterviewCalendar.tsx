import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
    PlusIcon, RefreshIcon, SearchIcon, XIcon
} from '../icons';
import { getGoogleCalendarCandidateUrl, getGoogleCalendarEmployeeUrl } from '../utils/calendarSync';
import Modal from '../components/Modal';

// Highlight searched text
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

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STAGES = ['First Round', 'Second Round', 'Third Round', 'Final Round', 'Document Pre-offer'];
const MODES = ['Video', 'Phone', 'In Person'];
const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Selected', 'Rejected', 'On Hold'];
const COLORS = [
    { value: 'blue', label: 'Blue (Party/Meeting)' },
    { value: 'violet', label: 'Violet (Multi-day/Activity)' },
    { value: 'mint', label: 'Mint (Learning/Task)' },
    { value: 'pink', label: 'Pink (Launch/Milestone)' },
    { value: 'yellow', label: 'Yellow (Framework/Study)' },
    { value: 'blue-violet', label: 'Purple-indigo (Research)' }
];

interface Track {
    slots: any[];
    events: any[];
}

const InterviewCalendar = () => {
    const { showToast } = useToast();
    const { user, activeRole } = useAuth();

    // Calendar navigation states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // API Data states
    const [interviews, setInterviews] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterJob, setFilterJob] = useState('All');
    const [filterEmployee, setFilterEmployee] = useState('All');

    // Detail Modal State
    const [selectedInterview, setSelectedInterview] = useState<any | null>(null);

    // Form Modal States
    const [showFormModal, setShowFormModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formId, setFormId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        candidateId: '',
        jobId: '',
        date: '',
        endDate: '',
        isAllDay: false,
        color: 'blue',
        mode: 'Video',
        stage: 'First Round',
        status: 'Scheduled',
        offers: 'No',
        shortlisted: 'No',
        feedback: '',
        meetingLink: ''
    });

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const canDelete = user?.role === 'Admin' || user?.role === 'Super Admin' || activeRole?.permissions?.interviews?.delete === true;

    // Fetch initial setup data
    useEffect(() => {
        fetchCalendarData();
    }, []);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const [intsData, candData, jobData] = await Promise.all([
                api.getInterviews(),
                api.getCandidates(),
                api.getJobs({ status: 'Open' }).catch(() => [])
            ]);
            setInterviews(intsData);
            setCandidates(candData);
            setJobs(jobData);
        } catch (error) {
            console.error(error);
            showToast('Failed to load interviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filters integration
    const filteredInterviews = useMemo(() => {
        return interviews.filter(int => {
            const titleVal = int.title || int.candidateId?.name || '';
            const jobVal = int.jobId?.title || '';
            const query = searchQuery.toLowerCase();
            const matchesQuery =
                !searchQuery ||
                titleVal.toLowerCase().includes(query) ||
                jobVal.toLowerCase().includes(query) ||
                int.stage?.toLowerCase().includes(query) ||
                int.mode?.toLowerCase().includes(query);

            const matchesStatus = filterStatus === 'All' || int.status === filterStatus;
            const matchesJob = filterJob === 'All' || int.jobId?._id === filterJob;
            const matchesEmployee = filterEmployee === 'All' || int.createdBy?._id === filterEmployee;

            return matchesQuery && matchesStatus && matchesJob && matchesEmployee;
        });
    }, [interviews, searchQuery, filterStatus, filterJob, filterEmployee]);

    // Monday-start 6-week calculation (exactly 42 cells)
    const calendarWeeks = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const firstDayIndex = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
        const diffToMonday = firstDayIndex === 0 ? -6 : 1 - firstDayIndex;
        const startCalendarDate = new Date(currentYear, currentMonth, 1 + diffToMonday);

        const weeks = [];
        let tempDate = new Date(startCalendarDate);

        for (let w = 0; w < 6; w++) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                weekDays.push(new Date(tempDate));
                tempDate.setDate(tempDate.getDate() + 1);
            }
            weeks.push(weekDays);
        }
        return weeks;
    }, [currentYear, currentMonth]);

    // Monday-Sunday week days based on selectedDate
    const currentWeekDays = useMemo(() => {
        const dayIndex = selectedDate.getDay();
        const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
        const monday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + diffToMonday);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
        }
        return days;
    }, [selectedDate]);

    // Week event track-packing algorithm to avoid overlaps for multi-day and single-day events
    const getWeekTracks = (weekDays: Date[], events: any[]): Track[] => {
        const weekStart = new Date(weekDays[0]);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekDays[6]);
        weekEnd.setHours(23, 59, 59, 999);

        // Filter events overlapping this week
        const weekEvents = events.filter(ev => {
            const evStart = new Date(ev.date);
            const evEnd = ev.endDate ? new Date(ev.endDate) : new Date(ev.date);
            return evStart <= weekEnd && evEnd >= weekStart;
        });

        // Calculate columns span relative to this week
        const preparedEvents = weekEvents.map(ev => {
            const evStart = new Date(ev.date);
            const evEnd = ev.endDate ? new Date(ev.endDate) : new Date(ev.date);

            const startDiff = Math.floor((evStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
            const endDiff = Math.floor((evEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

            const startDayIndex = Math.max(0, startDiff);
            const endDayIndex = Math.min(6, endDiff);
            const span = endDayIndex - startDayIndex + 1;

            return {
                ...ev,
                startDayIndex,
                endDayIndex,
                span,
                isMultiDay: span > 1 || ev.isAllDay
            };
        });

        // Pack longest spans first
        preparedEvents.sort((a, b) => {
            if (a.span !== b.span) {
                return b.span - a.span;
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        const tracks: Track[] = [];
        preparedEvents.forEach(ev => {
            let placed = false;
            for (let i = 0; i < tracks.length; i++) {
                let canPlace = true;
                for (let d = ev.startDayIndex; d <= ev.endDayIndex; d++) {
                    if (tracks[i].slots[d] !== undefined) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    for (let d = ev.startDayIndex; d <= ev.endDayIndex; d++) {
                        tracks[i].slots[d] = ev._id;
                    }
                    tracks[i].events.push(ev);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const newTrack: Track = {
                    slots: new Array(7),
                    events: [ev]
                };
                for (let d = ev.startDayIndex; d <= ev.endDayIndex; d++) {
                    newTrack.slots[d] = ev._id;
                }
                tracks.push(newTrack);
            }
        });

        return tracks;
    };

    // Pack month view grid per-week tracks
    const monthWeeksTracks = useMemo(() => {
        return calendarWeeks.map(weekDays => getWeekTracks(weekDays, filteredInterviews));
    }, [calendarWeeks, filteredInterviews]);

    // Navigation handlers
    const handlePrev = () => {
        if (viewMode === 'month' || viewMode === 'agenda') {
            setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
            setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
        } else if (viewMode === 'week') {
            const nextD = new Date(selectedDate);
            nextD.setDate(selectedDate.getDate() - 7);
            setSelectedDate(nextD);
            setCurrentDate(nextD);
        } else if (viewMode === 'day') {
            const nextD = new Date(selectedDate);
            nextD.setDate(selectedDate.getDate() - 1);
            setSelectedDate(nextD);
            setCurrentDate(nextD);
        }
    };

    const handleNext = () => {
        if (viewMode === 'month' || viewMode === 'agenda') {
            setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
            setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
        } else if (viewMode === 'week') {
            const nextD = new Date(selectedDate);
            nextD.setDate(selectedDate.getDate() + 7);
            setSelectedDate(nextD);
            setCurrentDate(nextD);
        } else if (viewMode === 'day') {
            const nextD = new Date(selectedDate);
            nextD.setDate(selectedDate.getDate() + 1);
            setSelectedDate(nextD);
            setCurrentDate(nextD);
        }
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleInterviewClick = (interview: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedInterview(interview);
    };

    const handleOpenAddForm = (date?: Date) => {
        setIsEditMode(false);
        setFormId(null);

        let initialDateTime = '';
        let initialEndDateTime = '';
        if (date) {
            const tempDate = new Date(date);
            tempDate.setHours(10, 0, 0, 0);
            const tzoffset = tempDate.getTimezoneOffset() * 60000;
            initialDateTime = (new Date(tempDate.getTime() - tzoffset)).toISOString().slice(0, 16);
            
            const tempEndDate = new Date(tempDate);
            tempEndDate.setHours(11, 0, 0, 0);
            initialEndDateTime = (new Date(tempEndDate.getTime() - tzoffset)).toISOString().slice(0, 16);
        } else {
            const now = new Date();
            now.setHours(10, 0, 0, 0);
            const tzoffset = now.getTimezoneOffset() * 60000;
            initialDateTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
            
            const endNow = new Date(now);
            endNow.setHours(11, 0, 0, 0);
            initialEndDateTime = (new Date(endNow.getTime() - tzoffset)).toISOString().slice(0, 16);
        }

        setFormData({
            title: '',
            candidateId: '',
            jobId: '',
            date: initialDateTime,
            endDate: initialEndDateTime,
            isAllDay: false,
            color: 'blue',
            mode: 'Video',
            stage: 'First Round',
            status: 'Scheduled',
            offers: 'No',
            shortlisted: 'No',
            feedback: '',
            meetingLink: ''
        });
        setShowFormModal(true);
    };

    const handleOpenEditForm = (interview: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsEditMode(true);
        setFormId(interview._id);

        const tempDate = new Date(interview.date);
        const tzoffset = tempDate.getTimezoneOffset() * 60000;
        const formattedDate = (new Date(tempDate.getTime() - tzoffset)).toISOString().slice(0, 16);

        const tempEndDate = interview.endDate ? new Date(interview.endDate) : new Date(tempDate.getTime() + 60 * 60 * 1000);
        const formattedEndDate = (new Date(tempEndDate.getTime() - tzoffset)).toISOString().slice(0, 16);

        setFormData({
            title: interview.title || '',
            candidateId: interview.candidateId?._id || '',
            jobId: interview.jobId?._id || '',
            date: formattedDate,
            endDate: formattedEndDate,
            isAllDay: interview.isAllDay || false,
            color: interview.color || 'blue',
            mode: interview.mode || 'Video',
            stage: interview.stage || 'First Round',
            status: interview.status || 'Scheduled',
            offers: interview.offers || 'No',
            shortlisted: interview.shortlisted || 'No',
            feedback: interview.feedback || '',
            meetingLink: interview.meetingLink || ''
        });
        setSelectedInterview(null);
        setShowFormModal(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const submissionData = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(new Date(formData.date).getTime() + 60 * 60 * 1000).toISOString()
            };

            if (!submissionData.candidateId) {
                delete (submissionData as any).candidateId;
            }

            if (isEditMode && formId) {
                await api.updateInterview(formId, submissionData);
                showToast('Interview updated successfully', 'success');
            } else {
                await api.scheduleInterview(submissionData);
                showToast('Interview scheduled successfully', 'success');
            }
            setShowFormModal(false);
            fetchCalendarData();
        } catch (error) {
            console.error(error);
            showToast(isEditMode ? 'Failed to update interview' : 'Failed to schedule interview', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleCancelInterview = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to cancel this interview?')) return;
        try {
            await api.deleteInterview(id);
            showToast('Interview cancelled successfully', 'info');
            setSelectedInterview(null);
            fetchCalendarData();
        } catch (error) {
            console.error(error);
            showToast('Failed to cancel interview', 'error');
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Scheduled': return 'status-scheduled';
            case 'Completed':
            case 'Selected': return 'status-completed';
            case 'Rejected': return 'status-cancelled';
            case 'Pending': return 'status-pending';
            default: return 'status-onhold';
        }
    };

    const getEventColorClass = (color: string) => {
        switch (color) {
            case 'blue': return 'event-blue';
            case 'violet': return 'event-violet';
            case 'mint': return 'event-mint';
            case 'pink': return 'event-pink';
            case 'yellow': return 'event-yellow';
            case 'blue-violet': return 'event-blue-violet';
            default: return 'event-blue';
        }
    };

    const uniqueEmployees = useMemo(() => {
        const map = new Map();
        interviews.forEach(int => {
            const creator = int.createdBy;
            if (creator && creator._id && creator.name) {
                map.set(creator._id, creator.name);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [interviews]);

    // Header date string display based on viewMode
    const headerDateString = useMemo(() => {
        if (viewMode === 'month') {
            return `${MONTHS[currentMonth]} ${currentYear}`;
        } else if (viewMode === 'week') {
            const monday = currentWeekDays[0];
            const sunday = currentWeekDays[6];
            const monStr = monday.toLocaleDateString([], { month: 'long', day: '2-digit' });
            const sunStr = sunday.toLocaleDateString([], { day: '2-digit' });
            if (sunday.getMonth() !== monday.getMonth()) {
                const sunMonthStr = sunday.toLocaleDateString([], { month: 'long', day: '2-digit' });
                return `${monStr} - ${sunMonthStr}`;
            }
            return `${monStr} - ${sunStr}`;
        } else if (viewMode === 'day') {
            const wday = selectedDate.toLocaleDateString([], { weekday: 'long' });
            const mon = selectedDate.toLocaleDateString([], { month: 'short' });
            const dayNum = String(selectedDate.getDate()).padStart(2, '0');
            return `${wday} ${mon} ${dayNum}`;
        } else {
            // Agenda: 1 month scope formatted DD/MM/YYYY - DD/MM/YYYY
            const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
            
            const formatD = (d: Date) => {
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            };
            return `${formatD(start)} - ${formatD(end)}`;
        }
    }, [viewMode, currentDate, selectedDate, currentWeekDays, currentMonth, currentYear]);

    // Hourly timed placement styles (06:00 to 24:00)
    const calculateTimedStyles = (dateStr: string, endDateStr?: string) => {
        const date = new Date(dateStr);
        const endDate = endDateStr ? new Date(endDateStr) : new Date(date.getTime() + 60 * 60 * 1000);
        
        const startMin = date.getHours() * 60 + date.getMinutes();
        const endMin = endDate.getHours() * 60 + endDate.getMinutes();
        
        const dayStart = 6 * 60; // 06:00
        const dayEnd = 24 * 60;  // 24:00
        const totalMin = dayEnd - dayStart;
        
        const top = Math.max(0, ((startMin - dayStart) / totalMin) * 100);
        const height = Math.min(100 - top, ((endMin - startMin) / totalMin) * 100);
        
        return { top: `${top}%`, height: `${height}%` };
    };

    // Hours timeline array for grid rendering
    const timelineHours = useMemo(() => {
        const list = [];
        for (let h = 6; h <= 23; h++) {
            list.push(String(h).padStart(2, '0') + ':00');
        }
        return list;
    }, []);

    // Filter events occurring on a specific Date
    const getTimedEventsForDay = (day: Date, events: any[]) => {
        const target = new Date(day);
        target.setHours(0,0,0,0);
        const targetEnd = new Date(day);
        targetEnd.setHours(23,59,59,999);

        return events.filter(ev => {
            const evStart = new Date(ev.date);
            const evEnd = ev.endDate ? new Date(ev.endDate) : evStart;
            const isSpan = evEnd.toDateString() !== evStart.toDateString();
            
            // Only non-multi-day timed events
            if (isSpan || ev.isAllDay) return false;
            
            return evStart >= target && evStart <= targetEnd;
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    // Filter multi-day/all-day events overlapping a specific Date
    const getMultiDayEventsForDay = (day: Date, events: any[]) => {
        const target = new Date(day);
        target.setHours(0,0,0,0);
        const targetEnd = new Date(day);
        targetEnd.setHours(23,59,59,999);

        return events.filter(ev => {
            const evStart = new Date(ev.date);
            const evEnd = ev.endDate ? new Date(ev.endDate) : evStart;
            const isSpan = evEnd.toDateString() !== evStart.toDateString();
            
            return ev.isAllDay || isSpan;
        });
    };

    // Expanded agenda item list where multi-day events are repeated for each date they fall on
    const expandedAgendaItems = useMemo(() => {
        const items: any[] = [];
        
        // Scope range: 1 month starting from selectedDate
        const startLimit = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        startLimit.setHours(0,0,0,0);
        const endLimit = new Date(startLimit.getFullYear(), startLimit.getMonth() + 1, startLimit.getDate());
        endLimit.setHours(23,59,59,999);

        const sorted = [...filteredInterviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sorted.forEach(ev => {
            const start = new Date(ev.date);
            const end = ev.endDate ? new Date(ev.endDate) : start;
            
            let current = new Date(start);
            current.setHours(0,0,0,0);
            
            const eventEndLimit = new Date(end);
            eventEndLimit.setHours(23,59,59,999);
            
            while (current <= eventEndLimit) {
                if (current >= startLimit && current <= endLimit) {
                    items.push({
                        event: ev,
                        day: new Date(current)
                    });
                }
                current.setDate(current.getDate() + 1);
            }
        });
        
        items.sort((a, b) => {
            if (a.day.getTime() !== b.day.getTime()) {
                return a.day.getTime() - b.day.getTime();
            }
            return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
        });
        
        return items;
    }, [filteredInterviews, selectedDate]);

    // Agenda time cell formatting (e.g. all day », « all day », 00:00 »)
    const getAgendaTimeText = (event: any, currentDay: Date) => {
        const startDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : startDate;
        
        const isMultiday = endDate.toDateString() !== startDate.toDateString();
        
        if (!isMultiday) {
            if (event.isAllDay) return 'all day';
            const startT = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const endT = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${startT} - ${endT}`;
        } else {
            const isFirstDay = currentDay.toDateString() === startDate.toDateString();
            const isLastDay = currentDay.toDateString() === endDate.toDateString();
            
            if (isFirstDay) {
                const startT = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                if (startT === '00:00') return '00:00 »';
                return `${startT} »`;
            } else if (isLastDay) {
                return '« all day »';
            } else {
                return '« all day »';
            }
        }
    };

    return (
        <div className="interview-calendar-page animate-fade-in">
            {/* Header Area */}
            <div className="calendar-header-section">
                <div className="header-info">
                    <div className="flex-row-gap-center">
                        <div>
                            <h3 className="header-title">Interview Calendar</h3>
                            <p className="header-subtitle">Schedule, coordinate, and sync candidate pipelines date & time-wise.</p>
                        </div>
                    </div>
                </div>

                <div className="header-controls">
                    {/* View Switcher Pills */}
                    <div className="segmented-control">
                        <button
                            className={`control-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Month
                        </button>
                        <button
                            className={`control-btn ${viewMode === 'week' ? 'active' : ''}`}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </button>
                        <button
                            className={`control-btn ${viewMode === 'day' ? 'active' : ''}`}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </button>
                        <button
                            className={`control-btn ${viewMode === 'agenda' ? 'active' : ''}`}
                            onClick={() => setViewMode('agenda')}
                        >
                            Agenda
                        </button>
                    </div>

                    <button
                        className="btn btn-primary btn-add-calendar"
                        onClick={() => handleOpenAddForm(selectedDate)}
                    >
                        <PlusIcon size={16} /> Schedule Interview
                    </button>
                </div>
            </div>

            {/* Filter and Nav Bar */}
            <div className="calendar-filter-bar glass-card">
                <div className="nav-controls">
                    <button className="btn btn-secondary btn-today" onClick={handleToday}>
                        Today
                    </button>
                    <div className="nav-arrows">
                        <button className="arrow-btn" onClick={handlePrev}>
                            &larr;
                        </button>
                        <h4 className="month-display">
                            {headerDateString}
                        </h4>
                        <button className="arrow-btn" onClick={handleNext}>
                            &rarr;
                        </button>
                    </div>
                </div>

                <div className="filters-container">
                    {/* Search Field */}
                    <div className="search-field">
                        <SearchIcon size={16} className="search-icon-svg" />
                        <input
                            type="text"
                            placeholder="Search event or stage..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                               <XIcon size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>

                    {/* Job Filter */}
                    <select
                        className="filter-select"
                        value={filterJob}
                        onChange={(e) => setFilterJob(e.target.value)}
                    >
                        <option value="All">All Jobs</option>
                        {jobs.map(j => (
                            <option key={j._id} value={j._id}>
                                {j.company ? `${j.company} - ${j.title}` : j.title}
                            </option>
                        ))}
                    </select>

                    {/* Employee Filter */}
                    {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <select
                            className="filter-select"
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                        >
                            <option value="All">All Employees</option>
                            {uniqueEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    )}

                    {/* Refresh */}
                    <button
                        className="btn-icon-secondary refresh-btn"
                        onClick={fetchCalendarData}
                        title="Reload Calendar"
                    >
                        <RefreshIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Main Calendar Viewport */}
            {loading ? (
                <div className="loading-card glass-card">
                    <div className="spinner"></div>
                    <p>Fetching scheduled interviews...</p>
                </div>
            ) : viewMode === 'month' ? (
                /* 1. CUSTOM MONTH SCHEDULER VIEW */
                <div className="calendar-grid-container glass-card">
                    <div className="weekday-header-grid">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="weekday-lbl">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="days-grid-layout">
                        {calendarWeeks.map((weekDays, weekIdx) => {
                            const tracks = monthWeeksTracks[weekIdx];

                            return (
                                <div key={weekIdx} className="calendar-week-row">
                                    {/* Clickable Background Grid Cell Squares */}
                                    <div className="week-bg-grid">
                                        {weekDays.map((date, idx) => {
                                            const isToday = new Date().toDateString() === date.toDateString();
                                            const isSelected = selectedDate.toDateString() === date.toDateString();
                                            const isCurrentMonth = date.getMonth() === currentMonth;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`day-cell-bg ${!isCurrentMonth ? 'adjacent-month' : ''} ${isToday ? 'cell-today' : ''} ${isSelected ? 'cell-selected' : ''}`}
                                                    onClick={() => setSelectedDate(date)}
                                                    onDoubleClick={() => handleOpenAddForm(date)}
                                                >
                                                    <div className="cell-header">
                                                        <span className={`day-number ${isToday ? 'num-today' : ''}`}>
                                                            {String(date.getDate()).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Packed Overlay Tracks representing spanning horizontal rows */}
                                    <div className="week-events-overlay">
                                        {tracks.map((track, trackIdx) => (
                                            <div key={trackIdx} className="overlay-track-row">
                                                {track.events && track.events.map((int: any) => {
                                                    const startTime = new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                                    const colorClass = getEventColorClass(int.color);

                                                    return (
                                                        <div
                                                            key={int._id}
                                                            style={{
                                                                gridColumnStart: int.startDayIndex + 1,
                                                                gridColumnEnd: int.endDayIndex + 2
                                                            }}
                                                            className={`cell-interview-item ${colorClass} ${int.isMultiDay ? 'all-day' : ''}`}
                                                            onClick={(e) => handleInterviewClick(int, e)}
                                                        >
                                                            {!int.isMultiDay && <span className="int-time">{startTime}</span>}
                                                            <span className="int-name">{int.title || int.candidateId?.name || 'Interview'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : viewMode === 'week' ? (
                /* 2. HOURLY WEEK VIEW */
                <div className="calendar-week-view-container glass-card">
                    {/* Week Header Columns (starting Monday) */}
                    <div className="week-header-grid-cols">
                        <div className="hour-axis-label-spacer"></div>
                        {currentWeekDays.map((date, idx) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isSelected = selectedDate.toDateString() === date.toDateString();
                            const formattedDay = String(date.getDate()).padStart(2, '0') + ' ' + WEEKDAYS[idx];

                            return (
                                <div
                                    key={idx}
                                    className={`week-header-col-lbl ${isToday ? 'cell-today' : ''} ${isSelected ? 'cell-selected' : ''}`}
                                    onClick={() => setSelectedDate(date)}
                                >
                                    {formattedDay}
                                </div>
                            );
                        })}
                    </div>

                    {/* Top multi-day section */}
                    <div className="week-allday-spanning-section">
                        <div className="hour-axis-label-spacer"></div>
                        <div className="week-spanning-track-container">
                            {getWeekTracks(currentWeekDays, filteredInterviews).map((track, trackIdx) => (
                                <div key={trackIdx} className="spanning-track-row">
                                    {track.events && track.events.filter((ev: any) => ev.isMultiDay).map((int: any) => {
                                        const colorClass = getEventColorClass(int.color);
                                        return (
                                            <div
                                                key={int._id}
                                                style={{
                                                    gridColumnStart: int.startDayIndex + 1,
                                                    gridColumnEnd: int.endDayIndex + 2
                                                }}
                                                className={`cell-interview-item ${colorClass} all-day`}
                                                onClick={(e) => handleInterviewClick(int, e)}
                                            >
                                                <span className="int-name">{int.title || int.candidateId?.name || 'Interview'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom hourly block timeline columns */}
                    <div className="week-hourly-scroller custom-scrollbar">
                        <div className="week-hourly-grid-wrapper">
                            {/* Left hourly lines text labels */}
                            <div className="hours-axis-labels-col">
                                {timelineHours.map(hour => (
                                    <div key={hour} className="hour-axis-lbl-box">
                                        <span className="axis-lbl-text">{hour}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Right 7 vertical columns representing dates */}
                            <div className="week-days-columns-wrapper">
                                {/* Horizontal grid line rows spanning all columns */}
                                <div className="hourly-lines-grid-backdrop">
                                    {timelineHours.map(hour => (
                                        <div key={hour} className="backdrop-horizontal-line-box"></div>
                                    ))}
                                </div>

                                {/* Columns list */}
                                <div className="columns-grid">
                                    {currentWeekDays.map((date, idx) => {
                                        const isToday = new Date().toDateString() === date.toDateString();
                                        const dayTimedEvents = getTimedEventsForDay(date, filteredInterviews);

                                        return (
                                            <div key={idx} className={`week-day-vertical-column ${isToday ? 'col-today' : ''}`} onDoubleClick={() => handleOpenAddForm(date)}>
                                                {dayTimedEvents.map((int: any) => {
                                                    const colorClass = getEventColorClass(int.color);
                                                    const timeStyles = calculateTimedStyles(int.date, int.endDate);
                                                    const startTime = new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                                    const endTime = int.endDate ? new Date(int.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

                                                    return (
                                                        <div
                                                            key={int._id}
                                                            style={timeStyles}
                                                            className={`timed-event-block-item ${colorClass}`}
                                                            onClick={(e) => handleInterviewClick(int, e)}
                                                        >
                                                            <div className="timed-event-time-range">{startTime} - {endTime}</div>
                                                            <div className="timed-event-headline">{int.title || int.candidateId?.name || 'Interview'}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'day' ? (
                /* 3. DAY VIEW TIMELINE GRID */
                <div className="calendar-day-view-container glass-card">
                    <div className="day-grid-headline-date">
                        {headerDateString}
                    </div>

                    <div className="day-hourly-scroller custom-scrollbar">
                        <div className="day-hourly-grid-wrapper">
                            {/* Left hourly axis labels */}
                            <div className="hours-axis-labels-col">
                                {timelineHours.map(hour => (
                                    <div key={hour} className="hour-axis-lbl-box">
                                        <span className="axis-lbl-text">{hour}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Right vertical columns list */}
                            <div className="day-column-wrapper">
                                {/* Horizontal grid line backdrops */}
                                <div className="hourly-lines-grid-backdrop">
                                    {timelineHours.map(hour => (
                                        <div key={hour} className="backdrop-horizontal-line-box"></div>
                                    ))}
                                </div>

                                {/* Day timeline content column */}
                                <div className="day-content-column" onDoubleClick={() => handleOpenAddForm(selectedDate)}>
                                    {/* All-Day spanning banner top element if exists */}
                                    {getMultiDayEventsForDay(selectedDate, filteredInterviews).map((int: any) => {
                                        const colorClass = getEventColorClass(int.color);
                                        return (
                                            <div
                                                key={int._id}
                                                className={`day-allday-banner-bar ${colorClass}`}
                                                onClick={(e) => handleInterviewClick(int, e)}
                                            >
                                                <span className="banner-badge">ALL DAY</span>
                                                <span className="banner-title">{int.title || int.candidateId?.name || 'Interview'}</span>
                                            </div>
                                        );
                                    })}

                                    {/* Sized timed event blocks */}
                                    {getTimedEventsForDay(selectedDate, filteredInterviews).map((int: any) => {
                                        const colorClass = getEventColorClass(int.color);
                                        const timeStyles = calculateTimedStyles(int.date, int.endDate);
                                        const startTime = new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                        const endTime = int.endDate ? new Date(int.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

                                        return (
                                            <div
                                                key={int._id}
                                                style={timeStyles}
                                                className={`timed-event-block-item ${colorClass}`}
                                                onClick={(e) => handleInterviewClick(int, e)}
                                            >
                                                <div className="timed-event-time-range">{startTime} - {endTime}</div>
                                                <div className="timed-event-headline">{int.title || int.candidateId?.name || 'Interview'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* 4. HIGH FIDELITY AGENDA VIEW LIST TABLE */
                <div className="calendar-agenda-view-container glass-card">
                    <div className="agenda-grid-container custom-scrollbar">
                        <table className="agenda-list-table">
                            <thead>
                                <tr>
                                    <th className="agenda-col-date">Date</th>
                                    <th className="agenda-col-time">Time</th>
                                    <th className="agenda-col-event">Event</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expandedAgendaItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="empty-agenda-table-row">
                                            No events scheduled for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    expandedAgendaItems.map((item, idx) => {
                                        const formattedDay = item.day.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' }).replace(',', '');
                                        const timeStr = getAgendaTimeText(item.event, item.day);
                                        
                                        return (
                                            <tr key={idx} className="agenda-row-item" onClick={(e) => handleInterviewClick(item.event, e)}>
                                                <td className="agenda-cell-date">{formattedDay}</td>
                                                <td className="agenda-cell-time">
                                                    {timeStr.includes('»') || timeStr.includes('«') ? (
                                                        <span className="time-multi-arrows">{timeStr}</span>
                                                    ) : (
                                                        timeStr
                                                    )}
                                                </td>
                                                <td className="agenda-cell-event">
                                                    <span className="event-headline-txt">
                                                        <HighlightText text={item.event.title || item.event.candidateId?.name} highlight={searchQuery} />
                                                    </span>
                                                    {item.event.jobId?.title && (
                                                        <span className="event-job-subtag">
                                                            ({item.event.jobId.title})
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Read-Only Interactive Detail Slide Modal */}
            <Modal
                isOpen={!!selectedInterview}
                onClose={() => setSelectedInterview(null)}
                title="Interview Slot Details"
                footer={
                    <div className="flex justify-end gap-12">
                        <button onClick={() => setSelectedInterview(null)} className="btn-secondary">Close</button>
                        {selectedInterview && (
                            <>
                                <button
                                    onClick={(e) => handleOpenEditForm(selectedInterview, e)}
                                    className="btn-primary"
                                >
                                    Reschedule / Edit
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={(e) => handleCancelInterview(selectedInterview._id, e)}
                                        className="btn-secondary"
                                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    >
                                        Cancel Interview
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                }
            >
                {selectedInterview && (
                    <div className="interview-detail-view-modal">
                        <div className="modal-candidate-header">
                            <div className="modal-avatar">
                                {(selectedInterview.title || selectedInterview.candidateId?.name || 'I').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="candidate-title">{selectedInterview.title || selectedInterview.candidateId?.name || 'Interview'}</h4>
                                <span className={`status-pill ${getStatusClass(selectedInterview.status)}`}>
                                    {selectedInterview.status}
                                </span>
                            </div>
                        </div>

                        <div className="info-grid-rows">
                            {selectedInterview.candidateId && (
                                <div className="info-row">
                                    <span className="lbl">Candidate Name:</span>
                                    <span className="val font-semibold">{selectedInterview.candidateId?.name}</span>
                                </div>
                            )}
                            {selectedInterview.jobId && (
                                <div className="info-row">
                                    <span className="lbl">Role Position:</span>
                                    <span className="val font-semibold">{selectedInterview.jobId?.title}</span>
                                </div>
                            )}
                            <div className="info-row">
                                <span className="lbl">Interview Stage:</span>
                                <span className="val">{selectedInterview.stage}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl">Interview Mode:</span>
                                <span className="val">{selectedInterview.mode}</span>
                            </div>
                            <div className="info-row">
                                <span className="lbl">Start Date & Time:</span>
                                <span className="val font-semibold">
                                    {new Date(selectedInterview.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                </span>
                            </div>
                            {selectedInterview.endDate && (
                                <div className="info-row">
                                    <span className="lbl">End Date & Time:</span>
                                    <span className="val font-semibold">
                                        {new Date(selectedInterview.endDate).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                    </span>
                                </div>
                            )}
                            {selectedInterview.meetingLink && (
                                <div className="info-row">
                                    <span className="lbl">Meeting URL:</span>
                                    <span className="val">
                                        <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" className="link-anchor">
                                            {selectedInterview.meetingLink}
                                        </a>
                                    </span>
                                </div>
                            )}
                            {selectedInterview.feedback && (
                                <div className="info-row full-width">
                                    <span className="lbl block mb-4">Interviewer Feedback:</span>
                                    <p className="feedback-paragraph-box">{selectedInterview.feedback}</p>
                                </div>
                            )}
                        </div>

                        {/* Calendar Sync Options Box */}
                        <div className="gcal-sync-options-box">
                            <h5 className="box-title">Add / Sync Google Calendar Invitations</h5>
                            <p className="box-desc">Generate one-click Google Calendar events pre-populated with emails, descriptions, timeslots, and direct meeting links.</p>

                            <div className="sync-buttons-grid">
                                <a
                                    href={getGoogleCalendarCandidateUrl(selectedInterview)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-sync-option option-candidate"
                                >
                                    Create Candidate Event Link
                                </a>
                                <a
                                    href={getGoogleCalendarEmployeeUrl(selectedInterview)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-sync-option option-employee"
                                >
                                    Create Interviewer Event Link
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Quick Interactive Add/Edit Form Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={isEditMode ? 'Reschedule Interview' : 'Schedule New Interview'}
                footer={
                    <div className="flex justify-end gap-12">
                        <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary">Cancel</button>
                        <button
                            onClick={handleFormSubmit}
                            className="btn-primary"
                            disabled={formLoading}
                        >
                            {formLoading ? 'Saving...' : (isEditMode ? 'Update Details' : 'Confirm Schedule')}
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleFormSubmit} className="compact-grid">
                    {/* Event Title */}
                    <div className="input-group full-width">
                        <label className="input-label">Event Title (Optional, defaults to candidate name)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Going For Party of Sahs, Learn ReactJs"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Candidate Selector */}
                    <div className="input-group">
                        <label className="input-label">Candidate (Optional)</label>
                        <select
                            className="input-field"
                            value={formData.candidateId}
                            onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                            disabled={isEditMode}
                        >
                            <option value="">None (General Calendar Event)</option>
                            {candidates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Job Selector */}
                    <div className="input-group">
                        <label className="input-label">Job Role (Optional)</label>
                        <select
                            className="input-field"
                            value={formData.jobId}
                            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                        >
                            <option value="">None</option>
                            {jobs.map(j => <option key={j._id} value={j._id}>{j.company} - {j.title}</option>)}
                        </select>
                    </div>

                    {/* Start Date and Time Selector */}
                    <div className="input-group">
                        <label className="input-label">Start Date & Time</label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* End Date and Time Selector */}
                    <div className="input-group">
                        <label className="input-label">End Date & Time</label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>

                    {/* All day checkbox */}
                    <div className="input-group flex items-center" style={{ gap: '8px', paddingTop: '28px' }}>
                        <input
                            type="checkbox"
                            id="isAllDayCheckbox"
                            checked={formData.isAllDay}
                            onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                        />
                        <label htmlFor="isAllDayCheckbox" className="input-label mb-0" style={{ cursor: 'pointer' }}>All Day Event</label>
                    </div>

                    {/* Color category */}
                    <div className="input-group">
                        <label className="input-label">Category Color</label>
                        <select
                            className="input-field"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        >
                            {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    {/* Mode Selector */}
                    <div className="input-group">
                        <label className="input-label">Interview Mode</label>
                        <select
                            className="input-field"
                            value={formData.mode}
                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        >
                            {MODES.map(md => <option key={md} value={md}>{md}</option>)}
                        </select>
                    </div>

                    {/* Stage Selector */}
                    <div className="input-group">
                        <label className="input-label">Interview Stage</label>
                        <select
                            className="input-field"
                            value={formData.stage}
                            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                        >
                            {STAGES.map(stg => <option key={stg} value={stg}>{stg}</option>)}
                        </select>
                    </div>

                    {/* Status Selector */}
                    <div className="input-group">
                        <label className="input-label">Status</label>
                        <select
                            className="input-field"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            {STATUSES.map(sts => <option key={sts} value={sts}>{sts}</option>)}
                        </select>
                    </div>

                    {/* Meeting Link */}
                    <div className="input-group full-width">
                        <label className="input-label">Meeting URL (Optional)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="https://meet.google.com/abc-defg-hij"
                            value={formData.meetingLink}
                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        />
                    </div>

                    {/* Feedback */}
                    <div className="input-group full-width">
                        <label className="input-label">Interviewer Notes / Feedback (Optional)</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            placeholder="Add slot notes, required equipment, or candidate reviews..."
                            value={formData.feedback}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InterviewCalendar;
