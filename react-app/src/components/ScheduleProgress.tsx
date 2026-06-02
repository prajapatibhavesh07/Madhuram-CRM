import React, { useState } from 'react';
import { XCircleIcon, CheckIcon, FileTextIcon, EyeIcon } from '../icons';
import { BASE_URL } from '../services/api';

interface Candidate {
    _id: string;
    name: string;
    panCard?: { fileUrl: string, fileName: string };
    aadhaarCard?: { fileUrl: string, fileName: string };
    educationProof?: { fileUrl: string, fileName: string };
    offerLetter?: { fileUrl: string, fileName: string };
    relativeLetter?: { fileUrl: string, fileName: string };
    offerStatus?: string;
    isResigned?: string;
    resignationLetter?: { fileUrl: string, fileName: string };
    doj?: string;
    noticePeriod?: string;
}

interface ScheduleProgressProps {
    interview: {
        _id: string;
        stage: string;
        status: string;
        offers: string;
        shortlisted: string;
        date: string;
        candidateId: Candidate;
    };
    onStepClick?: (stepId: string, label: string, data?: any) => void;
}

const ScheduleProgress: React.FC<ScheduleProgressProps> = ({ interview, onStepClick }) => {
    const candidate = interview.candidateId;
    const [resignStatus, setResignStatus] = useState(candidate?.isResigned || 'No');

    const steps = [
        { id: 'applied', label: 'Applied' },
        { id: 'scheduled', label: 'Scheduled' },
        { id: 'interview_done', label: 'Interview Done' },
        { id: 'short_list', label: 'Short-List' },
        { id: 'first_round', label: 'First Round' },
        { id: 'second_round', label: 'Second Round' },
        { id: 'final_round', label: 'Final Round' },
        { id: 'document', label: 'Document Pre-offer' }
    ];

    const getCurrentStepIndex = () => {
        if (interview.stage === 'Document Pre-offer' || interview.offers === 'Yes') return 7;
        if (interview.stage === 'Final Round') return 6;
        if (interview.stage === 'Second Round') return 5;
        if (interview.stage === 'First Round') return 4;
        if (interview.shortlisted === 'Yes' || interview.stage === 'Short-List' || interview.status === 'Shortlisted') return 3;
        if (interview.status === 'Completed' || interview.status === 'Interview Done') return 2;
        if (interview.status === 'Scheduled') return 1;
        return 0;
    };

    const activeIndex = getCurrentStepIndex();

    const documents = [
        { id: 'panCard', label: 'PAN Card', file: candidate?.panCard },
        { id: 'aadhaarCard', label: 'Aadhaar Card', file: candidate?.aadhaarCard },
        { id: 'educationProof', label: 'Education Proof', file: candidate?.educationProof },
        { id: 'offerLetter', label: 'Offer Letter', file: candidate?.offerLetter },
        { id: 'relativeLetter', label: 'Relieving Letter', file: candidate?.relativeLetter }
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onStepClick) {
            onStepClick('upload_resignation', 'Resignation Letter', { file: e.target.files[0] });
        }
    };

    return (
        <div className="schedule-progress-container">
            <div className="schedule-header">
                <h3>Interview Schedule</h3>
                <div className="schedule-meta">
                    <span className="meta-item">
                        <strong>Current Stage:</strong> {steps[activeIndex]?.label || interview.stage}
                    </span>
                    <span className="meta-item">
                        <strong>Status:</strong> {interview.status}
                    </span>
                </div>
            </div>

            <div className="progress-stepper">
                {steps.map((step, index) => {
                    let status = 'pending';
                    if (index < activeIndex) status = 'completed';
                    else if (index === activeIndex) status = interview.status === 'Rejected' ? 'rejected' : 'current';

                    let dateDisplay = index === 1 ? new Date(interview.date).toLocaleDateString() : '-';
                    const canClick = onStepClick && index > activeIndex;

                    return (
                        <div
                            key={step.id}
                            className={`step-item ${status} ${canClick ? 'clickable' : ''}`}
                            onClick={() => canClick && onStepClick(step.id, step.label)}
                        >
                            <div className="step-connector">
                                <div className="circle">
                                    {status === 'completed' && <CheckIcon size={16} />}
                                    {status === 'rejected' && <XCircleIcon size={18} />}
                                    {status === 'current' && <div style={{ width: '10px', height: '10px', background: 'currentColor', borderRadius: '50%' }}></div>}
                                    {status === 'pending' && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{index + 1}</span>}
                                </div>
                            </div>
                            <div className="step-content">
                                <span className="step-label">{step.label}</span>
                                <span className="step-date">{dateDisplay}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="final-decision-section">
                <h4>Final Decision</h4>
                <div className="decision-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <label className={`decision-card hire ${interview.status === 'Selected' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="finalDecision"
                            checked={interview.status === 'Selected'}
                            onChange={() => onStepClick && onStepClick('hire', 'Hire Candidate')}
                        />
                        <div className="decision-content">
                            <span className="radio-label">Hire Candidate</span>
                        </div>
                    </label>

                    <label className={`decision-card shortlist ${interview.status === 'Shortlisted' ? 'selected' : ''}`} style={{ background: interview.status === 'Shortlisted' ? 'rgba(59, 130, 246, 0.1)' : '', borderColor: interview.status === 'Shortlisted' ? '#3b82f6' : '' }}>
                        <input
                            type="radio"
                            name="finalDecision"
                            checked={interview.status === 'Shortlisted'}
                            onChange={() => onStepClick && onStepClick('shortlist', 'Shortlisted')}
                        />
                        <div className="decision-content">
                            <span className="radio-label">Shortlisted</span>
                        </div>
                    </label>

                    <label className={`decision-card reject ${interview.status === 'Rejected' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="finalDecision"
                            checked={interview.status === 'Rejected'}
                            onChange={() => onStepClick && onStepClick('reject', 'Reject Candidate')}
                        />
                        <div className="decision-content">
                            <span className="radio-label">Reject Candidate</span>
                        </div>
                    </label>
                </div>
            </div>

            {interview.status === 'Shortlisted' && (
                <div className="onboarding-section fade-in" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-panel)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileTextIcon size={20} /> Onboarding Details
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Documentation Check</h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {documents.map(doc => (
                                    <div key={doc.id} title={doc.label} style={{
                                        padding: '0.5rem',
                                        background: doc.file ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                                        borderRadius: '0.5rem',
                                        color: doc.file ? '#10b981' : 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.8rem',
                                        border: '1px solid ' + (doc.file ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)')
                                    }}>
                                        {doc.label}
                                        {doc.file && (
                                            <a href={`${BASE_URL}${doc.file.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                                <EyeIcon size={14} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Offer Status</label>
                            <select
                                className="input-field"
                                value={candidate?.offerStatus || 'Pending'}
                                onChange={(e) => onStepClick?.('update_offer', 'Offer Status', { offerStatus: e.target.value })}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Resign Status</label>
                            <select
                                className="input-field"
                                value={resignStatus}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setResignStatus(val);
                                    onStepClick?.('update_resign', 'Resign Status', { isResigned: val });
                                }}
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>

                        {resignStatus === 'Yes' && (
                            <div className="input-group">
                                <label className="input-label">Resignation Letter</label>
                                {candidate?.resignationLetter ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#10b981' }}>Uploaded</span>
                                        <a href={`${BASE_URL}${candidate.resignationLetter.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ padding: '0.25rem' }}><EyeIcon size={16} /></a>
                                        <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                            Change <input type="file" hidden onChange={handleFileChange} />
                                        </label>
                                    </div>
                                ) : (
                                    <input type="file" className="input-field" onChange={handleFileChange} />
                                )}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Notice Period</label>
                            <div className="input-field" style={{ background: '#f8fafc', color: '#64748b' }}>
                                {candidate?.noticePeriod || 'Not specified'}
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Date of Joining</label>
                            <input
                                type="date"
                                className="input-field"
                                value={candidate?.doj ? new Date(candidate.doj).toISOString().split('T')[0] : ''}
                                onChange={(e) => onStepClick?.('update_doj', 'DOJ', { doj: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleProgress;
