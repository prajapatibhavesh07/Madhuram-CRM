import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../icons';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    hideHeader?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, width = '800px', hideHeader = false }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="drawer-overlay" onClick={onClose}>
            <div
                className={`drawer-content ${isOpen ? 'open' : ''}`}
                style={{ width }}
                onClick={e => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="drawer-header">
                        <h2 className="drawer-title">{title}</h2>
                        <button className="drawer-close-btn" onClick={onClose} title="Close">
                            <XIcon size={24} />
                        </button>
                    </div>
                )}
                <div className="drawer-body" style={{ paddingTop: hideHeader ? 0 : '1rem' }}>
                    {children}
                </div>
            </div>
            <style>{`
                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 20000;
                    display: flex;
                    justify-content: flex-end;
                    animation: fadeIn 0.3s ease-out;
                }
                .drawer-content {
                    background: #f8fafc;
                    height: 100%;
                    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .drawer-content.open {
                    transform: translateX(0);
                }
                .drawer-header {
                    padding: 1rem 2rem;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .drawer-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .drawer-close-btn {
                    background: #f1f5f9;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }
                .drawer-close-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                    transform: rotate(90deg);
                }
                .drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem 1rem 0rem 1rem;
                    overflow-x: hidden !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default Drawer;
