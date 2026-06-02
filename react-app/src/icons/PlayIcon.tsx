import React from 'react';
import type { IconProps } from './types';

export const PlayIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);
