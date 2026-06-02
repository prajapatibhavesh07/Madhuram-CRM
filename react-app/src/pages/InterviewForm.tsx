import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CalendarIcon, SaveIcon, XIcon } from '../icons';

const InterviewForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    const [candidates, setCandidates] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        candidateId: '',
        jobId: '',
        date: '',
        mode: 'Video',
        stage: 'First Round',
        status: 'Pending',
        offers: 'No',
        shortlisted: 'No',
        feedback: '',
        meetingLink: ''
    });

    useEffect(() => {
        fetchOptions();
        if (id) {
            fetchInterview();
        }
    }, [id]);

    const fetchOptions = async () => {
        try {
            const [candData, jobData] = await Promise.all([
                api.getCandidates(),
                api.getJobs({ status: 'Open' })
            ]);
            setCandidates(candData);
            setJobs(jobData);
        } catch (error) {
            showToast('Failed to fetch options', 'error');
        }
    };

    const fetchInterview = async () => {
        setPageLoading(true);
        try {
            const interview = await api.getInterviewById(id!);

            if (interview) {
                setFormData({
                    candidateId: interview.candidateId?._id || interview.candidateId,
                    jobId: interview.jobId?._id || interview.jobId,
                    date: interview.date ? new Date(interview.date).toISOString().slice(0, 16) : '',
                    mode: interview.mode,
                    stage: interview.stage,
                    status: interview.status,
                    offers: interview.offers || 'No',
                    shortlisted: interview.shortlisted || 'No',
                    feedback: interview.feedback || '',
                    meetingLink: interview.meetingLink || ''
                });
            } else {
                showToast('Interview not found', 'error');
                navigate('/interviews');
            }

        } catch (error) {
            showToast('Failed to fetch interview details', 'error');
        } finally {
            setPageLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);
        
        setLoading(true);
        try {
            if (id) {
                await api.updateInterview(id, formData);
                showToast('Interview updated successfully', 'success');
            } else {
                await api.scheduleInterview(formData);
                showToast('Interview scheduled successfully', 'success');
            }
            navigate('/interviews');
        } catch (error) {
            console.error(error);
            showToast(id ? 'Failed to update interview' : 'Failed to schedule interview', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/interviews')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    ← Back
                </button>
                <h2 style={{ margin: 0, background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {id ? 'Edit Interview' : 'Schedule Interview'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <CalendarIcon size={24} color="#3b82f6" />
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Interview Details</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Candidate */}
                        <div className="input-group">
                            <label className="input-label">Candidate</label>
                            <select
                                name="candidateId"
                                className="input-field"
                                value={formData.candidateId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Candidate</option>
                                {candidates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Job */}
                        <div className="input-group">
                            <label className="input-label">Job</label>
                            <select
                                name="jobId"
                                className="input-field"
                                value={formData.jobId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Job</option>
                                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                            </select>
                        </div>

                        {/* Stage */}
                        <div className="input-group">
                            <label className="input-label">Stage</label>
                            <select
                                name="stage"
                                className="input-field"
                                value={formData.stage}
                                onChange={handleChange}
                            >
                                <option>First Round</option>
                                <option>Second Round</option>
                                <option>Third Round</option>
                            </select>
                        </div>

                        {/* Mode */}
                        <div className="input-group">
                            <label className="input-label">Mode</label>
                            <select
                                name="mode"
                                className="input-field"
                                value={formData.mode}
                                onChange={handleChange}
                            >
                                <option>Video</option>
                                <option>Phone</option>
                                <option>In Person</option>
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="input-group">
                            <label className="input-label">Date & Time</label>
                            <input
                                type="datetime-local"
                                name="date"
                                className="input-field"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                name="status"
                                className="input-field"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>

                        {/* Offers */}
                        <div className="input-group">
                            <label className="input-label">Offers</label>
                            <select
                                name="offers"
                                className="input-field"
                                value={formData.offers}
                                onChange={handleChange}
                            >
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>

                        {/* Shortlisted */}
                        <div className="input-group">
                            <label className="input-label">Shortlisted</label>
                            <select
                                name="shortlisted"
                                className="input-field"
                                value={formData.shortlisted}
                                onChange={handleChange}
                            >
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>

                        {/* Meeting Link */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Meeting Link (Optional)</label>
                            <input
                                type="text"
                                name="meetingLink"
                                className="input-field"
                                placeholder="https://..."
                                value={formData.meetingLink}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Feedback */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Feedback (Optional)</label>
                            <textarea
                                name="feedback"
                                className="input-field"
                                rows={3}
                                placeholder="Interviewer feedback..."
                                value={formData.feedback}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/interviews')}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <XIcon size={18} /> Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <SaveIcon size={18} /> {loading ? 'Saving...' : 'Save Interview'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default InterviewForm;
