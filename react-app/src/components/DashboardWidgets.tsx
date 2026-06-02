import React from 'react';
import {
    ArrowUpRightIcon, PlayIcon, PauseIcon, SparklesIcon
} from '../icons';

// SVG cubic-bezier sparkline chart with gradient area fill
export const SparklineChart = ({ data, color = '#6366f1' }: { data: number[], color?: string }) => {
    if (!data || data.length === 0) return null;
    const width = 300;
    const height = 52;
    const padding = 2;

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
        return { x, y };
    });

    let path = '';
    if (points.length > 0) {
        path += `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 3;
            const cp1y = p0.y;
            const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
            const cp2y = p1.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
    }

    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    const gradId = `sparkline-grad-${color.replace('#', '')}-${Math.floor(Math.random() * 10000)}`;

    return (
        <div style={{ width: '100%', height: `${height}px`, overflow: 'hidden', marginTop: 'auto' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#${gradId})`} />
                <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};

export const AttendanceDonut = ({ present, absent }: { present: number, absent: number }) => {
    const total = present + absent || 1;
    const percentage = Math.round((present / total) * 100);
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="donut-chart-box">
            <div className="donut-chart-wrapper">
                <svg width="100" height="100" viewBox="0 0 100 100" className="donut-chart-svg">
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                    />
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="donut-chart-overlay">
                    <div className="donut-chart-percentage">{percentage}%</div>
                </div>
            </div>
            <div className="donut-chart-legend" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <div className="donut-chart-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="donut-chart-dot donut-chart-dot--present" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                    <span className="donut-chart-legend-text" style={{ fontSize: '11px', color: '#64748b' }}>Present: {present}</span>
                </div>
                <div className="donut-chart-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="donut-chart-dot donut-chart-dot--absent" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f1f5f9' }}></div>
                    <span className="donut-chart-legend-text" style={{ fontSize: '11px', color: '#64748b' }}>Absent: {absent}</span>
                </div>
            </div>
        </div>
    );
};

