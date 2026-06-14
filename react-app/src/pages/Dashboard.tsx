import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import {
    UserIcon, ClockIcon,
    AlertCircleIcon, BellIcon, ListIcon, SparklesIcon,
    CheckIcon, UsersIcon, TrashIcon, CopyIcon, ChevronDownIcon, FileTextIcon
} from '../icons';
import { useToast } from '../context/ToastContext';
import DashboardManager from './DashboardManager';
import DashboardCandidate from './DashboardCandidate';
import CandidateSummaryCard from '../components/CandidateSummaryCard';
import {
    ModernStatsCard, TaskCompletionWidget, AttendanceWidget
} from '../components/DashboardWidgets';
import CandidateDetailModal from '../components/CandidateDetailModal';
import Drawer from '../components/Drawer';
import Modal from '../components/Modal';
import AppDateInput from '../components/AppDateInput';

const EmployeeCard = ({ employee }: { employee: any }) => {
    return (
        <div className="employee-activity-card" style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
            marginBottom: '10px'
        }}>
            <div className="employee-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 0 }}>
                <div className="employee-avatar-wrapper" style={{ position: 'relative', width: '38px', height: '38px' }}>
                    {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="employee-avatar-img" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div className="employee-avatar-placeholder" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {employee.initial}
                        </div>
                    )}
                    <div className="online-pulse" style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>
                </div>
                <div className="employee-info">
                    <h4 className="employee-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{employee.name}</h4>
                    <span className="employee-role" style={{ fontSize: '0.7rem', color: '#64748b' }}>{employee.role}</span>
                </div>
            </div>

            <div className="employee-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Active</div>
                    <div className="employee-stat-value" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{employee.active}</div>
                </div>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Done</div>
                    <div className="employee-stat-value done" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{employee.done}</div>
                </div>
                <div className="employee-stat-item" style={{ background: '#f8fafc', padding: '6px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div className="employee-stat-label" style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Pending</div>
                    <div className="employee-stat-value" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginTop: '2px' }}>{employee.pending}</div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Ticket Modal States
    const [isTicketModalOpen, setIsTicketModalOpen] = React.useState(false);
    const [ticketModalCandidate, setTicketModalCandidate] = React.useState<any>(null);
    const [modalTickets, setModalTickets] = React.useState<any[]>([]);
    const [modalSelectedTicketIndices, setModalSelectedTicketIndices] = React.useState<number[]>([]);
    const [modalTicketForm, setModalTicketForm] = React.useState<{ companyMulti: string[]; dateFiled: string }>({
        companyMulti: [],
        dateFiled: ''
    });
    const [isModalCompanyDropdownOpen, setIsModalCompanyDropdownOpen] = React.useState(false);
    const [uniqueOpenCompanies, setUniqueOpenCompanies] = React.useState<string[]>([]);

    React.useEffect(() => {
        const fetchOpenCompanies = async () => {
            try {
                const jobs = await api.getJobs({ status: 'Open' });
                const companies = jobs.map((job: any) => job.company).filter(Boolean);
                setUniqueOpenCompanies(Array.from(new Set(companies)).sort() as string[]);
            } catch (err) {
                console.error("Error fetching open companies:", err);
            }
        };
        fetchOpenCompanies();
    }, []);

    const handleOpenTicketEditModal = (candidate: any) => {
        setTicketModalCandidate(candidate);
        setModalTickets(candidate.tickets || []);
        setModalTicketForm({
            companyMulti: candidate.companyMulti || [],
            dateFiled: candidate.dateFiled ? candidate.dateFiled.split('H')[0].split('T')[0] : ''
        });
        setModalSelectedTicketIndices([]);
        setIsTicketModalOpen(true);
    };

    const handleModalUpdateTicket = (index: number, field: string, value: any) => {
        setModalTickets(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleModalAddTicketRow = () => {
        const today = new Date().toISOString().split('T')[0];
        const newTicket = {
            ticketNo: '',
            companyName: '',
            uploaddate: today,
            expdate: '',
            crtdate: '',
            type: 'Banca',
            portalStatus: 'Pending'
        };
        setModalTickets(prev => [...prev, newTicket]);
    };

    const handleModalCloneTicket = (index: number) => {
        const ticketToClone = modalTickets[index];
        const clonedTicket = { ...ticketToClone, ticketNo: '' };
        setModalTickets(prev => {
            const updated = [...prev];
            updated.splice(index + 1, 0, clonedTicket);
            return updated;
        });
    };

    const handleModalDeleteTicket = (index: number) => {
        setModalTickets(prev => prev.filter((_, i) => i !== index));
        setModalSelectedTicketIndices(prev => prev.filter(i => i !== index));
    };

    const handleModalToggleSelectTicket = (index: number) => {
        setModalSelectedTicketIndices(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleModalSelectAllTickets = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setModalSelectedTicketIndices(modalTickets.map((_, i) => i));
        } else {
            setModalSelectedTicketIndices([]);
        }
    };

    const handleModalBulkDeleteTickets = () => {
        setModalTickets(prev => prev.filter((_, i) => !modalSelectedTicketIndices.includes(i)));
        setModalSelectedTicketIndices([]);
    };

    const handleModalSaveTickets = async () => {
        if (!ticketModalCandidate) return;
        try {
            const updateData = {
                tickets: modalTickets,
                companyMulti: modalTicketForm.companyMulti,
                dateFiled: modalTicketForm.dateFiled
            };
            await api.updateCandidate(ticketModalCandidate._id, updateData);
            
            // Update local state in stats so it is reflected immediately
            setStats((prev: any) => {
                if (!prev || !prev.pendingTickets) return prev;
                const updatedTickets = prev.pendingTickets.map((c: any) => 
                    c._id === ticketModalCandidate._id 
                        ? { ...c, tickets: modalTickets, companyMulti: modalTicketForm.companyMulti, dateFiled: modalTicketForm.dateFiled }
                        : c
                );
                return { ...prev, pendingTickets: updatedTickets };
            });

            showToast('Tickets saved successfully. A notification has been sent to all team members.', 'success');
            setIsTicketModalOpen(false);
            
            await fetchData();
        } catch (error) {
            console.error('Save tickets error:', error);
            showToast('Failed to save tickets', 'error');
        }
    };

    const [startDate, setStartDate] = React.useState<string>(() => {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        return start.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = React.useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [candidates, setCandidates] = React.useState<any[]>([]);
    const [stats, setStats] = React.useState<any>(null);
    const [activeList, setActiveList] = React.useState<'reminders' | 'tickets' | 'assessment' | 'newlyAssigned'>('reminders');
    const [isLoading, setIsLoading] = React.useState(true);
    const [todayAttendance, setTodayAttendance] = React.useState<any>(null);
    const [selectedCandidate, setSelectedCandidate] = React.useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [attendancePeriod, setAttendancePeriod] = React.useState<string>('This Week');
    const [isTeamDrawerOpen, setIsTeamDrawerOpen] = React.useState(false);
    const [punchModal, setPunchModal] = React.useState<{ isOpen: boolean; title: string; message: string; isError?: boolean } | null>(null);

    const isFirstMount = React.useRef(true);

    const isManager = user?.role === 'Manager' || user?.role === 'Team Lead' || (user?.role as string) === 'Operation Manager';
    const isCandidate = user?.role === 'Normal User';

    const fetchData = React.useCallback(async () => {
        if (isFirstMount.current) {
            setIsLoading(true);
        }
        try {
            const data = await api.getDashboardStats({ startDate, endDate });
            setStats(data);
            setCandidates(data.recentCandidates || []);

            const myHistory = await api.getMyAttendance();
            const todayStr = new Date().toDateString();
            const today = myHistory.find((r: any) => {
                const recordDate = r.inTime ? new Date(r.inTime) : new Date(r.date);
                return recordDate.toDateString() === todayStr;
            });
            setTodayAttendance(today);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            if (isFirstMount.current) {
                setIsLoading(false);
                isFirstMount.current = false;
            }
        }
    }, [startDate, endDate]);

    const handlePunchIn = async () => {
        try {
            await api.punchIn();
            await fetchData();
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setPunchModal({
                isOpen: true,
                title: 'Punch In Successful',
                message: `You have successfully punched in at ${timeStr}. Have a great work day!`,
                isError: false
            });
        } catch (error: any) {
            console.error('Punch In Error:', error);
            setPunchModal({
                isOpen: true,
                title: 'Punch In Failed',
                message: error.message || 'Failed to punch in. Please try again.',
                isError: true
            });
        }
    };

    const handlePunchOut = async () => {
        try {
            await api.punchOut();
            await fetchData();
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setPunchModal({
                isOpen: true,
                title: 'Punch Out Successful',
                message: `You have successfully punched out at ${timeStr}. See you next time!`,
                isError: false
            });
        } catch (error: any) {
            console.error('Punch Out Error:', error);
            setPunchModal({
                isOpen: true,
                title: 'Punch Out Failed',
                message: error.message || 'Failed to punch out. Please try again.',
                isError: true
            });
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);


    if (isLoading) {
        return (
            <div className="fade-in dashboard-layout" style={{ overflow: 'hidden' }}>
                <div className="dashboard-main-content">
                    <div className="stats-row">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="skeleton-card" style={{ height: '140px' }}>
                                <div className="skeleton-text title" />
                                <div className="skeleton-text subtitle" style={{ marginTop: 'auto' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="skeleton-card" style={{ height: '360px' }}>
                            <div className="skeleton-text title" style={{ width: '40%' }} />
                            <div className="skeleton-text subtitle" style={{ width: '20%' }} />
                            <div className="skeleton-text" style={{ height: '200px', marginTop: 'auto', borderRadius: '12px' }} />
                        </div>
                        <div className="skeleton-card" style={{ height: '360px' }}>
                            <div className="skeleton-text title" style={{ width: '50%' }} />
                            <div className="skeleton-text subtitle" style={{ width: '30%' }} />
                            <div className="skeleton-text" style={{ height: '200px', marginTop: 'auto', borderRadius: '12px' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCandidate || stats?.role === 'Candidate') {
        return <DashboardCandidate stats={stats} />;
    }



    // High fidelity trend data (exact curves for aesthetic wave effects) scaled dynamically per live data
    const getTrendData = (type: string, currentValue: number) => {
        let baseTrend = [12, 18, 14, 26, 20, 28, 24];
        if (type === 'total') baseTrend = [12, 18, 14, 26, 20, 28, 24];
        else if (type === 'new') baseTrend = [8, 12, 9, 15, 11, 16, 14];
        else if (type === 'reminders') baseTrend = [5, 9, 7, 12, 8, 14, 11];
        else baseTrend = [14, 22, 17, 28, 21, 32, 27]; // assessment

        const lastVal = baseTrend[baseTrend.length - 1];
        const ratio = currentValue / (lastVal || 1);

        return baseTrend.map((val, idx) => {
            if (idx === baseTrend.length - 1) return currentValue;
            return Math.round(val * ratio);
        });
    };

    // Fallback Mock items for Action Center (matching the mockup exactly for pixel perfect display)
    const mockActionItems = {
        reminders: [
            { id: '1', title: 'Follow up: Pari Kulkarni 500', subtitle: 'Candidate: Pari Kulkarni 500 • Project: Website Redesign', time: '09:00 AM', status: 'OVERDUE', color: '#f43f5e', icon: ClockIcon },
            { id: '2', title: 'Schedule technical assessment for Akash Joshi', subtitle: 'Project: Mobile App • Step: Technical Round', time: '10:30 AM', status: 'DUE TODAY', color: '#f59e0b', icon: ClockIcon },
            { id: '3', title: 'Document upload pending – Om Kulkarni 499', subtitle: 'Project: SaaS Dashboard • Document: ID Proof', time: '11:15 AM', status: 'PENDING', color: '#64748b', icon: ClockIcon },
            { id: '4', title: 'Client feedback reminder – Ritesh Kumar', subtitle: 'Project: CRM Integration • Feedback Round', time: '01:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: ClockIcon }
        ],
        tickets: [
            { id: '1', title: 'Portal Login Issue - Akash K', subtitle: 'Project: Mobile App • Ticket ID: #10023', time: '11:00 AM', status: 'DUE TODAY', color: '#f59e0b', icon: ListIcon },
            { id: '2', title: 'Resume Download Failure', subtitle: 'Project: SaaS Dashboard • Ticket ID: #10024', time: '02:30 PM', status: 'PENDING', color: '#64748b', icon: ListIcon }
        ],
        assessment: [
            { id: '1', title: 'SQL Round Assessment - Tanvi S', subtitle: 'Candidate: Tanvi Shirke • Project: DB Sync', time: '12:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: AlertCircleIcon },
            { id: '2', title: 'React Coding round - Jak P', subtitle: 'Candidate: Jak Patel • Project: CRM v2', time: '03:00 PM', status: 'UPCOMING', color: '#3b82f6', icon: AlertCircleIcon }
        ],
        newlyAssigned: [
            { id: '1', title: 'Jak Patel assigned as Lead Developer', subtitle: 'Assigned to: Sneha Joshi • Project: Mobile App', time: '09:30 AM', status: 'NEW', color: '#10b981', icon: BellIcon }
        ]
    };

    // Live binding Action Center items from live database lists
    const remindersList = stats
        ? (stats.reminders || []).map((r: any) => ({
            id: r._id,
            title: r.title,
            subtitle: `Candidate: ${r.candidate?.name || 'N/A'} • ID: ${r.candidate?.applicationId || 'N/A'}`,
            time: new Date(r.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: new Date(r.reminderTime).getTime() < new Date().getTime() ? 'OVERDUE' : 'DUE TODAY',
            color: new Date(r.reminderTime).getTime() < new Date().getTime() ? '#f43f5e' : '#f59e0b',
            icon: ClockIcon,
            candidate: r.candidate
        }))
        : mockActionItems.reminders;

    const ticketsList = stats
        ? (stats.pendingTickets || []).map((c: any) => ({
            id: c._id,
            title: `Portal Ticket for ${c.name}`,
            subtitle: `Candidate ID: ${c.applicationId} • Phone: ${c.phone || 'N/A'}`,
            time: c.tickets?.[0]?.expdate ? new Date(c.tickets[0].expdate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A',
            status: c.tickets?.[0]?.portalStatus || 'PENDING',
            color: c.tickets?.[0]?.portalStatus === 'Pending' ? '#f59e0b' : '#f43f5e',
            icon: ListIcon,
            candidate: c
        }))
        : mockActionItems.tickets;

    const assessmentList = stats
        ? (stats.assessmentPending || []).map((c: any) => ({
            id: c._id,
            title: `Assessment: ${c.name}`,
            subtitle: `Candidate ID: ${c.applicationId} • Location: ${c.location || 'N/A'}`,
            time: new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            status: 'PENDING',
            color: '#8b5cf6',
            icon: AlertCircleIcon,
            candidate: c
        }))
        : mockActionItems.assessment;

    const newlyAssignedList = stats
        ? (stats.newAssigned || []).map((c: any) => ({
            id: c._id,
            title: `New Lead: ${c.name}`,
            subtitle: `Candidate ID: ${c.applicationId} • Phone: ${c.phone || 'N/A'}`,
            time: new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            status: 'NEW',
            color: '#10b981',
            icon: BellIcon,
            candidate: c
        }))
        : mockActionItems.newlyAssigned;

    const liveActionItems: any = {
        reminders: remindersList,
        tickets: ticketsList,
        assessment: assessmentList,
        newlyAssigned: newlyAssignedList
    };

    const pulseTeam = stats
        ? (stats.employeeStats || []).slice(0, 3).map((emp: any) => ({
            name: emp.name,
            role: emp.role,
            avatar: emp.profilePhoto || null,
            initial: emp.name.charAt(0),
            active: (emp.taskCounts?.Todo || 0) + (emp.taskCounts?.['In Progress'] || 0) || 0,
            done: emp.taskCounts?.Completed || 0,
            pending: emp.candidateCount || emp.taskCounts?.Cancelled || 0
        }))
        : [
            { name: 'Sneha Joshi', role: 'Recruiter', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', initial: 'SJ', active: 12, done: 8, pending: 4 },
            { name: 'Anjali Nair', role: 'Manager', avatar: null, initial: 'AN', active: 18, done: 12, pending: 6 },
            { name: 'Ritesh Kumar', role: 'Team Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', initial: 'RK', active: 15, done: 10, pending: 5 }
        ];

    const fullPulseTeam = stats
        ? (stats.employeeStats || []).map((emp: any) => ({
            name: emp.name,
            role: emp.role,
            avatar: emp.profilePhoto || null,
            initial: emp.name.charAt(0),
            active: (emp.taskCounts?.Todo || 0) + (emp.taskCounts?.['In Progress'] || 0) || 0,
            done: emp.taskCounts?.Completed || 0,
            pending: emp.candidateCount || emp.taskCounts?.Cancelled || 0
        }))
        : pulseTeam;

    // Live binding recent candidates progress bars
    const bottomCandidates = stats
        ? (candidates || []).map((c: any) => ({
            ...c,
            name: c.name,
            location: `${c.location || 'No Location'} • ${c.phone || 'No Phone'}`,
            progress: Math.min(100, Math.max(10, Math.round(((c.email ? 20 : 0) + (c.phone ? 20 : 0) + (c.location ? 20 : 0) + (c.resume ? 40 : 0))))),
            initial: c.name.charAt(0),
            color: ['#6366f1', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6'][c.name.charCodeAt(0) % 5]
        }))
        : [];

    // Fallback feed items
    const feedItems = [
        { title: 'New candidate added', name: 'Rohan Mehta', subtitle: 'Project: Mobile App', time: '2m ago', icon: UserIcon, color: '#3b82f6' },
        { title: 'Assessment completed', name: 'Ananya Singh', subtitle: 'Project: CRM Integration', time: '15m ago', icon: CheckIcon, color: '#10b981' },
        { title: 'Candidate moved to Shortlisted', name: 'Vikram Rao', subtitle: 'Project: SaaS Dashboard', time: '1h ago', icon: SparklesIcon, color: '#f59e0b' },
        { title: 'Reminder sent', name: 'Neha Verma', subtitle: 'Project: Website Redesign', time: '2h ago', icon: BellIcon, color: '#8b5cf6' }
    ];

    // Live Candidates Activity Feed
    const dynamicFeed: any[] = [];
    if (stats?.recentCandidates && stats.recentCandidates.length > 0) {
        stats.recentCandidates.slice(0, 2).forEach((c: any, idx: number) => {
            dynamicFeed.push({
                title: 'New candidate added',
                name: c.name,
                subtitle: `Project: ${c.currentCompany || 'Mobile App'}`,
                time: idx === 0 ? '2m ago' : '15m ago',
                icon: UserIcon,
                color: '#3b82f6'
            });
        });
    }
    if (stats?.assessmentPending && stats.assessmentPending.length > 0) {
        stats.assessmentPending.slice(0, 1).forEach((c: any) => {
            dynamicFeed.push({
                title: 'Assessment pending',
                name: c.name,
                subtitle: `Location: ${c.location || 'Remote'}`,
                time: '1h ago',
                icon: CheckIcon,
                color: '#10b981'
            });
        });
    }
    if (stats?.reminders && stats.reminders.length > 0) {
        stats.reminders.slice(0, 1).forEach((r: any) => {
            dynamicFeed.push({
                title: 'Reminder created',
                name: r.title,
                subtitle: `Candidate: ${r.candidate?.name || 'N/A'}`,
                time: '2h ago',
                icon: BellIcon,
                color: '#8b5cf6'
            });
        });
    }

    const finalFeed = dynamicFeed.length > 0 ? dynamicFeed.slice(0, 4) : feedItems;

    // Live binding Task Completion from current user statistics
    const currentUserEmp = stats?.employeeStats?.find((emp: any) => emp.name === user?.name);
    const completedTasksCount = currentUserEmp?.taskCounts?.Completed;
    const inProgressTasksCount = currentUserEmp?.taskCounts?.['In Progress'];
    const pendingTasksCount = currentUserEmp?.taskCounts?.Todo;

    if (isManager) {
        return (
            <div className="fade-in dashboard-layout custom-scrollbar" style={{ background: '#f8fafc', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
                <DashboardManager stats={stats} onOpenTicketModal={handleOpenTicketEditModal} />
                
                {/* 4 Bottom Widgets Row */}
                <div className="dashboard-bottom-grid" style={{ marginTop: '0.5rem' }}>
                    {/* Column 1: Task Completion */}
                    <TaskCompletionWidget
                        completed={completedTasksCount}
                        inProgress={inProgressTasksCount}
                        pending={pendingTasksCount}
                    />

                    {/* Column 2: Attendance */}
                    <AttendanceWidget
                        rate={stats?.attendance?.present}
                        todayAttendance={todayAttendance}
                        period={attendancePeriod}
                        onPeriodChange={setAttendancePeriod}
                        onPunchIn={handlePunchIn}
                        onPunchOut={handlePunchOut}
                    />

                    {/* Column 3: Recent Candidates */}
                    <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Recent Candidates</h3>
                            <Link to="/candidates" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>View all</Link>
                        </div>

                        <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            {bottomCandidates.map((c, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        if (c._id) {
                                            setSelectedCandidate(c);
                                            setIsDetailModalOpen(true);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        borderBottom: i === bottomCandidates.length - 1 ? 'none' : '1px solid #f8fafc',
                                        paddingBottom: '6px',
                                        cursor: c._id ? 'pointer' : 'default'
                                    }}
                                >
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: `${c.color}15`,
                                        color: c.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.72rem',
                                        fontWeight: 'bold',
                                        minWidth: '28px'
                                    }}>
                                        {c.initial}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>{c.location}</span>
                                    </div>
                                    <div style={{ width: '56px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>{c.progress}%</span>
                                        <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: `${c.progress}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 4: Total Candidates Feed */}
                    <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Total Candidates Feed</h3>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}>View all</span>
                        </div>

                        <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            {finalFeed.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: `${item.color}12`,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '24px',
                                        marginTop: '2px'
                                    }}>
                                        <item.icon size={12} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.title}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', marginTop: '1px' }}>{item.name}</span>
                                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '1px' }}>{item.subtitle}</span>
                                    </div>
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', marginTop: '2px' }}>{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {renderTicketEditModal()}
                {punchModal && (
                    <Modal
                        isOpen={punchModal.isOpen}
                        onClose={() => setPunchModal(null)}
                        title={punchModal.title}
                        size="md"
                    >
                        <div style={{ padding: '10px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                                {punchModal.message}
                            </p>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    function renderTicketEditModal() {
        if (!isTicketModalOpen || !ticketModalCandidate) return null;
        return (
            <Modal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                title={`Manage Tickets - ${ticketModalCandidate.name}`}
                size="xl"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                        <button
                            onClick={() => setIsTicketModalOpen(false)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                color: '#475569',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleModalSaveTickets}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: 'none',
                                background: '#3b82f6',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Upper Fields (Company Multi & Date Filed) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-field-group">
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Company (Multi-select)</label>
                            <div className="custom-multi-select-container" style={{ position: 'relative' }}>
                                <div 
                                    className="multi-select-trigger" 
                                    onClick={() => setIsModalCompanyDropdownOpen(!isModalCompanyDropdownOpen)}
                                    style={{
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: '#fff'
                                    }}
                                >
                                    <span className="trigger-value" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                        {modalTicketForm.companyMulti.length > 0
                                            ? modalTicketForm.companyMulti.join(', ')
                                            : 'Select Companies'}
                                    </span>
                                    <ChevronDownIcon size={16} />
                                </div>

                                {isModalCompanyDropdownOpen && (
                                    <div 
                                        className="multi-select-dropdown"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            zIndex: 100,
                                            background: '#fff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            marginTop: '4px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                        }}
                                    >
                                        <div className="dropdown-search" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                            <button className="text-link-button" style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setModalTicketForm({ ...modalTicketForm, companyMulti: uniqueOpenCompanies })}>Select All</button>
                                            <button className="text-link-button" style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setModalTicketForm({ ...modalTicketForm, companyMulti: [] })}>Deselect All</button>
                                        </div>
                                        <div className="dropdown-options">
                                            {uniqueOpenCompanies.map((company: string) => {
                                                const isSelected = modalTicketForm.companyMulti.includes(company);
                                                return (
                                                    <div
                                                        key={company}
                                                        className={`multi-option-item ${isSelected ? 'selected' : ''}`}
                                                        style={{
                                                            padding: '8px 12px',
                                                            fontSize: '0.8rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                            background: isSelected ? '#f1f5f9' : 'transparent'
                                                        }}
                                                        onClick={() => {
                                                            const current = [...modalTicketForm.companyMulti];
                                                            if (isSelected) {
                                                                setModalTicketForm({ ...modalTicketForm, companyMulti: current.filter(c => c !== company) });
                                                            } else {
                                                                setModalTicketForm({ ...modalTicketForm, companyMulti: [...current, company] });
                                                            }
                                                        }}
                                                    >
                                                        <span>{company}</span>
                                                        {isSelected && <CheckIcon size={14} color="#3b82f6" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-field-group">
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Date Filed</label>
                            <AppDateInput
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '0.8rem',
                                    width: '100%',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                value={modalTicketForm.dateFiled}
                                onChange={(e) => setModalTicketForm({ ...modalTicketForm, dateFiled: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="tickets-management-section" style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                <FileTextIcon size={16} /> Tickets Management
                            </h4>
                            {modalSelectedTicketIndices.length > 0 && (
                                <button 
                                    onClick={handleModalBulkDeleteTickets}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        borderRadius: '4px',
                                        background: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <TrashIcon size={12} /> Delete Selected ({modalSelectedTicketIndices.length})
                                </button>
                            )}
                        </div>

                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ width: '40px', padding: '10px', textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                onChange={handleModalSelectAllTickets} 
                                                checked={modalTickets.length > 0 && modalSelectedTicketIndices.length === modalTickets.length}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </th>
                                        <th style={{ padding: '10px' }}>Ticket No</th>
                                        <th style={{ padding: '10px' }}>Company</th>
                                        <th style={{ padding: '10px' }}>Upload Date</th>
                                        <th style={{ padding: '10px' }}>Exp. Date</th>
                                        <th style={{ padding: '10px' }}>Crt Date</th>
                                        <th style={{ padding: '10px' }}>Type</th>
                                        <th style={{ padding: '10px' }}>Status Changes</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalTickets.map((t: any, idx: number) => (
                                        <tr key={`modal-ticket-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={modalSelectedTicketIndices.includes(idx)} 
                                                    onChange={() => handleModalToggleSelectTicket(idx)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <input
                                                    type="text"
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }}
                                                    value={t.ticketNo || ''}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'ticketNo', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <select
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', background: '#fff' }}
                                                    value={t.companyName || ''}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'companyName', e.target.value)}
                                                    disabled={!t.ticketNo?.trim()}
                                                >
                                                    <option value="">Select Company</option>
                                                    {modalTicketForm.companyMulti.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <AppDateInput
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }}
                                                    value={t.uploaddate ? t.uploaddate.split('T')[0] : ''}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'uploaddate', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <AppDateInput
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }}
                                                    value={t.expdate ? t.expdate.split('T')[0] : ''}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'expdate', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <AppDateInput
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }}
                                                    value={t.crtdate ? t.crtdate.split('T')[0] : ''}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'crtdate', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <select
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', background: '#fff' }}
                                                    value={t.type || 'Banca'}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'type', e.target.value)}
                                                >
                                                    <option>Banca</option>
                                                    <option>Agency</option>
                                                    <option>Direct</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <select
                                                    style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '0.78rem', width: '100%', background: '#fff' }}
                                                    value={t.portalStatus || 'Pending'}
                                                    onChange={(e) => handleModalUpdateTicket(idx, 'portalStatus', e.target.value)}
                                                >
                                                    <option>Pending</option>
                                                    <option>Completed</option>
                                                    <option>In Progress</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleModalCloneTicket(idx)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}
                                                        title="Clone Ticket"
                                                    >
                                                        <CopyIcon size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleModalDeleteTicket(idx)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                                        title="Delete Ticket"
                                                    >
                                                        <TrashIcon size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {modalTickets.length === 0 && (
                                        <tr>
                                            <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                                No tickets found. Add one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={handleModalAddTicketRow}
                            style={{
                                marginTop: '10px',
                                padding: '6px 12px',
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#475569',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            + Add New Ticket
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    return (
        <div className="fade-in dashboard-layout custom-scrollbar" style={{ background: '#f8fafc', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>

            {/* Header Date Range Bar */}
            <div className="dashboard-header-container" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                    <span style={{ color: '#64748b' }}>From:</span>
                    <AppDateInput
                        value={startDate}
                        max={endDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: '0.78rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#64748b' }}>To:</span>
                    <AppDateInput
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: '0.78rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    />
                </div>
            </div>

            {/* Upper Split Grid: Stats & Action Center (Left) + Team Pulse Sidebar (Right) */}
            <div className="dashboard-main-grid">

                {/* Left Part: Top KPI Row + Action Center & Candidate Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>

                    {/* 4 Stats Cards Row */}
                    <div className="stats-row">
                        <ModernStatsCard
                            title="Total Candidates"
                            value={stats?.counters?.totalCandidates ?? 0}
                            percent="12"
                            icon={UserIcon}
                            chartData={getTrendData('total', stats?.counters?.totalCandidates ?? 0)}
                            color="#3b82f6"
                        />
                        <ModernStatsCard
                            title="New Assigned"
                            value={stats?.counters?.newAssignedCount ?? 0}
                            percent="8"
                            icon={BellIcon}
                            chartData={getTrendData('new', stats?.counters?.newAssignedCount ?? 0)}
                            color="#f59e0b"
                        />
                        <ModernStatsCard
                            title="Reminders"
                            value={stats?.counters?.remindersCount ?? 0}
                            percent="5"
                            icon={ClockIcon}
                            chartData={getTrendData('reminders', stats?.counters?.remindersCount ?? 0)}
                            color="#8b5cf6"
                        />
                        <ModernStatsCard
                            title="Assessment Pending"
                            value={stats?.counters?.assessmentPendingCount ?? 0}
                            percent="15"
                            icon={AlertCircleIcon}
                            chartData={getTrendData('assessment', stats?.counters?.assessmentPendingCount ?? 0)}
                            color="#06b6d4"
                        />
                    </div>

                    {/* Middle row: Action Center + Candidate Summary */}
                    <div className="dashboard-middle-grid">

                        {/* Action Center */}
                        <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Action Center</h3>
                                <div className="tab-nav" style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                                    {[
                                        { id: 'reminders', label: 'Reminders', count: stats?.counters?.remindersCount ?? 0 },
                                        { id: 'tickets', label: 'Tickets', count: stats?.counters?.pendingTicketsCount ?? 0 },
                                        { id: 'assessment', label: 'Assessments', count: stats?.counters?.assessmentPendingCount ?? 0 },
                                        { id: 'newlyAssigned', label: 'New', count: stats?.counters?.newAssignedCount ?? 0 }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveList(tab.id as any)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                background: activeList === tab.id ? '#3b82f6' : 'transparent',
                                                color: activeList === tab.id ? '#ffffff' : '#64748b',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span>{tab.label}</span>
                                            <span style={{
                                                fontSize: '0.62rem',
                                                background: activeList === tab.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                                color: activeList === tab.id ? '#ffffff' : '#475569',
                                                padding: '1px 5px',
                                                borderRadius: '6px'
                                            }}>{tab.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action List Items */}
                            <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', overflowX: 'hidden' }}>
                                {liveActionItems[activeList].map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="candidate-item"
                                        onClick={() => {
                                            if (item.candidate) {
                                                if (activeList === 'tickets') {
                                                    handleOpenTicketEditModal(item.candidate);
                                                } else {
                                                    setSelectedCandidate(item.candidate);
                                                    setIsDetailModalOpen(true);
                                                }
                                            }
                                        }}
                                        style={{
                                            borderLeft: `4px solid ${item.color}`,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                                            cursor: item.candidate ? 'pointer' : 'default'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: `${item.color}12`,
                                            color: item.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '32px'
                                        }}>
                                            <item.icon size={16} />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{item.subtitle}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{item.time}</div>
                                                <span style={{
                                                    fontSize: '0.62rem',
                                                    fontWeight: 800,
                                                    color: item.color,
                                                    background: `${item.color}12`,
                                                    padding: '1px 5px',
                                                    borderRadius: '4px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.2px'
                                                }}>{item.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>

                        {/* Candidate Summary Card */}
                        <CandidateSummaryCard
                            total={stats?.counters?.totalCandidates ?? 502}
                            scheduled={stats?.counters?.interviewedCount ?? 72}
                            shortlisted={stats?.counters?.shortlistedCount ?? 144}
                            joined={stats?.counters?.joinedCount ?? 0}
                        />
                    </div>
                </div>

                {/* Right Side: Team Pulse Sidebar Card */}
                <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                    <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                                <UsersIcon size={18} />
                            </span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Team Pulse</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span>All systems normal</span>
                        </div>
                    </div>

                    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        {pulseTeam.map((emp: any, index: number) => (
                            <EmployeeCard key={index} employee={emp} />
                        ))}
                    </div>

                    {/* Sidebar Footer */}
                    <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                        <span
                            onClick={() => setIsTeamDrawerOpen(true)}
                            style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            View full team <span style={{ fontSize: '10px' }}>→</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="dashboard-bottom-grid">

                {/* Column 1: Task Completion */}
                <TaskCompletionWidget
                    completed={completedTasksCount}
                    inProgress={inProgressTasksCount}
                    pending={pendingTasksCount}
                />

                {/* Column 2: Attendance */}
                <AttendanceWidget
                    rate={stats?.attendance?.present}
                    todayAttendance={todayAttendance}
                    period={attendancePeriod}
                    onPeriodChange={setAttendancePeriod}
                    onPunchIn={handlePunchIn}
                    onPunchOut={handlePunchOut}
                />

                {/* Column 3: Recent Candidates */}
                <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Recent Candidates</h3>
                        <Link to="/candidates" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>View all</Link>
                    </div>

                    <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {bottomCandidates.map((c, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    if (c._id) {
                                        setSelectedCandidate(c);
                                        setIsDetailModalOpen(true);
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: i === bottomCandidates.length - 1 ? 'none' : '1px solid #f8fafc',
                                    paddingBottom: '6px',
                                    cursor: c._id ? 'pointer' : 'default'
                                }}
                            >
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: `${c.color}15`,
                                    color: c.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 'bold',
                                    minWidth: '28px'
                                }}>
                                    {c.initial}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>{c.location}</span>
                                </div>
                                <div style={{ width: '56px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>{c.progress}%</span>
                                    <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${c.progress}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 4: Total Candidates Feed */}
                <div className="widget-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Total Candidates Feed</h3>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}>View all</span>
                    </div>

                    <div className="candidate-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {finalFeed.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: `${item.color}12`,
                                    color: item.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '24px',
                                    marginTop: '2px'
                                }}>
                                    <item.icon size={12} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.title}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', marginTop: '1px' }}>{item.name}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '1px' }}>{item.subtitle}</span>
                                </div>
                                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', marginTop: '2px' }}>{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Pulse Full Team Drawer */}
            <Drawer
                isOpen={isTeamDrawerOpen}
                onClose={() => setIsTeamDrawerOpen(false)}
                title="Full Team Activity & Pulse"
                width="450px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                        Showing real-time task productivity and active candidate pipelines for all system members.
                    </div>
                    {fullPulseTeam.map((emp: any, index: number) => (
                        <EmployeeCard key={index} employee={emp} />
                    ))}
                </div>
            </Drawer>

            {/* Candidate Detail Modal */}
            <CandidateDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedCandidate(null);
                }}
                candidate={selectedCandidate}
                baseUrl={BASE_URL}
            />

            {/* Punch In/Out Alert Modal */}
            {punchModal && (
                <Modal
                    isOpen={punchModal.isOpen}
                    onClose={() => setPunchModal(null)}
                    title={punchModal.title}
                    size="sm"
                    footer={
                        <button 
                            onClick={() => setPunchModal(null)}
                            style={{
                                background: punchModal.isError ? '#ef4444' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                width: '100%',
                                boxShadow: punchModal.isError ? '0 4px 10px rgba(239, 68, 68, 0.2)' : '0 4px 10px rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            Okay
                        </button>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '10px 0', textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: punchModal.isError ? '#fee2e2' : '#d1fae5',
                            color: punchModal.isError ? '#ef4444' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                        }}>
                            {punchModal.isError ? '❌' : '✅'}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                            {punchModal.message}
                        </p>
                    </div>
                </Modal>
            )}

            {/* Render Ticket Edit Modal */}
            {renderTicketEditModal()}
        </div>
    );
};

export default Dashboard;
