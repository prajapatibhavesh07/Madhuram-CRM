import React from 'react';

export const UsersIcon = ({ size = 24, color = 'currentColor', secondaryColor, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string, secondaryColor?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color}></path>
        <circle cx="9" cy="7" r="4" stroke={color}></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={secondaryColor || color}></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={secondaryColor || color}></path>
    </svg>
);