export const TimeTracker = ({
    onToggle,
    isPunchedIn,
    inTime,
    onPunchIn,
    onPunchOut
}: {
    onToggle: () => void,
    isPunchedIn: boolean,
    inTime?: string,
    onPunchIn: () => void,
    onPunchOut: () => void
}) => {
    const [elapsed, setElapsed] = React.useState('00:00:00');

    React.useEffect(() => {
        let interval: any;
        if (isPunchedIn && inTime) {
            const updateTimer = () => {
                const start = new Date(inTime).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, now - start);

                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);

                setElapsed(
                    `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                );
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsed('00:00:00');
        }
        return () => clearInterval(interval);
    }, [isPunchedIn, inTime]);

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = isPunchedIn ? Math.min(100, ((new Date().getTime() - new Date(inTime || 0).getTime()) / (9 * 3600000)) * 100) : 0;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="time-tracker-container">
            <button className="widget-toggle-btn" onClick={onToggle} title="Switch View">
                <ArrowUpRightIcon size={18} />
            </button>

            <h3 className="sidebar-title-large" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 700 }}>Time tracker</h3>

            <div className="time-tracker-visual">
                <svg width="140" height="140" viewBox="0 0 140 140" className="time-tracker-svg">
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="transparent"
                        className="track"
                        strokeWidth="2"
                    />
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="transparent"
                        className={`progress ${isPunchedIn ? 'active' : ''}`}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="time-tracker-center" style={{ position: 'absolute', textAlign: 'center' }}>
                    <div className="time-tracker-time" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{elapsed}</div>
                    <div className="time-tracker-label" style={{ fontSize: '11px', color: '#64748b' }}>{isPunchedIn ? 'Work Time' : 'Not Started'}</div>
                </div>
            </div>

            <div className="time-tracker-controls" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                {!isPunchedIn ? (
                    <button className="punch-action-btn in" onClick={onPunchIn} style={{ padding: '8px 24px', borderRadius: '12px', fontSize: '14px', width: 'auto' }}>
                        <PlayIcon size={16} />
                        <span>Punch In</span>
                    </button>
                ) : (
                    <button className="punch-action-btn out" onClick={onPunchOut} style={{ padding: '8px 24px', borderRadius: '12px', fontSize: '14px', width: 'auto', background: '#64748b' }}>
                        <PauseIcon size={16} />
                        <span>Punch Out</span>
                    </button>
                )}
            </div>

            <div style={{ position: 'absolute', bottom: '10px', right: '10px', opacity: 0.2 }}>
                <SparklesIcon size={18} />
            </div>
        </div>
    );
};

export const MiniBarChart = ({ data, color = '#6366f1' }: { data: number[], color?: string }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const max = Math.max(...data, 1);

    return (
        <div className="mini-chart-container" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="mini-chart-bars" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '40px', gap: '4px' }}>
                {data.map((val, i) => {
                    const height = (val / max) * 100;
                    const isLast = i === data.length - 1;
                    return (
                        <div key={i} className="mini-chart-bar-item" style={{ flex: 1, position: 'relative' }}>
                            <div
                                className="mini-chart-bar"
                                style={{
                                    height: `${Math.max(height, 10)}%`,
                                    background: isLast ? color : '#e2e8f0',
                                    borderRadius: '4px',
                                    transition: 'all 0.3s'
                                }}
                            ></div>
                        </div>
                    );
                })}
            </div>
            <div className="mini-chart-labels" style={{ display: 'flex', justifyContent: 'space-between' }}>
                {days.map((d, i) => (
                    <span key={i} className="mini-chart-label" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
                ))}
            </div>
        </div>
    );
};

// High-fidelity Stats Card with a beautiful smooth sparkline at the bottom
export const ModernStatsCard = ({ title, value, percent, icon: Icon, chartData, color = '#6366f1' }: any) => {
    // In the mockup, Total Candidates, New Assigned, Assessment Pending are positive trend (green), Reminders is red
    const isUp = title !== 'Reminders';

    return (
        <div className="modern-stats-card" style={{ padding: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden', background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)' }}>
            <div className="modern-stats-card-header" style={{ padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modern-stats-card-icon-wrapper" style={{
                    background: `${color}12`,
                    color: color,
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '42px'
                }}>
                    <Icon size={20} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{title}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</span>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isUp ? '#10b981' : '#f43f5e',
                            background: isUp ? '#ecfdf5' : '#fff1f2',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center'
                        }}>
                            {isUp ? '↑' : '↑'} {percent}%
                        </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>vs last 7 days</span>
                </div>
            </div>
            <SparklineChart data={chartData} color={color} />
        </div>
    );
};

// 4-Column Bottom Section Widgets
export const TaskCompletionWidget = ({ completed = 136, inProgress = 44, pending = 20 }: { completed?: number, inProgress?: number, pending?: number }) => {
    const total = completed + inProgress + pending || 1;
    const completedPct = Math.round((completed / total) * 100);
    const inProgressPct = Math.round((inProgress / total) * 100);

    const radius = 38;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;

    const compOffset = circumference - (completedPct / 100) * circumference;

    return (
        <div className="widget-card" style={{ minHeight: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="widget-header" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Task Completion</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', flex: 1, padding: '0.5rem 0' }}>
                {/* Donut Chart */}
                <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background (Pending/Grey) */}
                        <circle
                            cx="48" cy="48" r={radius}
                            fill="transparent"
                            stroke="#e2e8f0"
                            strokeWidth={strokeWidth}
                        />
                        {/* In Progress (Orange) */}
                        <circle
                            cx="48" cy="48" r={radius}
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - ((completedPct + inProgressPct) / 100) * circumference}
                            strokeLinecap="round"
                        />
                        {/* Completed (Blue) */}
                        <circle
                            cx="48" cy="48" r={radius}
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={compOffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{completedPct}%</span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Completed</span>
                    </div>
                </div>

                {/* Legends */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                        <span style={{ color: '#1e293b' }}>Completed</span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 550 }}>{completedPct}% ({completed})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                        <span style={{ color: '#1e293b' }}>In Progress</span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 550 }}>{inProgressPct}% ({inProgress})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                        <span style={{ color: '#1e293b' }}>Pending</span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 550 }}>{Math.round((pending / total) * 100)}% ({pending})</span>
                    </div>
                </div>
            </div>

            {/* Avg Completion Time Banner */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', border: '1px solid #f1f5f9' }}>
                <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Avg. Completion Time</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>2.4 days</div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center' }}>
                    -0.6 days <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '4px' }}>vs last 7d</span>
                </div>
            </div>
        </div>
    );
};

export const AttendanceWidget = ({
    todayAttendance,
    rate = 92,
    period = 'This Week',
    onPeriodChange,
    onPunchIn,
    onPunchOut
}: {
    todayAttendance?: any;
    rate?: number;
    period?: string;
    onPeriodChange?: (period: string) => void;
    onPunchIn?: () => void;
    onPunchOut?: () => void;
}) => {
    const isPunchedIn = !!(todayAttendance && !todayAttendance.outTime);
    const hasCompletedShift = !!(todayAttendance && todayAttendance.inTime && todayAttendance.outTime);
    const inTime = todayAttendance?.inTime;

    const [elapsed, setElapsed] = React.useState('00:00:00');

    React.useEffect(() => {
        let interval: any;
        if (isPunchedIn && inTime) {
            const updateTimer = () => {
                const start = new Date(inTime).getTime();
                const now = new Date().getTime();
                const diff = Math.max(0, now - start);

                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);

                setElapsed(
                    `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                );
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsed('00:00:00');
        }
        return () => clearInterval(interval);
    }, [isPunchedIn, inTime]);

    let days: string[] = [];
    let attendanceData: { label: string, present: number, absent: number }[] = [];

    if (period === 'Month') {
        days = ['W1', 'W2', 'W3', 'W4'];
        attendanceData = [
            { label: 'W1', present: 95, absent: 5 },
            { label: 'W2', present: 88, absent: 12 },
            { label: 'W3', present: 92, absent: 8 },
            { label: 'W4', present: rate, absent: 100 - rate }
        ];
    } else if (period === 'Year') {
        days = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        attendanceData = [
            { label: 'J', present: 90, absent: 10 },
            { label: 'F', present: 94, absent: 6 },
            { label: 'M', present: 92, absent: 8 },
            { label: 'A', present: 88, absent: 12 },
            { label: 'M', present: rate, absent: 100 - rate },
            { label: 'J', present: 0, absent: 0 },
            { label: 'J', present: 0, absent: 0 },
            { label: 'A', present: 0, absent: 0 },
            { label: 'S', present: 0, absent: 0 },
            { label: 'O', present: 0, absent: 0 },
            { label: 'N', present: 0, absent: 0 },
            { label: 'D', present: 0, absent: 0 }
        ];
    } else {
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        attendanceData = [
            { label: 'M', present: 100, absent: 0 },
            { label: 'T', present: 100, absent: 0 },
            { label: 'W', present: 100, absent: 0 },
            { label: 'T', present: 100, absent: 0 },
            { label: 'F', present: rate > 70 ? rate : 70, absent: rate > 70 ? 100 - rate : 30 },
            { label: 'S', present: 0, absent: 100 },
            { label: 'S', present: 0, absent: 100 }
        ];
    }

    return (
        <div className="widget-card" style={{ minHeight: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div className="widget-header" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Attendance</h3>

                <select
                    value={period}
                    onChange={(e) => onPeriodChange?.(e.target.value)}
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        outline: 'none',
                        height: '28px',
                        width: 'auto'
                    }}
                >
                    <option value="This Week">This Week</option>
                    <option value="Month">Month</option>
                    <option value="Year">Year</option>
                </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Time Tracked</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                        {isPunchedIn ? elapsed : '36h 45m'}
                    </span>
                </div>

                <div>
                    {hasCompletedShift ? (
                        <button
                            disabled
                            style={{
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <span>Punched Out</span>
                        </button>
                    ) : !isPunchedIn ? (
                        <button
                            onClick={onPunchIn}
                            style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            <span>Punch In</span>
                        </button>
                    ) : (
                        <button
                            onClick={onPunchOut}
                            style={{
                                background: '#f43f5e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(244, 63, 94, 0.2)'
                            }}
                        >
                            <span>Punch Out</span>
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Daily Average</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginTop: '1px' }}>7h 21m</div>
                </div>
                <div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Attendance Rate</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginTop: '1px' }}>{rate}%</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '80px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '64px', gap: period === 'Year' ? '2px' : '6px' }}>
                    {attendanceData.map((d, i) => (
                        <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div style={{ width: '100%', maxWidth: '8px', height: '100%', background: '#e2e8f0', borderRadius: '4px', display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
                                {d.present > 0 && <div style={{ width: '100%', height: `${d.present}%`, background: '#3b82f6' }}></div>}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: '0 2px' }}>
                    {attendanceData.map((d, i) => (
                        <span key={i} style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, width: period === 'Year' ? 'auto' : '12px', textAlign: 'center', flex: 1 }}>
                            {period === 'Year' ? d.label : days[i]?.[0]}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }}></div>
                    <span>Present</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#e2e8f0' }}></div>
                    <span>Absent</span>
                </div>
            </div>
        </div>
    );
};
