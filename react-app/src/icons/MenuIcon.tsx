import React from 'react';

export const MenuIcon = ({ size = 24, color = 'currentColor', className = '', ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
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
        className={className}
        {...props}
    >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);
