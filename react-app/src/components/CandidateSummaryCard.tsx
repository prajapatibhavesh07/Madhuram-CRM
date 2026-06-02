import React from 'react';

interface CandidateSummaryCardProps {
    total: number;
    scheduled: number;
    shortlisted: number;
    joined: number;
}

const CandidateSummaryCard: React.FC<CandidateSummaryCardProps> = ({
    total = 0,
    scheduled = 0,
    shortlisted = 0,
    joined = 0
}) => {
    const displayTotal = total;
    const displayScheduled = scheduled;
    const displayShortlisted = shortlisted;
    const displayCompleted = joined;
    const displayPending = Math.max(0, displayTotal - (displayScheduled + displayShortlisted + displayCompleted));

    // We compute a safe denominator to ensure percentages never exceed 100% or result in NaN/Infinity division by zero
    const categorySum = displayScheduled + displayShortlisted + displayCompleted + displayPending;
    const denominator = Math.max(displayTotal, categorySum, 1);

    // Percentages protected mathematically
    const sPct = Math.min(100, Math.round((displayScheduled / denominator) * 100)) || 0;
    const cPct = Math.min(100, Math.round((displayCompleted / denominator) * 100)) || 0;
    const slPct = Math.min(100, Math.round((displayShortlisted / denominator) * 100)) || 0;
    const pPct = Math.min(100, Math.round((displayPending / denominator) * 100)) || 0;

    // State for interactive hovers
    const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);

    // Configuration for concentric rings (from outermost to innermost)
    const categories = [
        {
            key: 'scheduled',
            label: 'Scheduled',
            value: displayScheduled,
            percentage: sPct,
            color: '#2a5c4e', // Outermost: Dark forest green/teal
            radius: 127,
            circumference: 2 * Math.PI * 127,
        },
        {
            key: 'completed',
            label: 'Completed',
            value: displayCompleted,
            percentage: cPct,
            color: '#a8f35c', // Second: Lime/light green
            radius: 104,
            circumference: 2 * Math.PI * 104,
        },
        {
            key: 'shortlisted',
            label: 'Shortlisted',
            value: displayShortlisted,
            percentage: slPct,
            color: '#6abf4b', // Third: Medium green
            radius: 81,
            circumference: 2 * Math.PI * 81,
        },
        {
            key: 'pending',
            label: 'Pending',
            value: displayPending,
            percentage: pPct,
            color: '#f0b429', // Innermost: Golden yellow
            radius: 58,
            circumference: 2 * Math.PI * 58,
        }
    ];

    const activeCat = hoveredCategory ? categories.find(c => c.key === hoveredCategory) : null;
    const centerLabel = activeCat ? activeCat.label : 'Total';
    const centerValue = activeCat ? activeCat.value : displayTotal;
    const centerColor = activeCat ? activeCat.color : '#1e293b';
    const centerLabelColor = activeCat ? '#64748b' : '#94a3b8';

    // Completion Rate calculation (Joined/Total ratio)
    const completionRate = displayTotal > 0 ? Math.round((displayCompleted / displayTotal) * 100) : 0;

    return (
        <div className="widget-card" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minHeight: 'auto',
            height: '100%'
        }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Candidate Summary</h3>

            {/* Donut and Legend Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, padding: '0.5rem 0' }}>
                {/* Concentric Radialbar Chart */}
                <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '300px' }}>
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        {categories.map((cat) => {
                            const isCurrentHovered = hoveredCategory === cat.key;
                            const isAnyHovered = hoveredCategory !== null;
                            const opacity = isAnyHovered ? (isCurrentHovered ? 1 : 0.3) : 1;
                            const strokeWidth = isCurrentHovered ? 14 : 10;
                            const offset = cat.circumference - (cat.percentage / 100) * cat.circumference;

                            return (
                                <g key={cat.key} style={{ transition: 'all 0.3s ease' }}>
                                    {/* Grey background track */}
                                    <circle
                                        cx="150"
                                        cy="150"
                                        r={cat.radius}
                                        fill="transparent"
                                        stroke="#f1f5f9"
                                        strokeWidth={cat.radius === 58 && isCurrentHovered ? 14 : 10} // Match innermost track thickness on hover
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                    {/* Colored progress arc */}
                                    {cat.percentage > 0 && (
                                        <circle
                                            cx="150"
                                            cy="150"
                                            r={cat.radius}
                                            fill="transparent"
                                            stroke={cat.color}
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={cat.circumference}
                                            strokeDashoffset={offset}
                                            strokeLinecap="round"
                                            transform="rotate(-90 150 150)"
                                            style={{
                                                cursor: 'pointer',
                                                opacity: opacity,
                                                transition: 'stroke-dashoffset 0.8s ease-out, stroke-width 0.3s ease, opacity 0.3s ease',
                                            }}
                                            onMouseEnter={() => setHoveredCategory(cat.key)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Dynamic Center Text */}
                    <div style={{
                        position: 'absolute',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        background: 'transparent'
                    }}>

                        <span style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: centerColor,
                            lineHeight: 1.1,
                            transition: 'color 0.2s ease, transform 0.2s ease',
                            transform: hoveredCategory ? 'scale(1.08)' : 'scale(1)'
                        }}>
                            {centerValue}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: centerLabelColor,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            transition: 'color 0.2s ease',
                            marginTop: '4px'
                        }}>
                            {centerLabel}
                        </span>
                    </div>
                </div>

                {/* Legends */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, fontSize: '0.75rem', fontWeight: 600 }}>
                    {categories.map((cat) => {
                        const isCurrentHovered = hoveredCategory === cat.key;
                        const isAnyHovered = hoveredCategory !== null;
                        const itemOpacity = isAnyHovered ? (isCurrentHovered ? 1 : 0.4) : 1;

                        return (
                            <div
                                key={cat.key}
                                onMouseEnter={() => setHoveredCategory(cat.key)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    opacity: itemOpacity,
                                    transition: 'all 0.2s ease',
                                    transform: isCurrentHovered ? 'translateX(3px)' : 'translateX(0)',
                                    padding: '2px 0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: cat.color,
                                        boxShadow: isCurrentHovered ? `0 0 6px ${cat.color}` : 'none',
                                        transition: 'all 0.2s ease'
                                    }}></div>
                                    <span style={{
                                        color: isCurrentHovered ? '#1e293b' : '#475569',
                                        fontWeight: isCurrentHovered ? '700' : '600',
                                        transition: 'all 0.2s ease'
                                    }}>{cat.label}</span>
                                </div>
                                <span style={{
                                    color: isCurrentHovered ? cat.color : '#1e293b',
                                    fontWeight: '700',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {cat.value} ({cat.percentage}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Progress Bar Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>Completion Rate <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{completionRate}%</span></span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>+6% <span style={{ color: '#94a3b8', fontWeight: 550 }}>vs last 7 days</span></span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${completionRate}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default CandidateSummaryCard;
