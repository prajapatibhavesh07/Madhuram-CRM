import React from 'react';

export const UserIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color}></path>
        <circle cx="12" cy="7" r="4" stroke={secondaryColor || color}></circle>
    </svg>
);
