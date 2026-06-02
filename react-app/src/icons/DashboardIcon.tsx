import React from 'react';

export const DashboardIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="7" height="7" stroke={color}></rect>
        <rect x="14" y="3" width="7" height="7" stroke={secondaryColor || color}></rect>
        <rect x="14" y="14" width="7" height="7" stroke={color}></rect>
        <rect x="3" y="14" width="7" height="7" stroke={secondaryColor || color}></rect>
    </svg>
);
