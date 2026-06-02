import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileTextIcon, SaveIcon, XIcon } from '../icons';

const OfferForm = () => {
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
        joiningDate: '',
        ctc: '',
        breakdown: '',
        status: 'Draft',
        content: ''
    });

    useEffect(() => {
        fetchOptions();
        if (id) {
            fetchOffer();
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

    const fetchOffer = async () => {
        setPageLoading(true);
        try {
            const allOffers = await api.getOffers();
            const offer = allOffers.find((o: any) => o._id === id);

            if (offer) {
                setFormData({
                    candidateId: offer.candidateId?._id || offer.candidateId,
                    jobId: offer.jobId?._id || offer.jobId,
                    joiningDate: offer.joiningDate ? new Date(offer.joiningDate).toISOString().split('T')[0] : '',
                    ctc: offer.salary?.ctc || '',
                    breakdown: offer.salary?.breakdown || '',
                    status: offer.status,
                    content: offer.content || ''
                });
            } else {
                showToast('Offer not found', 'error');
                navigate('/offers');
            }
        } catch (error) {
            showToast('Failed to fetch offer details', 'error');
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

        const payload = {
            ...formData,
            salary: {
                ctc: Number(formData.ctc),
                breakdown: formData.breakdown
            }
        };

        try {
            if (id) {
                await api.updateOffer(id, payload);
                showToast('Offer updated successfully', 'success');
            } else {
                await api.createOffer(payload);
                showToast('Offer created successfully', 'success');
            }
            navigate('/offers');
        } catch (error) {
            console.error(error);
            showToast(id ? 'Failed to update offer' : 'Failed to create offer', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/offers')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    ← Back
                </button>
                <h2 style={{ margin: 0, background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {id ? 'Edit Offer' : 'Create Offer'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <FileTextIcon size={24} color="#3b82f6" />
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Offer Details</h3>
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

                        {/* CTC */}
                        <div className="input-group">
                            <label className="input-label">Annual CTC (₹)</label>
                            <input
                                type="number"
                                name="ctc"
                                className="input-field"
                                placeholder="e.g. 1200000"
                                value={formData.ctc}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Joining Date */}
                        <div className="input-group">
                            <label className="input-label">Joining Date</label>
                            <input
                                type="date"
                                name="joiningDate"
                                className="input-field"
                                value={formData.joiningDate}
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
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Revoked">Revoked</option>
                            </select>
                        </div>

                        {/* Salary Breakdown/Description */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Salary Breakdown / Notes</label>
                            <textarea
                                name="breakdown"
                                className="input-field"
                                rows={3}
                                placeholder="Details about salary structure..."
                                value={formData.breakdown}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/offers')}
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
                            <SaveIcon size={18} /> {loading ? 'Saving...' : 'Save Offer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default OfferForm;
