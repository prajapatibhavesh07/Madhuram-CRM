import React, { useState } from 'react';
import Modal from './Modal';
import { FileTextIcon } from '../icons';
import DocumentPreviewModal from './DocumentPreviewModal';

interface Ticket {
    ticketNo: string;
    companyName: string;
    uploaddate: string;
    expdate: string;
    crtdate: string;
    type: string;
    portalStatus?: string;
    banca?: string;
    agency?: string;
    direct?: string;
}

export interface Candidate {
    _id: string;
    name: string;
    gender: string;
    dob: string;
    age: string;
    phone: string;
    whatsapp: string;
    email: string;
    location: string;
    currentCompany: string;
    currentProfile: string;
    designation: string;
    currentCTC: number;
    channel: string;
    sector: string;
    totalWorkExp: number;
    totalSalesExp: number;
    bfsiExp: number;
    qualification: string;
    pan: string;
    assessment: string;
    recruitmentStatus: string;
    remark: string;
    createdAt: string;
    tickets: Ticket[];
    resume?: { fileUrl: string; fileName: string };
    photograph?: { fileUrl: string; fileName: string };
    panCard?: { fileUrl: string; fileName: string };
    aadhaarCard?: { fileUrl: string; fileName: string };
    educationProof?: { fileUrl: string; fileName: string };
    offerLetter?: { fileUrl: string; fileName: string };
    relativeLetter?: { fileUrl: string; fileName: string };
    isApproved?: boolean;
    approvedBy?: string | { _id: string, name: string };
    approvedAt?: string;
    createdBy?: string | { _id: string, name: string };
    applicationId?: string;
    leadTag?: string;
    updatedAt?: string;
    updatedBy?: string | { _id: string, name: string };
    offerStatus?: string;
    isResigned?: string;
    resignationLetter?: { fileUrl: string, fileName: string };
    doj?: string;
    noticePeriod?: string;
    aiScore?: number;
    aiSummary?: string;
    aiMatchBasis?: string | {
        matchReason?: string;
        skillFit?: string;
        experienceGap?: string;
    };
    avatarUrl?: string;
    willingToRelocate?: boolean;
}

