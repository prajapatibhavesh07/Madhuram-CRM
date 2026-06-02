import React from 'react';

export const CalendarIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color}></rect>
        <line x1="16" y1="2" x2="16" y2="6" stroke={secondaryColor || color}></line>
        <line x1="8" y1="2" x2="8" y2="6" stroke={secondaryColor || color}></line>
        <line x1="3" y1="10" x2="21" y2="10" stroke={color}></line>
    </svg>
);
