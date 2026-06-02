
export const SparklesIcon = ({ size = 24, color = 'currentColor' }: { size?: number | string; color?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
        <path d="M5 3l1 1" />
        <path d="M19 3l-1 1" />
        <path d="M5 21l1-1" />
        <path d="M19 21l-1-1" />
    </svg>
);
