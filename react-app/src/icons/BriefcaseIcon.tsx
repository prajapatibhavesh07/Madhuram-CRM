import React from 'react';

export const BriefcaseIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke={color}></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke={secondaryColor || color}></path>
    </svg>
);