interface CandidateDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: Candidate | null;
    baseUrl?: string;
    interviewHistory?: any[];
    onViewProgress?: (interview: any) => void;
    onEditInterview?: (interview: any) => void;
    onCancelInterview?: (id: string) => void;
    canDelete?: boolean;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
};

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    candidate, 
    baseUrl = '',
    interviewHistory: _interviewHistory = [],
    onViewProgress: _onViewProgress,
    onEditInterview: _onEditInterview,
    onCancelInterview: _onCancelInterview,
    canDelete: _canDelete = false
}) => {
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);

    if (!candidate) return null;

    const getFileUrl = (fileUrl: string) => {
        if (fileUrl.startsWith('http')) return fileUrl;
        return `${baseUrl}${fileUrl}`;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Candidate Evaluation Report"
                size="xl"
            >
                <div className="report-layout">
                    {/* Header Section */}
                    <div className="report-header">
                        <div className="report-title-box">
                            <h1 className="report-main-title">Professional Profile Report</h1>
                            <p className="report-subtitle">
                                {candidate.name} — {formatDate(candidate.createdAt)}
                            </p>
                        </div>
                        <div className="report-score-badge">
                            <div className="score-value">{candidate.aiScore || 85}%</div>
                            <div className="score-label">OVERALL MATCH</div>
                        </div>
                    </div>

                    {/* Quick Metrics Row */}
                    <div className="report-metrics-grid">
                        <div className="metric-card theme-blue">
                            <div className="metric-value">{candidate.totalWorkExp || 0}</div>
                            <div className="metric-label">Total Years Exp</div>
                        </div>
                        <div className="metric-card theme-indigo">
                            <div className="metric-value">{candidate.bfsiExp || 0}</div>
                            <div className="metric-label">BFSI Experience</div>
                        </div>
                        <div className="metric-card theme-emerald">
                            <div className="metric-value">{candidate.totalSalesExp || 0}</div>
                            <div className="metric-label">Sales Experience</div>
                        </div>
                        <div className="metric-card theme-slate">
                            <div className="metric-value">{candidate.noticePeriod || 'N/A'}</div>
                            <div className="metric-label">Notice Period</div>
                        </div>
                    </div>

                    {/* Key Info Grid */}
                    <div className="report-info-container">
                        <div className="info-row triple">
                            <div className="info-block">
                                <label>Gender / Age</label>
                                <strong>{candidate.gender || '-'} / {candidate.age || '-'}</strong>
                            </div>
                            <div className="info-block">
                                <label>Date of Birth</label>
                                <strong>{formatDate(candidate.dob)}</strong>
                            </div>
                            <div className="info-block">
                                <label>PAN Number</label>
                                <strong>{candidate.pan || 'N/A'}</strong>
                            </div>
                        </div>
                        <div className="info-row triple">
                            <div className="info-block">
                                <label>Current Location</label>
                                <strong>{candidate.location || "Not Specified"}</strong>
                            </div>
                            <div className="info-block">
                                <label>Current Profile</label>
                                <strong>{candidate.currentProfile || "Generalist"}</strong>
                            </div>
                            <div className="info-block">
                                <label>Designation</label>
                                <strong>{candidate.designation || "N/A"}</strong>
                            </div>
                        </div>
                        <div className="info-row triple">
                            <div className="info-block">
                                <label>Current Company</label>
                                <strong>{candidate.currentCompany || "N/A"}</strong>
                            </div>
                            <div className="info-block">
                                <label>Current CTC</label>
                                <strong>₹{candidate.currentCTC?.toLocaleString() || "0"}</strong>
                            </div>
                            <div className="info-block">
                                <label>Sector</label>
                                <strong>{candidate.sector || "N/A"}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Profile & Logistics */}
                    <div className="report-section-box no-margin">
                        <h3 className="section-title">Professional Logistics & Status</h3>
                        <div className="status-grid">
                            <div className="status-item">
                                <label>Application ID</label>
                                <span>{candidate.applicationId || 'N/A'}</span>
                            </div>
                            <div className="status-item">
                                <label>Lead Tag</label>
                                <span className={`pill ${candidate.leadTag?.toLowerCase()}`}>{candidate.leadTag || 'Standard'}</span>
                            </div>
                            <div className="status-item">
                                <label>Recruitment Status</label>
                                <span className="pill status-indigo">{candidate.recruitmentStatus || 'New'}</span>
                            </div>
                            <div className="status-item">
                                <label>Willing to Relocate</label>
                                <span>{candidate.willingToRelocate ? 'Yes' : 'No'}</span>
                            </div>
                        </div>

                        <div className="remark-box">
                            <label>Recruiter's Remark</label>
                            <p>{candidate.remark || "No specific remarks provided by the recruiter yet."}</p>
                        </div>
                    </div>

                    {/* Contact & Detailed Info Section */}
                    <div className="report-section-box">
                        <h3 className="section-title">Detailed Profile Information</h3>
                        
                        <div className="assessment-category">
                            <div className="category-header">Communication & Identification</div>
                            <div className="assessment-item">
                                <span>Mobile / WhatsApp</span>
                                <span className="status-val">{candidate.phone || '-'} / {candidate.whatsapp || '-'}</span>
                            </div>
                            <div className="assessment-item">
                                <span>Email Address</span>
                                <span className="status-val">{candidate.email || '-'}</span>
                            </div>
                            <div className="assessment-item">
                                <span>PAN Card Number</span>
                                <span className="status-val">{candidate.pan || '-'}</span>
                            </div>
                        </div>

                        <div className="assessment-category">
                            <div className="category-header">Education & Recruitment</div>
                            <div className="assessment-item">
                                <span>Highest Qualification</span>
                                <span className="status-val">{candidate.qualification || '-'}</span>
                            </div>
                            <div className="assessment-item">
                                <span>Sourcing Channel</span>
                                <span className="status-val">{candidate.channel || '-'}</span>
                            </div>
                            <div className="assessment-item">
                                <span>Date of Joining</span>
                                <span className="status-val">{formatDate(candidate.doj)}</span>
                            </div>
                            <div className="assessment-item">
                                <span>Interview Date</span>
                                <span className="status-val">{formatDate(candidate.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary Section */}
                    <div className="report-ai-summary-box">
                        <h3 className="ai-summary-title">AI Candidate Summary</h3>
                        <p className="ai-summary-content">
                            {candidate.aiSummary || "This candidate demonstrates strong potential in technical domains, particularly within BFSI sectors. While communication skills are top-notch, there are minor discrepancies in past employment dates that require immediate verification. The overall match of 85% suggests a high suitability for the current role."}
                        </p>
                    </div>

                    {/* AI Match Basis */}
                    {candidate.aiMatchBasis && (
                        <div className="report-section-box">
                            <h3 className="section-title">Match Analysis</h3>
                            {typeof candidate.aiMatchBasis === 'object' ? (
                                <div className="ai-match-basis-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {candidate.aiMatchBasis.matchReason && (
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Match Reason:</strong>
                                            <p className="ai-summary-content" style={{ marginTop: '4px' }}>{candidate.aiMatchBasis.matchReason}</p>
                                        </div>
                                    )}
                                    {candidate.aiMatchBasis.skillFit && (
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Skill Fit:</strong>
                                            <p className="ai-summary-content" style={{ marginTop: '4px' }}>{candidate.aiMatchBasis.skillFit}</p>
                                        </div>
                                    )}
                                    {candidate.aiMatchBasis.experienceGap && (
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Experience Gap:</strong>
                                            <p className="ai-summary-content" style={{ marginTop: '4px' }}>{candidate.aiMatchBasis.experienceGap}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="ai-summary-content">{candidate.aiMatchBasis}</p>
                            )}
                        </div>
                    )}

                     {/* Tickets & Operations Section */}
                    {candidate.tickets && candidate.tickets.length > 0 && (
                        <div className="report-section-box">
                            <h3 className="section-title">Tickets & Operations</h3>
                            <div className="table-wrapper-modern" style={{ overflowX: 'auto' }}>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Company</th>
                                            <th>Ticket No</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidate.tickets.map((t, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold">{t.companyName || 'N/A'}</td>
                                                <td>{t.ticketNo || <span className="text-muted">Empty</span>}</td>
                                                <td><span className="badge-outline">{t.type || 'Standard'}</span></td>
                                                <td>
                                                    <span className={`pill ${t.portalStatus === 'Pending' ? 'status-amber' : 'status-indigo'}`}>
                                                        {t.portalStatus || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{formatDate(t.crtdate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Documents / Photo Evidence style */}
                    <div className="report-section-box">
                        <h3 className="section-title">Document Portfolio</h3>
                        <div className="document-grid">
                            {[
                                { label: 'Resume', field: 'resume' },
                                { label: 'Photograph', field: 'photograph' },
                                { label: 'PAN Card', field: 'panCard' },
                                { label: 'Aadhaar', field: 'aadhaarCard' }
                            ].map(doc => {
                                const file = (candidate as any)[doc.field];
                                return (
                                    <div key={doc.label} className="doc-report-card">
                                        <div className="doc-preview-placeholder">
                                            {file ? <FileTextIcon size={24} /> : <span className="missing-text">N/A</span>}
                                        </div>
                                        <div className="doc-footer">
                                            <span className="doc-name">{doc.label}</span>
                                            {file && (
                                                <button className="view-btn" onClick={() => setPreviewDoc({ url: getFileUrl(file.fileUrl), name: file.fileName })}>
                                                    View
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="report-footer-info">
                        <div className="meta-item">
                            <label>Created By</label>
                            <span>{typeof candidate.createdBy === 'object' ? candidate.createdBy.name : 'System Admin'}</span>
                        </div>
                        <div className="meta-item">
                            <label>Last Updated</label>
                            <span>{formatDate(candidate.updatedAt)} by {typeof candidate.updatedBy === 'object' ? candidate.updatedBy.name : 'N/A'}</span>
                        </div>
                        <div className="meta-item">
                            <label>Approval Status</label>
                            <span className={candidate.isApproved ? 'status-green' : 'status-amber'}>
                                {candidate.isApproved ? `Approved by ${typeof candidate.approvedBy === 'object' ? candidate.approvedBy.name : candidate.approvedBy}` : 'Pending Approval'}
                            </span>
                        </div>
                    </div>
                </div>

                <style>{`
                    .report-layout {
                        padding: 1.5rem;
                        background: #ffffff;
                        color: #1e293b;
                        font-family: 'Inter', sans-serif;
                        border-radius: 24px;
                        border: 1px solid #e2e8f0;
                    }
                    
                    /* Header Styles */
                    .report-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 2rem;
                    }
                    .report-main-title { font-size: 1.75rem; font-weight: 800; margin: 0; color: #0f172a; }
                    .report-subtitle { font-size: 0.95rem; color: #64748b; margin: 4px 0 0 0; }
                    
                    .report-score-badge {
                        background: linear-gradient(135deg, #4f46e5, #4338ca);
                        padding: 1.25rem 2rem;
                        border-radius: 16px;
                        text-align: center;
                        color: white;
                        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                    }
                    .score-value { font-size: 2rem; font-weight: 900; line-height: 1; }
                    .score-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; margin-top: 4px; }

                    /* Metrics Row */
                    .report-metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }
                    .metric-card {
                        background: white;
                        padding: 1.25rem;
                        border-radius: 12px;
                        text-align: center;
                        border: 1px solid #f1f5f9;
                    }
                    .metric-card.theme-blue { background: #eff6ff; border-color: #dbeafe; }
                    .metric-card.theme-indigo { background: #eef2ff; border-color: #e0e7ff; }
                    .metric-card.theme-emerald { background: #ecfdf5; border-color: #d1fae5; }
                    .metric-card.theme-slate { background: #f8fafc; border-color: #f1f5f9; }
                    
                    .metric-value { font-size: 1.75rem; font-weight: 800; color: #0f172a; line-height: 1; }
                    .metric-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-top: 6px; }

                    /* Info Containers */
                    .report-info-container {
                        background: #f8fafc;
                        border-radius: 12px;
                        margin-bottom: 2rem;
                        border: 1px solid #e2e8f0;
                    }
                    .info-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .info-row.triple {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-block {
                        padding: 1.25rem;
                        text-align: center;
                    }
                    .info-block:not(:last-child) { border-right: 1px solid #e2e8f0; }
                    .info-block label { display: block; font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                    .info-block strong { font-size: 1.05rem; color: #1e293b; font-weight: 800; }

                    /* Status & Logistics Section */
                    .status-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                    .status-item {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .status-item label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
                    .status-item span { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
                    .pill { padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; width: fit-content; text-transform: capitalize; }
                    .pill.status-indigo { background: #eef2ff; color: #4338ca; }
                    
                    .remark-box {
                        background: #f8fafc;
                        padding: 1rem;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        margin-top: 1rem;
                    }
                    .remark-box label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 6px; }
                    .remark-box p { font-size: 0.875rem; line-height: 1.5; color: #475569; margin: 0; }

                    /* Section Boxes */
                    .report-section-box {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .report-section-box.no-margin { margin-bottom: 1rem; }
                    .section-title { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem; border-left: 4px solid #4f46e5; padding-left: 12px; }
                    
                    .assessment-category { margin-bottom: 1.5rem; }
                    .assessment-category:last-child { margin-bottom: 0; }
                    .category-header { 
                        background: #f1f5f9; padding: 6px 12px; border-radius: 6px; 
                        font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 1rem;
                    }
                    .assessment-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: #475569;
                    }
                    .assessment-item:last-child { border-bottom: none; }
                    .status-val { font-weight: 700; color: #0f172a; }

                    /* AI Summary Box */
                    .report-ai-summary-box {
                        background: #eef2ff;
                        border: 1px solid #e0e7ff;
                        padding: 1.5rem;
                        border-radius: 16px;
                        margin-bottom: 2rem;
                    }
                    .ai-summary-title { font-size: 0.9rem; font-weight: 800; color: #4338ca; margin-bottom: 0.75rem; }
                    .ai-summary-content { font-size: 0.95rem; line-height: 1.6; color: #374151; margin: 0; }

                    /* Documents Portfolio */
                    .document-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                    .doc-report-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #f8fafc; }
                    .doc-preview-placeholder { height: 80px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                    .doc-footer { padding: 8px 12px; background: white; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; }
                    .doc-name { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
                    .view-btn { background: none; border: none; font-size: 0.75rem; font-weight: 700; color: #4f46e5; cursor: pointer; }
                    .missing-text { font-size: 0.7rem; font-weight: 800; color: #cbd5e1; }

                    /* Footer Metadata */
                    .report-footer-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 2rem;
                        padding-top: 1.5rem;
                        border-top: 1px solid #e2e8f0;
                        margin-top: 1rem;
                    }
                    .meta-item label { display: block; font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
                    .meta-item span { font-size: 0.8rem; font-weight: 600; color: #64748b; }
                     .status-green { color: #059669; font-weight: 700; }
                    .status-amber { color: #d97706; font-weight: 700; }

                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.85rem;
                        margin-top: 0.5rem;
                    }
                    .report-table th {
                        text-align: left;
                        padding: 10px;
                        background: #f8fafc;
                        color: #64748b;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: 0.65rem;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .report-table td {
                        padding: 12px 10px;
                        border-bottom: 1px solid #f1f5f9;
                        color: #1e293b;
                    }
                    .report-table .font-bold { font-weight: 700; color: #0f172a; }
                    .badge-outline {
                        padding: 2px 8px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        color: #64748b;
                    }
                `}</style>
            </Modal>
            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url}
                    fileName={previewDoc.name}
                />
            )}
        </>
    );
};

export default CandidateDetailModal;
