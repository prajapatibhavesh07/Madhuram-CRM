import React from 'react';
import type { IconProps } from './types';

export const ArrowUpRightIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
);
