import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import Popover from '../components/Popover';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import Modal from '../components/Modal';
import AppDateInput from '../components/AppDateInput';
import { industryTypes } from '../constants/IndustryConstants';
import {
    XIcon, BriefcaseIcon, UserIcon, GlobeIcon, FacebookIcon,
    TwitterIcon, LinkedinIcon, GithubIcon, PlusIcon,
    SparklesIcon, UploadIcon, CheckIcon,
    EyeIcon, DownloadIcon
} from '../icons';

interface Ticket {
    ticketNo: string;
    companyName: string;
    uploaddate: string;
    expdate: string;
    crtdate: string;
    type: string;
}

interface CandidateFormProps {
    candidateId?: string;
    onClose?: () => void;
}

const CandidateForm = ({ candidateId, onClose }: CandidateFormProps) => {
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    const id = candidateId || routeId;

    const { showToast } = useToast();
    const { user, activeRole } = useAuth();
    const canCreateOptions = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.settings?.create === true;
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        gender: 'Male',
        dob: '',
        age: '',
        phone: '',
        whatsapp: '',
        sameAsPhone: false,
        email: '',
        location: '',
        currentCompany: '',
        currentProfile: '',
        designation: '',
        currentCTC: '',
        noticePeriod: '',
        channel: 'Banca',
        sector: 'BFSI',
        totalWorkExp: '',
        totalSalesExp: '',
        bfsiExp: '',
        qualification: 'Graduate',
        pan: '',
        assessment: 'Pending',
        remark: '',
        jobId: '',
        recruitmentStatus: 'Applied',
        applicationId: '',
        leadTag: 'Jobseeker',
        candidatePlatform: '',
        willingToRelocate: false,
        facebookProfile: '',
        twitterProfile: '',
        linkedinProfile: '',
        githubProfile: ''
    });

    const [jobs, setJobs] = useState<any[]>([]);

    const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: string[] }>({
        currentCompany: [],
        currentProfile: [],
        designation: [],
        noticePeriod: ['Immediate', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days'],
        sector: ['BFSI', 'Insurance', 'Banking', 'Other'],
        qualification: ['Graduate', 'Post Graduate', 'MBA', 'Other'],
        channel: ['Banca', 'Agency', 'Direct', 'Other'],
        ticketCompany: [],
        ticketType: [],
        leadTag: ['Jobseeker', 'Lead', 'Client', 'Other'],
        recruitmentStatus: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined'],
        jobTitle: [],
        assessmentStatus: ['Clear', 'Not Clear', 'Pending']
    });

    const [popoverValues, setPopoverValues] = useState({
        currentCompany: '',
        currentProfile: '',
        designation: '',
        noticePeriod: '',
        sector: '',
        channel: '',
        ticketCompany: '',
        ticketType: '',
        qualification: '',
        jobTitle: '',
        leadTag: '',
        recruitmentStatus: '',
        assessmentStatus: ''
    });

    const [tickets, setTickets] = useState<Ticket[]>([
        { ticketNo: '', companyName: '', uploaddate: '', expdate: '', crtdate: '', type: 'Banca' }
    ]);

    const [docs, setDocs] = useState<{ [key: string]: File | null }>({
        resume: null,
        photograph: null,
        panCard: null,
        aadhaarCard: null,
        educationProof: null,
        offerLetter: null,
        relativeLetter: null,
        salarySlip: null,
        cheque: null,
        signature: null
    });

    const [workHistory, setWorkHistory] = useState<any[]>([]);
    const [educationHistory, setEducationHistory] = useState<any[]>([]);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [workForm, setWorkForm] = useState({
        title: '', companyName: '', employmentType: 'Please Select',
        industryType: 'Please Select',
        location: '', salary: 0, currentlyWorking: false,
        startDate: '', endDate: '', description: ''
    });
    const [educationForm, setEducationForm] = useState({
        schoolName: '', qualification: '', specialization: '',
        grade: '', location: '', startDate: '', endDate: '',
        description: ''
    });

    const [existingDocs, setExistingDocs] = useState<any>({});
    const [previewDoc, setPreviewDoc] = useState<{ url: string, name: string } | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [duplicateErrors, setDuplicateErrors] = useState<{ email?: string; phone?: string }>({});

    useEffect(() => {
        const checkField = async (field: 'email' | 'phone', value: string) => {
            if (!value || value.length < 5) {
                setDuplicateErrors(prev => ({ ...prev, [field]: undefined }));
                return;
            }

            try {
                const result = await api.checkDuplicateCandidate(field, value);
                if (result.isDuplicate && result.candidate?._id !== id) {
                    setDuplicateErrors(prev => ({
                        ...prev,
                        [field]: `Duplicate found: ${result.candidate.name} (${result.candidate.applicationId})`
                    }));
                } else {
                    setDuplicateErrors(prev => ({ ...prev, [field]: undefined }));
                }
            } catch (error) {
                console.error(`Error checking duplicate ${field}:`, error);
            }
        };

        const timer = setTimeout(() => {
            if (formData.email) checkField('email', formData.email);
            if (formData.phone) checkField('phone', formData.phone);
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.email, formData.phone, id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [options, jobData] = await Promise.all([api.getOptions(), api.getJobs()]);
                const processedJobs = jobData.map((job: any) => ({
                    ...job,
                    status: job.status || job.managers?.[0]?.status || 'Open'
                }));
                setDynamicOptions(prev => ({ ...prev, ...options }));
                setJobs(processedJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
            }

            if (id) {
                setLoading(true);
                try {
                    const data = await api.getCandidateById(id);
                    const {
                        _id, createdAt, updatedAt, __v,
                        tickets: candidateTickets,
                        resume, photograph, panCard, aadhaarCard, educationProof, offerLetter, relativeLetter,
                        extractedExperience, extractedEducation,
                        fulfillmentChecklist, operationRemark, operationBy, updatedBy, createdBy,
                        ...rest
                    } = data;

                    if (rest.dob) rest.dob = new Date(rest.dob).toISOString().split('T')[0];

                    const sanitizedData = Object.keys(rest).reduce((acc, key) => {
                        acc[key] = rest[key] === null ? '' : rest[key];
                        return acc;
                    }, {} as any);

                    setFormData(prev => ({ ...prev, ...sanitizedData }));

                    if (extractedExperience && Array.isArray(extractedExperience)) {
                        setWorkHistory(extractedExperience);
                    }
                    if (extractedEducation && Array.isArray(extractedEducation)) {
                        setEducationHistory(extractedEducation);
                    }

                    if (candidateTickets) {
                        setTickets(candidateTickets.map((t: any) => ({
                            ...t,
                            uploaddate: t.uploaddate ? new Date(t.uploaddate).toISOString().split('T')[0] : '',
                            expdate: t.expdate ? new Date(t.expdate).toISOString().split('T')[0] : '',
                            crtdate: t.crtdate ? new Date(t.crtdate).toISOString().split('T')[0] : '',
                            type: t.type || 'Banca'
                        })));
                    }

                    setExistingDocs({
                        resume, photograph, panCard, aadhaarCard, educationProof, offerLetter, relativeLetter,
                        salarySlip: (rest as any).salarySlip, cheque: (rest as any).cheque, signature: (rest as any).signature
                    });

                    if (photograph && photograph.fileUrl) {
                        setPhotoPreview(photograph.fileUrl.startsWith('http') ? photograph.fileUrl : `${BASE_URL}${photograph.fileUrl}`);
                    }
                } catch (error) {
                    console.error('Error fetching candidate:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setFormData(prev => ({ ...prev, age: age.toString() }));
        }
    }, [formData.dob]);

    useEffect(() => {
        if (formData.sameAsPhone) setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
    }, [formData.sameAsPhone, formData.phone]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [id]: val }));
    };

    const handleTicketChange = (index: number, field: string, value: any) => {
        const updatedTickets = [...tickets];
        const ticket = { ...updatedTickets[index], [field as keyof Ticket]: value };

        if (field === 'companyName' || field === 'uploaddate') {
            const company = ticket.companyName;
            const uploadDateStr = ticket.uploaddate;

            if (company && uploadDateStr) {
                const job = jobs.find(j => j.company === company && j.status === 'Open') || jobs.find(j => j.company === company);
                const expiryDays = job?.managers?.[0]?.expiryDays ? parseInt(job.managers[0].expiryDays) : 30;
                const uploadDate = new Date(uploadDateStr);
                const expDate = new Date(uploadDate);
                expDate.setDate(uploadDate.getDate() + expiryDays);
                ticket.expdate = expDate.toISOString().split('T')[0];
            }
        }
        updatedTickets[index] = ticket;
        setTickets(updatedTickets);
    };

    const handleDocChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setDocs(prev => ({ ...prev, [field]: file }));

            if (field === 'photograph') {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleAIAutoFill = async () => {
        if (!docs.resume) {
            showToast('Please select a resume file first.', 'info');
            return;
        }
        setIsParsing(true);
        try {
            const result = await api.parseResume(docs.resume);
            const { data } = result;
            setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                email: data.email || prev.email,
                phone: data.phone || prev.phone,
                location: data.location || prev.location,
                currentProfile: data.summary || prev.currentProfile,
                remark: `AI Parsed Summary: ${data.summary}\n\n${prev.remark}`
            }));
            showToast('Form auto-filled from resume!', 'success');
        } catch (error) {
            showToast('Failed to parse resume: ' + error, 'error');
        } finally {
            setIsParsing(false);
        }
    };

    const handlePopoverSubmit = async (field: string, e?: React.FormEvent | React.KeyboardEvent, index?: number) => {
        if (e) e.preventDefault();
        const value = (popoverValues as any)[field];
        if (!value) return;

        try {
            if (field === 'jobTitle') {
                const newJob = await api.createJob({ title: value, company: 'TBD', description: 'Added directly from Candidate Form', location: 'TBD', status: 'Open' });
                setJobs(prev => [...prev, newJob]);
                setFormData(prev => ({ ...prev, jobId: newJob._id }));
                showToast(`Job '${value}' created successfully`, 'success');
            } else if (field === 'currentCompany' || field === 'ticketCompany') {
                const newJob = await api.createJob({ company: value, title: 'Open Position', status: 'Open', location: 'TBD', description: 'Added via Candidate Form' });
                setJobs(prev => [...prev, newJob]);
                if (field === 'currentCompany') setFormData(prev => ({ ...prev, currentCompany: value }));
                if (field === 'ticketCompany' && index !== undefined) {
                    handleTicketChange(index, 'companyName', value);
                }
                showToast(`Company '${value}' added via new Job record`, 'success');
            } else {
                await api.addOption({ category: field, value });
                setDynamicOptions(prev => ({ ...prev, [field]: Array.from(new Set([...(prev as any)[field], value])) }));
                setFormData(prev => ({ ...prev, [field]: value }));
                showToast(`${value} added to ${field} successfully`, 'success');
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'Option already exists') {
                setFormData(prev => ({ ...prev, [field]: value }));
                showToast(`${value} already exists, selected from list`, 'info');
            } else {
                showToast(`Failed to add new ${field === 'jobTitle' ? 'job' : 'option'}`, 'error');
            }
        }
        setPopoverValues(prev => ({ ...prev, [field]: '' }));
    };

    const handlePopoverInputChange = (field: string, value: string) => {
        setPopoverValues(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (duplicateErrors.email || duplicateErrors.phone) {
            showToast('Cannot submit with duplicate identifiers. Please resolve the errors first.', 'error');
            return;
        }
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        setWasValidated(true);
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && typeof value !== 'object') {
                    data.append(key, value.toString());
                }
            });

            const mappedTickets = tickets
                .filter(t => t.ticketNo?.trim() && t.companyName?.trim())
                .map(t => ({
                    ticketNo: t.ticketNo,
                    companyName: t.companyName,
                    uploaddate: t.uploaddate,
                    expdate: t.expdate,
                    crtdate: t.crtdate,
                    type: t.type
                }));
            data.append('tickets', JSON.stringify(mappedTickets));

            Object.entries(docs).forEach(([key, file]) => {
                if (file) data.append(key, file);
            });

            data.append('extractedExperience', JSON.stringify(workHistory));
            data.append('extractedEducation', JSON.stringify(educationHistory));

            if (id) {
                await api.updateCandidate(id, data);
                showToast('Candidate updated successfully', 'success');
            } else {
                if (!formData.applicationId) {
                    const year = new Date().getFullYear();
                    const count = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    data.set('applicationId', `CRM-${year}-C${count}`);
                }
                await api.createCandidate(data);
                showToast('Candidate created successfully', 'success');
            }
            onClose ? onClose() : navigate('/candidates');
        } catch (error) {
            showToast('Error: ' + error, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openCompanies = Array.from(new Set([
        ...jobs.filter(j => j.status === 'Open').map(j => j.company),
        formData.currentCompany,
        ...tickets.map(t => t.companyName)
    ])).filter(Boolean).sort();

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="candidate-form-container">
            <form onSubmit={handleSubmit} className={`candidate-form ${wasValidated ? 'was-validated' : ''}`} noValidate>
                {/* 1: Personal Details */}
                <div className="glass-card">
                    <h3 className="form-section-title">
                        <span className="form-section-number">1</span>
                        Personal Details
                    </h3>

                    {/* Profile Photo Upload Section */}
                    <div className="form-grid">
                        <div className="profile-photo-section">
                            <div
                                className="profile-photo-container"
                                onClick={() => document.getElementById('photograph-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="photograph-upload"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleDocChange('photograph', e)}
                                    accept="image/*"
                                />
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" />
                                ) : (
                                    <div className="photo-placeholder">
                                        <UserIcon size={40} />
                                        <span>Upload Photo</span>
                                    </div>
                                )}
                                <div className="photo-overlay">
                                    <UploadIcon size={20} />
                                </div>
                            </div>
                            <div className="profile-photo-actions">
                                <button type="button" className="btn-link" onClick={() => document.getElementById('photograph-upload')?.click()}>
                                    {photoPreview ? 'Change Photo' : 'Add Profile Photo'}
                                </button>
                                {photoPreview && (
                                    <button
                                        type="button"
                                        className="btn-link danger"
                                        onClick={() => {
                                            setDocs(prev => ({ ...prev, photograph: null }));
                                            setExistingDocs((prev: any) => ({ ...prev, photograph: null }));
                                            setPhotoPreview(null);
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="input-group full-width">
                            <div
                                className="resume-dropzone"
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragging'); }}
                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dragging'); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('dragging');
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleDocChange('resume', { target: { files: e.dataTransfer.files } } as any);
                                    }
                                }}
                                onClick={() => !isParsing && document.getElementById('resume-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="resume-upload"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleDocChange('resume', e)}
                                    accept=".pdf,.doc,.docx"
                                    disabled={isParsing}
                                />
                                {isParsing && (
                                    <div className="resume-parsing-loader-overlay">
                                        <div className="parsing-spinner"></div>
                                        <span>AI is parsing your resume...</span>
                                    </div>
                                )}
                                <div className="resume-icon-box">
                                    <UploadIcon size={24} />
                                </div>
                                <div className="resume-info">
                                    <span className="resume-filename">{docs.resume ? docs.resume.name : existingDocs.resume ? existingDocs.resume.fileName : 'Click to browse'}</span>
                                    <span className="resume-subtitle"> or drag and drop your resume here</span>
                                </div>
                                <div className="resume-hint">Supports PDF, DOC, DOCX up to 10MB</div>

                                {docs.resume && (
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm ai-autofill-btn"
                                        onClick={(e) => { e.stopPropagation(); handleAIAutoFill(); }}
                                        disabled={isParsing}
                                    >
                                        <SparklesIcon size={14} />
                                        {isParsing ? 'Processing...' : 'Auto-Fill Details'}
                                    </button>
                                )}
                                {existingDocs.resume && !docs.resume && (
                                    <div className="resume-preview-container" onClick={e => e.stopPropagation()}>
                                        <button type="button" onClick={() => setPreviewDoc({ url: `${BASE_URL}${existingDocs.resume.fileUrl}`, name: existingDocs.resume.fileName || 'Resume' })} className="btn btn-ghost btn-sm">
                                            <EyeIcon size={14} className="mr-4" /> Preview Current Resume
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="form-grid">

                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" id="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div className="input-group">
                            <label>Gender</label>
                            <select id="gender" value={formData.gender} onChange={handleInputChange} className="input-field">
                                <option>Male</option><option>Female</option><option>Other</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Date of Birth</label>
                            <AppDateInput id="dob" value={formData.dob} onChange={handleInputChange} required max={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="input-group">
                            <label>Age (Auto-calculated)</label>
                            <input type="text" id="age" value={formData.age} readOnly className="input-field input-readonly" />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} className={`input-field ${duplicateErrors.phone ? 'error' : ''}`} required />
                            {duplicateErrors.phone && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{duplicateErrors.phone}</div>}
                        </div>
                        <div className="input-group">
                            <div className="label-flex-between">
                                <label>WhatsApp</label>
                                <label className="label-sm"><input type="checkbox" id="sameAsPhone" checked={formData.sameAsPhone} onChange={handleInputChange} /> Same as Phone</label>
                            </div>
                            <input type="tel" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="input-field" disabled={formData.sameAsPhone} />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input type="email" id="email" value={formData.email} onChange={handleInputChange} className={`input-field ${duplicateErrors.email ? 'error' : ''}`} required />
                            {duplicateErrors.email && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{duplicateErrors.email}</div>}
                        </div>
                        <div className="input-group">
                            <label>Location</label>
                            <input type="text" id="location" value={formData.location} onChange={handleInputChange} className="input-field" required />
                        </div>
                        <div className="input-group">
                            <label>Source of candidates</label>
                            <input type="text" id="candidatePlatform" value={formData.candidatePlatform} onChange={handleInputChange} className="input-field" placeholder="e.g. LinkedIn, Indeed, etc." />
                        </div>
                        <div className="input-group toggle-container">
                            <label className="m-0">Willing to Relocate?</label>
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, willingToRelocate: !prev.willingToRelocate }))}
                                className={`toggle-switch ${formData.willingToRelocate ? 'active' : ''}`}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2: Professional Details */}
                <div className="glass-card">
                    <h3 className="form-section-title">
                        <span className="form-section-number">2</span>
                        Professional Details
                    </h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Current Company</label>
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Company"
                                                value={popoverValues.currentCompany}
                                                onChange={(e) => handlePopoverInputChange('currentCompany', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('currentCompany', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('currentCompany', e)}>Set Company</button>
                                        </div>
                                    </Popover>
                                </div>
                            </div>
                            <select id="currentCompany" value={formData.currentCompany} onChange={handleInputChange} className="input-field">
                                <option value="">Select Company</option>
                                {openCompanies.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Current Profile</label>
                                {canCreateOptions && (
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Profile"
                                                value={popoverValues.currentProfile}
                                                onChange={(e) => handlePopoverInputChange('currentProfile', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('currentProfile', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('currentProfile', e)}>Set Profile</button>
                                        </div>
                                    </Popover>
                                )}
                            </div>
                            <select id="currentProfile" value={formData.currentProfile} onChange={handleInputChange} className="input-field">
                                <option value="">Select Profile</option>
                                {dynamicOptions.currentProfile.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Designation</label>
                                {canCreateOptions && (
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Designation"
                                                value={popoverValues.designation}
                                                onChange={(e) => handlePopoverInputChange('designation', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('designation', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('designation', e)}>Set Designation</button>
                                        </div>
                                    </Popover>
                                )}
                            </div>
                            <select id="designation" value={formData.designation} onChange={handleInputChange} className="input-field">
                                <option value="">Select Designation</option>
                                {dynamicOptions.designation.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Current CTC (Ex: 5,00,000)</label>
                            <input type="text" id="currentCTC" value={formData.currentCTC} onChange={handleInputChange} className="input-field" placeholder="e.g. 5.5 LPA" />
                        </div>
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Notice Period</label>
                                    {canCreateOptions && (
                                        <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                            <div className="popover-container">
                                                <input
                                                    type="text"
                                                    className="input-field mb-8"
                                                    placeholder="New Notice Period"
                                                    value={popoverValues.noticePeriod}
                                                    onChange={(e) => handlePopoverInputChange('noticePeriod', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('noticePeriod', e))}
                                                />
                                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('noticePeriod', e)}>Add Option</button>
                                            </div>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <select id="noticePeriod" value={formData.noticePeriod} onChange={handleInputChange} className="input-field">
                                <option value="">Select Notice Period</option>
                                {dynamicOptions.noticePeriod.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Sector</label>
                                    {canCreateOptions && (
                                        <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                            <div className="popover-container">
                                                <input
                                                    type="text"
                                                    className="input-field mb-8"
                                                    placeholder="New Sector"
                                                    value={popoverValues.sector}
                                                    onChange={(e) => handlePopoverInputChange('sector', e.target.value)}
                                                />
                                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('sector', e)}>Add Sector</button>
                                            </div>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <select id="sector" value={formData.sector} onChange={handleInputChange} className="input-field">
                                <option value="">Select Sector</option>
                                {dynamicOptions.sector.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                {dynamicOptions.sector.includes(formData.sector) ? null : <option value={formData.sector}>{formData.sector}</option>}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2.1: Work Experience History */}
                <div className="glass-card">
                    <h3 className="form-section-title flex-justify-between">
                        <div className="flex-align-center gap-12">
                            <span className="form-section-number">2.1</span>
                            Work Experience
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm text-primary" onClick={() => setIsWorkModalOpen(true)}>+ Add Work</button>
                    </h3>
                    <div className="history-list-form">
                        {workHistory.length > 0 ? workHistory.map((work, idx) => (
                            <div key={idx} className="history-item-modern">
                                <div className="history-icon-box"><BriefcaseIcon size={16} /></div>
                                <div className="history-content">
                                    <div className="history-main-row">
                                        <span className="history-title">{work.title}</span>
                                        <span className="history-duration">{work.startDate} - {work.currentlyWorking ? 'Present' : work.endDate}</span>
                                    </div>
                                    <div className="history-sub-row">{work.companyName}</div>
                                </div>
                                <button type="button" className="action-btn danger btn-sm" onClick={() => setWorkHistory(workHistory.filter((_, i) => i !== idx))}><XIcon size={14} /></button>
                            </div>
                        )) : (
                            <p className="history-placeholder">No work history added</p>
                        )}
                    </div>
                </div>

                {/* 2.2: Education History */}
                <div className="glass-card">
                    <h3 className="form-section-title flex-justify-between">
                        <div className="flex-align-center gap-12">
                            <span className="form-section-number">2.2</span>
                            Education History
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm text-primary" onClick={() => setIsEducationModalOpen(true)}>+ Add Education</button>
                    </h3>
                    <div className="history-list-form">
                        {educationHistory.length > 0 ? educationHistory.map((edu, idx) => (
                            <div key={idx} className="history-item-modern">
                                <div className="history-icon-box"><UserIcon size={16} /></div>
                                <div className="history-content">
                                    <div className="history-main-row">
                                        <span className="history-title">{edu.degree || edu.qualification}</span>
                                        <span className="history-duration">{edu.year || edu.startDate}</span>
                                    </div>
                                    <div className="history-sub-row">{edu.institution || edu.schoolName}</div>
                                </div>
                                <button type="button" className="action-btn danger btn-sm" onClick={() => setEducationHistory(educationHistory.filter((_, i) => i !== idx))}><XIcon size={14} /></button>
                            </div>
                        )) : (
                            <p className="history-placeholder">No education history added</p>
                        )}
                    </div>
                </div>
                {/* 2.3: Additional Information */}
                <div className="glass-card">
                    <h3 className="form-section-title">
                        <span className="form-section-number">2.3</span>
                        Additional Information
                    </h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Channel</label>
                                    {canCreateOptions && (
                                        <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                            <div className="popover-container">
                                                <input
                                                    type="text"
                                                    className="input-field mb-8"
                                                    placeholder="New Channel"
                                                    value={popoverValues.channel}
                                                    onChange={(e) => handlePopoverInputChange('channel', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('channel', e))}
                                                />
                                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('channel', e)}>Add Channel</button>
                                            </div>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <select id="channel" value={formData.channel} onChange={handleInputChange} className="input-field">
                                <option value="">Select Channel</option>
                                {dynamicOptions.channel.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Qualification</label>
                                    {canCreateOptions && (
                                        <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                            <div className="popover-container">
                                                <input
                                                    type="text"
                                                    className="input-field mb-8"
                                                    placeholder="New Qualification"
                                                    value={popoverValues.qualification}
                                                    onChange={(e) => handlePopoverInputChange('qualification', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('qualification', e))}
                                                />
                                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('qualification', e)}>Add Qualification</button>
                                            </div>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <select id="qualification" value={formData.qualification} onChange={handleInputChange} className="input-field">
                                <option value="">Select Qualification</option>
                                {dynamicOptions.qualification.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Pan Number</label>
                            <input type="text" id="pan" value={formData.pan} onChange={handleInputChange} className="input-field" placeholder="e.g. ABCDE1234F" />
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Lead Tag</label>
                                {canCreateOptions && (
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Lead Tag"
                                                value={popoverValues.leadTag}
                                                onChange={(e) => handlePopoverInputChange('leadTag', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('leadTag', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('leadTag', e)}>Add Option</button>
                                        </div>
                                    </Popover>
                                )}
                            </div>
                            <select id="leadTag" value={formData.leadTag} onChange={handleInputChange} className="input-field">
                                <option value="">Select Lead Tag</option>
                                {(dynamicOptions.leadTag || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div className="label-flex-between">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label>Job Title</label>
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Job Title"
                                                value={popoverValues.jobTitle}
                                                onChange={(e) => handlePopoverInputChange('jobTitle', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('jobTitle', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('jobTitle', e)}>Add Job</button>
                                        </div>
                                    </Popover></div>
                            </div>
                            <select id="jobId" value={formData.jobId} onChange={handleInputChange} className="input-field">
                                <option value="">Not Assigned</option>
                                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Recruitment Status</label>
                                {canCreateOptions && (
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Recruitment Status"
                                                value={popoverValues.recruitmentStatus}
                                                onChange={(e) => handlePopoverInputChange('recruitmentStatus', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('recruitmentStatus', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('recruitmentStatus', e)}>Add Option</button>
                                        </div>
                                    </Popover>
                                )}
                            </div>
                            <select id="recruitmentStatus" value={formData.recruitmentStatus} onChange={handleInputChange} className="input-field">
                                <option value="">Select Status</option>
                                {(dynamicOptions.recruitmentStatus || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3: Experience Details */}
                <div className="glass-card">
                    <h3 className="form-section-title">
                        <span className="form-section-number">3</span>
                        Experience & Assessment
                    </h3>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Total Work Experience (Years)</label>
                            <input type="number" id="totalWorkExp" value={formData.totalWorkExp} onChange={handleInputChange} className="input-field" step="0.5" />
                        </div>
                        <div className="input-group">
                            <label>Total Sales Experience (Years)</label>
                            <input type="number" id="totalSalesExp" value={formData.totalSalesExp} onChange={handleInputChange} className="input-field" step="0.5" />
                        </div>
                        <div className="input-group">
                            <label>BFSI Experience (Years)</label>
                            <input type="number" id="bfsiExp" value={formData.bfsiExp} onChange={handleInputChange} className="input-field" step="0.5" />
                        </div>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Assessment Status</label>
                                {canCreateOptions && (
                                    <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                        <div className="popover-container">
                                            <input
                                                type="text"
                                                className="input-field mb-8"
                                                placeholder="New Assessment Status"
                                                value={popoverValues.assessmentStatus}
                                                onChange={(e) => handlePopoverInputChange('assessmentStatus', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('assessmentStatus', e))}
                                            />
                                            <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('assessmentStatus', e)}>Add Option</button>
                                        </div>
                                    </Popover>
                                )}
                            </div>
                            <select id="assessment" value={formData.assessment} onChange={handleInputChange} className="input-field">
                                <option value="">Select Assessment</option>
                                {(dynamicOptions.assessmentStatus || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        {formData.applicationId && (
                            <div className="input-group">
                                <label>Application ID</label>
                                <input type="text" id="applicationId" value={formData.applicationId} readOnly className="input-field input-readonly" />
                            </div>
                        )}
                        <div className="input-group full-width">
                            <label>Remarks</label>
                            <textarea id="remark" value={formData.remark} onChange={handleInputChange} className="input-field h-100"></textarea>
                        </div>
                    </div>
                </div>

                {/* 4: Social Profile Links */}
                <div className="glass-card">
                    <h3 className="form-section-title">
                        <GlobeIcon size={20} />
                        Social Profile Links
                    </h3>
                    <div className="social-grid">
                        <div className="input-group">
                            <label className="flex-align-center gap-6"><FacebookIcon size={14} /> Facebook URL</label>
                            <div className="social-input-wrapper">
                                <input type="text" id="facebookProfile" value={formData.facebookProfile} onChange={handleInputChange} className="input-field" placeholder="https://www.facebook.com/username" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="flex-align-center gap-6"><TwitterIcon size={14} /> Twitter URL</label>
                            <div className="social-input-wrapper">
                                <input type="text" id="twitterProfile" value={formData.twitterProfile} onChange={handleInputChange} className="input-field" placeholder="https://www.twitter.com/username" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="flex-align-center gap-6"><LinkedinIcon size={14} /> Linkedin URL</label>
                            <div className="social-input-wrapper">
                                <input type="text" id="linkedinProfile" value={formData.linkedinProfile} onChange={handleInputChange} className="input-field" placeholder="https://www.linkedin.com/in/username" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="flex-align-center gap-6"><GithubIcon size={14} /> GitHub URL</label>
                            <div className="social-input-wrapper">
                                <input type="text" id="githubProfile" value={formData.githubProfile} onChange={handleInputChange} className="input-field" placeholder="https://www.github.com/username" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4: Tickets Management */}
                <div className="glass-card">
                    <h3 className="form-section-title flex-justify-between">
                        <div className="flex-align-center gap-12">
                            <span className="form-section-number">5</span>
                            Tickets Management
                        </div>
                        <button type="button" onClick={() => setTickets([...tickets, { ticketNo: '', companyName: '', uploaddate: '', expdate: '', crtdate: '', type: 'Banca' }])} className="btn btn-sm btn-outline">
                            <PlusIcon size={14} className="mr-4" /> Add Ticket
                        </button>
                    </h3>
                    {tickets.map((t, i) => (
                        <div key={i} className="ticket-item">
                            {tickets.length > 1 && (
                                <button type="button" className="action-btn danger btn-sm" style={{ position: 'absolute', top: '12px', right: '12px' }} onClick={() => setTickets(tickets.filter((_, idx) => idx !== i))}>
                                    <XIcon size={14} />
                                </button>
                            )}
                            <div className="ticket-grid">
                                <div className="input-group">
                                    <div className="label-flex-between">
                                        <label>Current Company</label>
                                        <Popover trigger={<button type="button" className="btn btn-ghost btn-sm text-primary">+ Add New</button>}>
                                            <div className="popover-container">
                                                <input
                                                    type="text"
                                                    className="input-field mb-8"
                                                    placeholder="New Company"
                                                    value={popoverValues.ticketCompany}
                                                    onChange={(e) => handlePopoverInputChange('ticketCompany', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePopoverSubmit('ticketCompany', e, i))}
                                                />
                                                <button type="button" className="btn btn-primary btn-block btn-sm" onClick={(e) => handlePopoverSubmit('ticketCompany', e, i)}>Add Company</button>
                                            </div>
                                        </Popover>
                                    </div>
                                    <select value={t.companyName} onChange={e => handleTicketChange(i, 'companyName', e.target.value)} className="input-field">
                                        <option value="">Select Company</option>
                                        {openCompanies.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Ticket No</label>
                                    <input type="text" value={t.ticketNo} onChange={e => handleTicketChange(i, 'ticketNo', e.target.value)} className="input-field" placeholder="Enter No" />
                                </div>
                                <div className="input-group">
                                    <label>Upload Date</label>
                                    <AppDateInput value={t.uploaddate} onChange={e => handleTicketChange(i, 'uploaddate', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>EXP Date (Auto)</label>
                                    <AppDateInput value={t.expdate} readOnly={true} />
                                </div>
                                <div className="input-group">
                                    <label>CRT Date</label>
                                    <AppDateInput value={t.crtdate} onChange={e => handleTicketChange(i, 'crtdate', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Type</label>
                                    <select value={t.type} onChange={e => handleTicketChange(i, 'type', e.target.value)} className="input-field">
                                        <option value="Banca">Banca</option><option value="Direct">Direct</option><option value="Agency">Agency</option><option value="Partner">Partner</option><option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card">
                    <h3 className="form-section-title">
                        <span className="form-section-number">6</span>
                        Resume & Documents
                    </h3>
                    <p className="text-muted mb-24 fs-14">PDF / DOC Only for Resume. JPG/PNG for others.</p>
                    <div className="form-grid">
                        {[
                            { id: 'photograph', label: 'Photograph (JPG/PNG)' },
                            { id: 'panCard', label: 'PAN Card (JPG/PNG)' },
                            { id: 'aadhaarCard', label: 'Aadhaar Card (JPG/PNG)' },
                            { id: 'educationProof', label: 'Education Proof (JPG/PNG)' },
                            { id: 'offerLetter', label: 'Offer Letter (JPG/PNG)' },
                            { id: 'relativeLetter', label: 'Relieving Letter (JPG/PNG)' },
                            { id: 'salarySlip', label: 'Salary Slip (JPG/PNG/PDF)' },
                            { id: 'cheque', label: 'Cheque (JPG/PNG/PDF)' },
                            { id: 'signature', label: 'Signature (JPG/PNG/PDF)' }
                        ].map(doc => {
                            const hasExisting = existingDocs[doc.id];
                            const hasNew = docs[doc.id];
                            return (
                                <div key={doc.id} className="input-group">
                                    <div className="label-flex-between mb-8">
                                        <label className="m-0">{doc.label}</label>
                                        <div className="flex gap-8">
                                            {hasExisting && <button type="button" onClick={() => navigate(`/file-manager?search=Candidate: ${formData.name}`)} className="btn btn-ghost btn-xs text-info">History</button>}
                                            {hasExisting && !hasNew && <button type="button" onClick={() => setExistingDocs((prev: any) => ({ ...prev, [doc.id]: null }))} className="btn btn-ghost btn-xs text-primary">Change</button>}
                                        </div>
                                    </div>
                                    <input type="file" onChange={e => handleDocChange(doc.id, e)} className="input-field" disabled={!!(hasExisting && !hasNew)} />
                                    {hasNew && <p className="text-success mt-4 fs-12 flex-align-center gap-4"><CheckIcon size={12} /> Selected: {hasNew.name}</p>}
                                    {hasExisting && !hasNew && (
                                        <div className="flex gap-12 mt-8 fs-14">
                                            <button type="button" onClick={() => setPreviewDoc({ url: `${BASE_URL}${hasExisting.fileUrl}`, name: hasExisting.fileName || doc.label })} className="btn btn-ghost btn-sm">
                                                <EyeIcon size={14} className="mr-4" /> Preview
                                            </button>
                                            <a href={`${BASE_URL}${hasExisting.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                                <DownloadIcon size={14} /> Download
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Footer */}
                <div className="form-footer-sticky">
                    <div className="form-footer-buttons">
                        <button type="button" onClick={() => onClose ? onClose() : navigate('/candidates')} className="btn btn-secondary btn-lg">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg flex-1" disabled={submitting}>
                            {submitting ? (
                                <>Applying Changes...</>
                            ) : (
                                <>{id ? 'Update Candidate' : 'Create Candidate'}</>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <DocumentPreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                fileUrl={previewDoc?.url || ''}
                fileName={previewDoc?.name || ''}
            />

            {/* Work Experience Modal */}
            <Modal
                isOpen={isWorkModalOpen}
                onClose={() => setIsWorkModalOpen(false)}
                title="Add Work Experience"
                size="md"
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsWorkModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => {
                            setWorkHistory([...workHistory, { ...workForm }]);
                            setIsWorkModalOpen(false);
                            setWorkForm({
                                title: '', companyName: '', employmentType: 'Please Select',
                                industryType: 'Please Select',
                                location: '', salary: 0, currentlyWorking: false,
                                startDate: '', endDate: '', description: ''
                            });
                        }}>Save Work</button>
                    </>
                }
            >
                <div className="form-grid">
                    <div className="input-group full-width">
                        <label>Title</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Paper Sales Executive"
                            value={workForm.title}
                            onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                        />
                    </div>
                    <div className="input-group full-width">
                        <label>Company Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Dunder Muffin"
                            value={workForm.companyName}
                            onChange={(e) => setWorkForm({ ...workForm, companyName: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Employment Type</label>
                        <select
                            className="input-field"
                            value={workForm.employmentType}
                            onChange={(e) => setWorkForm({ ...workForm, employmentType: e.target.value })}
                        >
                            <option>Please Select</option>
                            <option>Full Time</option>
                            <option>Part Time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                            <option>Freelance</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Industry Type</label>
                        <select
                            className="input-field"
                            value={workForm.industryType}
                            onChange={(e) => setWorkForm({ ...workForm, industryType: e.target.value })}
                        >
                            <option>Please Select</option>
                            {industryTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Location</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Location"
                            value={workForm.location}
                            onChange={(e) => setWorkForm({ ...workForm, location: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Salary</label>
                        <input
                            type="number"
                            className="input-field"
                            value={workForm.salary}
                            onChange={(e) => setWorkForm({ ...workForm, salary: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="input-group full-width">
                        <div className="flex-align-center gap-12">
                            <span className="fs-13 fw-600 text-main">Currently working in this role</span>
                            <div
                                onClick={() => setWorkForm({ ...workForm, currentlyWorking: !workForm.currentlyWorking })}
                                className={`toggle-switch ${workForm.currentlyWorking ? 'active' : ''}`}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Start Date</label>
                        <AppDateInput
                            value={workForm.startDate}
                            onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                        />
                    </div>
                    {!workForm.currentlyWorking && (
                        <div className="input-group">
                            <label>End Date</label>
                            <AppDateInput
                                value={workForm.endDate}
                                onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="input-group full-width">
                        <label>Description</label>
                        <textarea
                            placeholder="Add Description"
                            className="input-field h-100"
                            value={workForm.description}
                            onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Education History Modal */}
            <Modal
                isOpen={isEducationModalOpen}
                onClose={() => setIsEducationModalOpen(false)}
                title="Add Education History"
                size="md"
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEducationModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => {
                            setEducationHistory([...educationHistory, { ...educationForm }]);
                            setIsEducationModalOpen(false);
                            setEducationForm({
                                schoolName: '', qualification: '', specialization: '',
                                grade: '', location: '', startDate: '', endDate: '',
                                description: ''
                            });
                        }}>Save Education</button>
                    </>
                }
            >
                <div className="form-grid">
                    <div className="input-group full-width">
                        <label>School/College Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="The University of Manchester"
                            value={educationForm.schoolName}
                            onChange={(e) => setEducationForm({ ...educationForm, schoolName: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Educational Qualification*</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Masters in Computer Application"
                            value={educationForm.qualification}
                            onChange={(e) => setEducationForm({ ...educationForm, qualification: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Educational Specialization</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Public Finance"
                            value={educationForm.specialization}
                            onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Grade</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="A+"
                            value={educationForm.grade}
                            onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Location</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Pune Area, India"
                            value={educationForm.location}
                            onChange={(e) => setEducationForm({ ...educationForm, location: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Start Date</label>
                        <AppDateInput
                            value={educationForm.startDate}
                            onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>End Date</label>
                        <AppDateInput
                            value={educationForm.endDate}
                            onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
                        />
                    </div>
                    <div className="input-group full-width">
                        <label>Description</label>
                        <textarea
                            placeholder="Add Description"
                            className="input-field h-100"
                            value={educationForm.description}
                            onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CandidateForm;
