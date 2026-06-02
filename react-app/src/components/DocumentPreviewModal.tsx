import React from 'react';
import Modal from './Modal';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, fileUrl = '', fileName = '' }) => {
    const isPDF = fileUrl ? fileUrl.toLowerCase().endsWith('.pdf') : false;
    const isImage = fileUrl ? /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) : false;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Document Preview"
            subtitle={fileName}
            size="xl"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        Download Original
                    </a>
                </>
            }
        >
            <div className="preview-container">
                {isPDF ? (
                    <iframe
                        src={`${fileUrl}#toolbar=0`}
                        title={fileName}
                        className="preview-iframe"
                    />
                ) : isImage ? (
                    <div className="preview-image-wrapper">
                        <img src={fileUrl} alt={fileName} className="preview-image" />
                    </div>
                ) : (
                    <div className="preview-unsupported">
                        <div className="unsupported-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9.5" y1="13.5" x2="14.5" y2="18.5"></line><line x1="14.5" y1="13.5" x2="9.5" y2="18.5"></line></svg>
                        </div>
                        <h4>Format Not Supported</h4>
                        <p>Direct preview is not available for this file type.</p>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-16" style={{ textDecoration: 'none' }}>
                            Open in New Tab
                        </a>
                    </div>
                )}
            </div>

            <style>{`
                .preview-container {
                    width: 100%;
                    height: 75vh;
                    background: #f1f5f9;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                }
                .preview-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .preview-image-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                .preview-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .preview-unsupported {
                    text-align: center;
                    padding: 3rem;
                }
                .unsupported-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #fee2e2;
                    color: #ef4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }
                .preview-unsupported h4 { margin: 0 0 0.5rem; color: #1e293b; font-size: 1.25rem; font-weight: 800; }
                .preview-unsupported p { color: #64748b; margin: 0; }
                .mt-16 { margin-top: 16px; }
            `}</style>
        </Modal>
    );
};

export default DocumentPreviewModal;
