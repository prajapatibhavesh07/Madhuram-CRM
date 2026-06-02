import React from 'react';

export const ReportsIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="20" x2="18" y2="10" stroke={color}></line>
        <line x1="12" y1="20" x2="12" y2="4" stroke={secondaryColor || color}></line>
        <line x1="6" y1="20" x2="6" y2="14" stroke={color}></line>
    </svg>
);
