import React from 'react';

export const GripVerticalIcon = ({ size = 24, color = 'currentColor', ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
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
        <circle cx="9" cy="12" r="1" fill={color} />
        <circle cx="9" cy="5" r="1" fill={color} />
        <circle cx="9" cy="19" r="1" fill={color} />
        <circle cx="15" cy="12" r="1" fill={color} />
        <circle cx="15" cy="5" r="1" fill={color} />
        <circle cx="15" cy="19" r="1" fill={color} />
    </svg>
);
