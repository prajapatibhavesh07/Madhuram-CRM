import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + rect.width / 2,
            });
        }
    };

    useEffect(() => {
        if (show) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [show]);

    return (
        <div
            ref={triggerRef}
            className="tooltip-container"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && createPortal(
                <div
                    className={`tooltip-box tooltip-portal tooltip-${position}`}
                    style={{
                        position: 'absolute',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        transform: position === 'top' ? 'translate(-50%, -100%) translateY(-10px)' :
                            position === 'bottom' ? 'translate(-50%, 10px)' :
                                position === 'left' ? 'translate(-100%, -50%) translateX(-10px)' :
                                    'translate(0, -50%) translateX(10px)'
                    }}
                >
                    {text}
                    <div className="tooltip-arrow"></div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;
