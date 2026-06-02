import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    hideHeader?: boolean;
    padding?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    subtitle?: string;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer, 
    maxWidth, 
    hideHeader = false, 
    padding,
    size = 'md',
    subtitle
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container modal-${size}`}
                style={maxWidth ? { maxWidth } : {}}
                onClick={e => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="modal-header">
                        <div className="modal-title-group">
                            <h2>{title}</h2>
                            {subtitle && <span className="modal-subtitle">{subtitle}</span>}
                        </div>
                        <button
                            onClick={onClose}
                            className="modal-close-btn"
                            aria-label="Close modal"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                <div className="modal-body" style={padding ? { padding } : {}}>
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
