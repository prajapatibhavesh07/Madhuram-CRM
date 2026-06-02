import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    secondaryColor?: string;
    style?: React.CSSProperties;
}

export const DatabaseIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', secondaryColor, style, ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style}
            {...props}
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" stroke={color}></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke={secondaryColor || color}></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={color}></path>
        </svg>
    );
};
