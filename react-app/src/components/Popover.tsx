import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const togglePopover = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <div ref={triggerRef} onClick={togglePopover} style={{ cursor: 'pointer' }}>
                {trigger}
            </div>
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="popover-content glass-card fade-in"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '0.5rem',
                        zIndex: 1000,
                        minWidth: '250px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        padding: '1rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-sidebar)'
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default Popover;
