import React from 'react';

export const ChevronDownIcon = ({ size = 24, color = "currentColor", ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);
