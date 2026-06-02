import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    secondaryColor?: string;
}

export const CakeIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", secondaryColor = "#FA801C" }) => {
    return (
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
            <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
            <path d="M4 16h16" />
            <path d="M10 9h4" />
            <path d="M9 5a3 3 0 0 1 6 0" />
            <path d="M12 2v3" stroke={secondaryColor} />
        </svg>
    );
};
