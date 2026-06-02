import React from 'react';

export const PinIcon = ({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-2l-1-4V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6l-1 4v2z" />
  </svg>
);
