import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    BriefcaseIcon,
    SaveIcon,
    XIcon,
    PlusIcon,
    TrashIcon,
    UploadIcon,
    ChevronDownIcon,
    UserIcon,
    MailIcon,
    PhoneIcon,
    GridIcon,
    UsersIcon
} from '../icons';

interface JobFormProps {
    editId?: string | null;
    initialManagerIndex?: number;
    onClose?: () => void;
    onSuccess?: () => void;
    hideHeader?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ editId, initialManagerIndex, onClose, onSuccess, hideHeader = false }) => {
    const { id: paramId } = useParams();
    const effectiveId = editId || paramId;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [expandedManagers, setExpandedManagers] = useState<number[]>([0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<any>({
        company: '',
        location: '',
        branch: '',
        date: new Date().toISOString().split('T')[0],
        logo: '',
        managers: [{
            name: '',
            email: '',
            phone: '',
            title: '',
            department: '',
            channel: '',
            openPosition: '',
            noOfCandidates: '',
            status: 'Open',
            expiryDays: '',
            crtDays: '',
            ctc: '',
            description: '',
            fls: '',
            nfls: '',
            vacancyQuestions: []
        }]
    });

    useEffect(() => {
        if (effectiveId) {
            fetchJob();
        }
    }, [effectiveId]);

    useEffect(() => {
        if (initialManagerIndex !== undefined) {
            setExpandedManagers([initialManagerIndex]);
        }
    }, [initialManagerIndex, editId]);

    const fetchJob = async () => {
        setPageLoading(true);
        try {
            const data = await api.getJobById(effectiveId!);
            setFormData({
                ...data,
                date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                managers: data.managers && data.managers.length > 0 ? data.managers.map((m: any) => ({
                    ...m,
                    vacancyQuestions: m.vacancyQuestions || []
                })) : [{
                    name: '', email: '', phone: '', title: '', department: '', channel: '',
                    openPosition: '', noOfCandidates: '', status: 'Open', expiryDays: '',
                    crtDays: '',
                    ctc: '', description: '', fls: '', nfls: '', vacancyQuestions: []
                }]
            });
        } catch (error) {
            showToast('Failed to fetch job details', 'error');
            if (onClose) onClose();
            else navigate('/jobs');
        } finally {
            setPageLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    // Managers Management
    const addManager = () => {
        setFormData((prev: any) => ({
            ...prev,
            managers: [...prev.managers, {
                name: '', email: '', phone: '', title: '', department: '', channel: '',
                openPosition: '', noOfCandidates: '', status: 'Open', expiryDays: '',
                crtDays: '',
                ctc: '', description: '', fls: '', nfls: '', vacancyQuestions: []
            }]
        }));
        setExpandedManagers(prev => [...prev, formData.managers.length]);
    };

    const removeManager = (index: number) => {
        if (formData.managers.length === 1) return;
        const updatedManagers = [...formData.managers];
        updatedManagers.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
        setExpandedManagers(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const toggleManager = (index: number) => {
        setExpandedManagers(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const expandAllManagers = () => {
        setExpandedManagers(formData.managers.map((_: any, i: number) => i));
    };

    const collapseAllManagers = () => {
        setExpandedManagers([]);
    };

    const handleManagerChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedManagers = [...formData.managers];
        updatedManagers[index] = { ...updatedManagers[index], [name]: value };
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    // Vacancy Questions Management
    const addQuestion = (mIndex: number, type: 'options' | 'dropdown' | 'text') => {
        const newQuestion = {
            question: '',
            questionType: type,
            options: type === 'options' ? ['', '', '', ''] : (type === 'dropdown' ? ['', ''] : [])
        };
        const updatedManagers = [...formData.managers];
        updatedManagers[mIndex].vacancyQuestions = [...updatedManagers[mIndex].vacancyQuestions, newQuestion];
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    const removeQuestion = (mIndex: number, qIndex: number) => {
        const updatedManagers = [...formData.managers];
        const updatedQuestions = [...updatedManagers[mIndex].vacancyQuestions];
        updatedQuestions.splice(qIndex, 1);
        updatedManagers[mIndex].vacancyQuestions = updatedQuestions;
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    const handleQuestionChange = (mIndex: number, qIndex: number, field: string, value: any) => {
        const updatedManagers = [...formData.managers];
        updatedManagers[mIndex].vacancyQuestions[qIndex][field] = value;
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    const handleOptionChange = (mIndex: number, qIndex: number, oIndex: number, value: string) => {
        const updatedManagers = [...formData.managers];
        const updatedQuestions = [...updatedManagers[mIndex].vacancyQuestions];
        const updatedOptions = [...(updatedQuestions[qIndex].options || [])];
        updatedOptions[oIndex] = value;
        updatedQuestions[qIndex].options = updatedOptions;
        updatedManagers[mIndex].vacancyQuestions = updatedQuestions;
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    const addOptionToDropdown = (mIndex: number, qIndex: number) => {
        const updatedManagers = [...formData.managers];
        const updatedQuestions = [...updatedManagers[mIndex].vacancyQuestions];
        updatedQuestions[qIndex].options = [...updatedQuestions[qIndex].options, ''];
        updatedManagers[mIndex].vacancyQuestions = updatedQuestions;
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    const removeOptionFromDropdown = (mIndex: number, qIndex: number, oIndex: number) => {
        const updatedManagers = [...formData.managers];
        const updatedQuestions = [...updatedManagers[mIndex].vacancyQuestions];
        const updatedOptions = [...updatedQuestions[qIndex].options];
        updatedOptions.splice(oIndex, 1);
        updatedQuestions[qIndex].options = updatedOptions;
        updatedManagers[mIndex].vacancyQuestions = updatedQuestions;
        setFormData((prev: any) => ({ ...prev, managers: updatedManagers }));
    };

    // Logo Upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
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
        
        // Validate nested managers
        for (let i = 0; i < formData.managers.length; i++) {
            const manager = formData.managers[i];
            if (!manager.name?.trim() || !manager.email?.trim() || !manager.phone?.trim() || !manager.title?.trim() || !manager.channel?.trim()) {
                showToast(`Please fill all required details (Name, Email, Phone, Designation, Channel) for Manager #${i + 1}`, 'error');
                // Automatically expand this manager's accordion
                setExpandedManagers(prev => prev.includes(i) ? prev : [...prev, i]);
                return;
            }
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('company', formData.company);
            submitData.append('location', formData.location);
            submitData.append('branch', formData.branch);
            submitData.append('date', formData.date);
            submitData.append('managers', JSON.stringify(formData.managers));
            
            if (logoFile) {
                submitData.append('logo', logoFile);
            } else if (formData.logo) {
                // If no new logo but there's an existing one, 
                // we send it so the backend doesn't overwrite it with empty string
                submitData.append('logo', formData.logo);
            }

            if (effectiveId) {
                await api.updateJob(effectiveId, submitData);
                showToast('Job updated successfully', 'success');
            } else {
                await api.createJob(submitData);
                showToast('Job created successfully', 'success');
            }

            if (onSuccess) onSuccess();
            if (onClose) onClose();
            else navigate('/jobs');
        } catch (error) {
            console.error(error);
            showToast(effectiveId ? 'Failed to update job' : 'Failed to create job', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className={`fade-in ${!hideHeader ? 'job-form-page' : ''}`}>
            <div className={`clean-form-container ${!hideHeader ? 'job-form-container' : 'job-form-drawer-container'}`}>
                {/* Header */}
                {!hideHeader && (
                    <div className="clean-form-header">
                        <div>
                            <h2 className="job-form-header-title">
                                <BriefcaseIcon size={24} color="#3b82f6" />
                                {effectiveId ? 'Edit Job Posting' : 'Create Job Posting'}
                            </h2>
                            <p className="job-form-header-subtitle">
                                Fill in the details for the position and requirements.
                            </p>
                        </div>
                        <button className="close-btn" onClick={() => onClose ? onClose() : navigate('/jobs')} title="Close">
                            <XIcon size={24} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
                    <div className="clean-form-body job-form-scroll-body custom-scrollbar">
                        {/* Section: Basic Details */}
                        <div className="job-form-section">
                            <h4 className="job-form-section-title">
                                <GridIcon size={18} />
                                Basic Details
                            </h4>

                            <div className="logo-upload-container">
                                <div className="logo-preview-box" onClick={() => fileInputRef.current?.click()}>
                                    {formData.logo ? (
                                        <img 
                                            src={formData.logo.startsWith('data:') || formData.logo.startsWith('http') 
                                                ? formData.logo 
                                                : `${BASE_URL}${formData.logo.startsWith('/') ? '' : '/'}${formData.logo}`} 
                                            alt="Company Logo" 
                                        />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <UploadIcon size={32} />
                                            <span>Logo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/*"
                                        hidden
                                    />
                                </div>
                                <div className="basic-info-grid single-column">
                                    <div className="clean-input-group">
                                        <label className="clean-input-label">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            className="clean-input-field"
                                            value={formData.date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="clean-input-group">
                                        <label className="clean-input-label">Company Name</label>
                                        <input
                                            type="text"
                                            name="company"
                                            className="clean-input-field"
                                            placeholder="Enter company name"
                                            value={formData.company}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="single-column" style={{ marginTop: '1.5rem' }}>
                                <div className="clean-input-group">
                                    <label className="clean-input-label">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="clean-input-field"
                                        placeholder="City, State"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="clean-input-group">
                                    <label className="clean-input-label">Branch</label>
                                    <input
                                        type="text"
                                        name="branch"
                                        className="clean-input-field"
                                        placeholder="Office Branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Managers & Job Details (Repeated Accordion) */}
                        <div className="section-header-flex managers-header">
                            <div className="flex-align-center gap-12">
                                <h4 className="job-form-section-title">
                                    <UsersIcon size={18} />
                                    Managers & Job Details
                                </h4>
                                <span className="count-badge">{formData.managers.length}</span>
                            </div>
                            <div className="header-actions">
                                <div className="view-controls">
                                    <button type="button" onClick={expandAllManagers} className="text-btn">Expand All</button>
                                    <span className="separator">|</span>
                                    <button type="button" onClick={collapseAllManagers} className="text-btn">Collapse All</button>
                                </div>
                                <button type="button" onClick={addManager} className="add-btn-primary">
                                    <PlusIcon size={16} /> Add Manager
                                </button>
                            </div>
                        </div>

                        <div className="managers-accordion-list">
                            {formData.managers.map((manager: any, mIndex: number) => {
                                const isExpanded = expandedManagers.includes(mIndex);
                                return (
                                    <div key={mIndex} className={`manager-requirement-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
                                        <div className="manager-card-header" onClick={() => toggleManager(mIndex)}>
                                            <div className="manager-title-flex">
                                                <ChevronDownIcon
                                                    size={18}
                                                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                                />
                                                <span>Manager #{mIndex + 1}: {manager.name || 'New Manager'}</span>
                                                {manager.title && <span className="title-badge">{manager.title}</span>}
                                            </div>
                                            <div className="flex-align-center gap-12">
                                                {formData.managers.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeManager(mIndex); }}
                                                        className="remove-btn-icon"
                                                        title="Remove this manager"
                                                    >
                                                        <TrashIcon size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="manager-card-body">
                                                {/* Manager Personal Info */}
                                                <div className="form-subsection">
                                                    <h5 className="subsection-title">Manager Details</h5>
                                                    <div className="single-column">
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Name <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <div className="input-with-icon">
                                                                <UserIcon size={16} />
                                                                <input
                                                                    type="text"
                                                                    name="name"
                                                                    className="clean-input-field"
                                                                    placeholder="Manager Name"
                                                                    value={manager.name}
                                                                    onChange={(e) => handleManagerChange(mIndex, e)} required />
                                                            </div>
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <div className="input-with-icon">
                                                                <MailIcon size={16} />
                                                                <input
                                                                    type="email"
                                                                    name="email"
                                                                    className="clean-input-field"
                                                                    placeholder="manager@company.com"
                                                                    value={manager.email}
                                                                    onChange={(e) => handleManagerChange(mIndex, e)} required />
                                                            </div>
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Phone No. <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <div className="input-with-icon">
                                                                <PhoneIcon size={16} />
                                                                <input
                                                                    type="text"
                                                                    name="phone"
                                                                    className="clean-input-field"
                                                                    placeholder="+91 ..."
                                                                    value={manager.phone}
                                                                    onChange={(e) => handleManagerChange(mIndex, e)} required />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Job Details for this Manager */}
                                                <div className="form-subsection">
                                                    <h5 className="subsection-title text-primary">Job Specifics</h5>
                                                    <div className="single-column">
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Designation (Title) <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                className="clean-input-field"
                                                                placeholder="e.g. Sales Manager"
                                                                value={manager.title}
                                                                onChange={(e) => handleManagerChange(mIndex, e)} required />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Department</label>
                                                            <input
                                                                type="text"
                                                                name="department"
                                                                className="clean-input-field"
                                                                placeholder="e.g. Sales, Operations"
                                                                value={manager.department}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Channel <span style={{ color: '#ef4444' }}>*</span></label>
                                                            <select
                                                                name="channel"
                                                                className="clean-input-field"
                                                                value={manager.channel}
                                                                onChange={(e) => handleManagerChange(mIndex, e)} required>
                                                                <option value="">Select Channel</option>
                                                                <option value="Banca">Banca</option>
                                                                <option value="Agency">Agency</option>
                                                                <option value="Direct">Direct</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Open Position</label>
                                                            <input
                                                                type="text"
                                                                name="openPosition"
                                                                className="clean-input-field"
                                                                placeholder="e.g. 5"
                                                                value={manager.openPosition}
                                                                onChange={(e) => handleManagerChange(mIndex, e)} required />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">No. of Candidate</label>
                                                            <input
                                                                type="text"
                                                                name="noOfCandidates"
                                                                className="clean-input-field"
                                                                placeholder="e.g. 10"
                                                                value={manager.noOfCandidates}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Status</label>
                                                            <select
                                                                name="status"
                                                                className="clean-input-field"
                                                                value={manager.status}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            >
                                                                <option value="Open">Open</option>
                                                                <option value="Closed">Closed</option>
                                                                <option value="Draft">Draft</option>
                                                                <option value="Hold">Hold</option>
                                                            </select>
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Expiry Days</label>
                                                            <input
                                                                type="text"
                                                                name="expiryDays"
                                                                className="clean-input-field"
                                                                placeholder="e.g. 30"
                                                                value={manager.expiryDays}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">CRT Days</label>
                                                            <input
                                                                type="text"
                                                                name="crtDays"
                                                                className="clean-input-field"
                                                                placeholder="e.g. 15"
                                                                value={manager.crtDays}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">CTC (LPA)</label>
                                                            <input
                                                                type="text"
                                                                name="ctc"
                                                                className="clean-input-field"
                                                                placeholder="e.g. 12.0"
                                                                value={manager.ctc}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">Description</label>
                                                            <textarea
                                                                name="description"
                                                                className="clean-input-field"
                                                                rows={3}
                                                                placeholder="Enter job description..."
                                                                value={manager.description}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            ></textarea>
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">FLS</label>
                                                            <input
                                                                type="text"
                                                                name="fls"
                                                                className="clean-input-field"
                                                                placeholder="Enter FLS detail"
                                                                value={manager.fls}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                        <div className="clean-input-group">
                                                            <label className="clean-input-label">NFLS</label>
                                                            <input
                                                                type="text"
                                                                name="nfls"
                                                                className="clean-input-field"
                                                                placeholder="Enter NFLS detail"
                                                                value={manager.nfls}
                                                                onChange={(e) => handleManagerChange(mIndex, e)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vacancy Questions for this Manager */}
                                                <div className="subsection-header-alt">
                                                    <div className="subsection-title-group">
                                                        <h5 className="subsection-title-bold">VACANCY QUESTIONS</h5>
                                                    </div>
                                                    <div className="question-action-row">
                                                        <button type="button" onClick={() => addQuestion(mIndex, 'options')} className="add-btn-pill">
                                                            <PlusIcon size={14} /> Options
                                                        </button>
                                                        <button type="button" onClick={() => addQuestion(mIndex, 'dropdown')} className="add-btn-pill">
                                                            <PlusIcon size={14} /> Dropdown
                                                        </button>
                                                        <button type="button" onClick={() => addQuestion(mIndex, 'text')} className="add-btn-pill">
                                                            <PlusIcon size={14} /> Text Box
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="questions-list">
                                                    {manager.vacancyQuestions.map((q: any, qIndex: number) => (
                                                        <div key={qIndex} className="question-card-form">
                                                            <div className="question-card-header-small">
                                                                <span className="question-type-badge">{q.questionType}</span>
                                                                <button type="button" onClick={() => removeQuestion(mIndex, qIndex)} className="remove-btn-icon">
                                                                    <TrashIcon size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="question-card-body-small">
                                                                <div className="clean-input-group">
                                                                    <label className="clean-input-label">Question</label>
                                                                    <input
                                                                        type="text"
                                                                        className="clean-input-field"
                                                                        placeholder="Enter your question here..."
                                                                        value={q.question}
                                                                        onChange={(e) => handleQuestionChange(mIndex, qIndex, 'question', e.target.value)}
                                                                    />
                                                                </div>

                                                                {q.questionType === 'options' && (
                                                                    <div className="options-grid">
                                                                        {['A', 'B', 'C', 'D'].map((label, oIndex) => (
                                                                            <div key={label} className="option-input-group">
                                                                                <span className="option-label">{label}</span>
                                                                                <input
                                                                                    type="text"
                                                                                    className="clean-input-field"
                                                                                    placeholder={`Option ${label}`}
                                                                                    value={q.options[oIndex] || ''}
                                                                                    onChange={(e) => handleOptionChange(mIndex, qIndex, oIndex, e.target.value)}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {q.questionType === 'dropdown' && (
                                                                    <div className="dropdown-options-list">
                                                                        <label className="clean-input-label">Dropdown Options</label>
                                                                        {q.options.map((opt: string, oIndex: number) => (
                                                                            <div key={oIndex} className="dropdown-option-row">
                                                                                <input
                                                                                    type="text"
                                                                                    className="clean-input-field"
                                                                                    placeholder={`Option ${oIndex + 1}`}
                                                                                    value={opt}
                                                                                    onChange={(e) => handleOptionChange(mIndex, qIndex, oIndex, e.target.value)}
                                                                                />
                                                                                {q.options.length > 1 && (
                                                                                    <button type="button" onClick={() => removeOptionFromDropdown(mIndex, qIndex, oIndex)} className="remove-opt-btn">
                                                                                        <XIcon size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        <button type="button" onClick={() => addOptionToDropdown(mIndex, qIndex)} className="add-opt-btn">
                                                                            + Add Option
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {q.questionType === 'text' && (
                                                                    <div className="text-box-preview">
                                                                        <div className="dummy-text-box">Candidate will write answer here...</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {manager.vacancyQuestions.length === 0 && (
                                                        <div className="empty-questions-msg">
                                                            No vacancy questions added for this manager.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer - Moved INSIDE the form */}
                    <div className="clean-form-footer job-form-footer sticky-footer">
                        <button type="button" onClick={() => onClose ? onClose() : navigate('/jobs')} className="btn-cancel-job">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-save-job">
                            <SaveIcon size={18} />
                            {loading ? 'Saving...' : (effectiveId ? 'Update Job' : 'Save Job')}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .job-form-container {
                    max-width: 900px;
                    margin: 2rem auto;
                }
                .job-form-drawer-container {
                    width: 100%;
                    margin: 0;
                }
                .logo-upload-container {
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-start;
                }
                .logo-preview-box {
                    width: 120px;
                    height: 120px;
                    border-radius: 16px;
                    background: #f8fafc;
                    border: 2px dashed #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .logo-preview-box:hover {
                    border-color: #3b82f6;
                    background: #eff6ff;
                }
                .logo-preview-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .basic-info-grid {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .single-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .section-header-flex {
                    display: flex; 
    flex-direction: column;
    justify-content: start;
    gap: 1rem;
                }
                .add-btn-small {
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: #eff6ff;
                    color: #2563eb;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 1px solid #dbeafe;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .add-btn-small:hover {
                    background: #dbeafe;
                }
                .manager-card-form, .question-card-form {
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 1rem;
                    overflow: hidden;
                }
                .manager-card-header, .question-card-header {
                    padding: 8px 16px;
                    background: #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                }
                .manager-card-body, .question-card-body {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .job-form-section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                    color: #1e293b;
                    margin-top: 0;
                    margin-bottom: 0;
                }
                .gap-12 { gap: 12px; }
                .flex-align-center { display: flex; align-items: center;justify-content: space-between; }
                .text-btn {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .text-btn:hover { background: #eff6ff; }
                
                .managers-accordion-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .manager-requirement-wrapper {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #fff;
                    transition: all 0.2s ease;
                }
                .manager-requirement-wrapper.is-expanded {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
                }
                .manager-card-header {
                    padding: 1rem 1.5rem;
                    background: #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                .manager-card-header:hover {
                    background: #f1f5f9;
                }
                .manager-requirement-wrapper.is-expanded .manager-card-header {
                    background: #eff6ff;
                    border-bottom: 1px solid #dbeafe;
                }
                .manager-title-flex {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 700;
                    color: #334155;
                }
                .title-badge {
                    background: #3b82f6;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }
                .manager-card-body {
                    padding: 1.5rem;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .single-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .form-subsection {
                    margin-bottom: 0;
                }
                .subsection-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 0;
                }
                .add-btn-primary {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }
                .add-btn-primary:hover {
                    background: #1d4ed8;
                }
                .question-card-form {
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 1rem;
                    overflow: hidden;
                }
                .question-card-header-small {
                    padding: 8px 12px;
                    background: #f1f5f9;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .question-card-body-small {
                    padding: 12px;
                }
                .remove-btn-icon {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                .remove-btn-icon:hover {
                    background: #fee2e2;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-with-icon svg {
                    position: absolute;
                    left: 12px;
                    color: #94a3b8;
                }
                .input-with-icon .clean-input-field {
                    padding-left: 36px;
                }
                .question-type-badge {
                    text-transform: uppercase;
                    background: #3b82f6;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                }
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .option-input-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .option-label {
                    width: 24px;
                    height: 24px;
                    background: #e2e8f0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #475569;
                }
                .dropdown-options-list {
                    margin-top: 1rem;
                }
                .dropdown-option-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .remove-opt-btn {
                    background: #f1f5f9;
                    border: none;
                    color: #64748b;
                    border-radius: 4px;
                    cursor: pointer;
                    padding: 0 8px;
                }
                .add-opt-btn {
                    background: none;
                    border: none;
                    color: #2563eb;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 0.5rem;
                }
                .text-box-preview {
                    margin-top: 1rem;
                }
                .dummy-text-box {
                    padding: 0.75rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 0.8125rem;
                }
                .add-question-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                .empty-questions-msg {
                    text-align: center;
                    padding: 2rem;
                    background: #f8fafc;
                    border: 2px dashed #e2e8f0;
                    border-radius: 12px;
                    color: #94a3b8;
                    font-size: 0.875rem;
                }

                /* Drawer Scroll & Sticky Footer Refinements */
                .job-form-scroll-body {
                    padding: 1rem !important;
                    height: calc(100dvh - 195px); /* Adjusted for sticky header/footer height */
                    overflow-y: auto;
                    overflow-x: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
 
                .count-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 1px solid #dbeafe;
                }
                .header-actions {
                       display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: end;
                }
                .view-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #f8fafc;
                    padding: 4px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .separator {
                    color: #e2e8f0;
                    font-size: 0.8rem;
                }
                
                .subsection-header-alt {
                    display: flex;
                    flex-direction: column;
                    justify-content: start;
                    gap: 1rem;
                }
                .subsection-title-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .subsection-title-bold {
                    font-size: 0.75rem; 
                    color: var(--primary);
                    letter-spacing: 0.05em;
                    margin: 0;
                }
                .question-action-row {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: end;
                }
                .add-btn-pill {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .add-btn-pill:hover {
                    border-color: #3b82f6;
                    color: #3b82f6;
                    background: #eff6ff;
                    transform: translateY(-1px);
                }
                .add-btn-pill svg {
                    color: #3b82f6;
                }
                
                .job-form-section {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    padding: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                
                .sticky-footer {
                    position: sticky;
                    bottom: 0;
                    z-index: 100;
                    background: white;
                    padding: 1.25rem 2rem !important;
                    box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.05);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    border-top: 1px solid #f1f5f9;
                }

                .clean-form-header {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: white;
                    padding: 1.25rem 2rem;
                    border-bottom: 1px solid #f1f5f9;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
                }
                
                .job-form-drawer-container .clean-form-body {
                    padding: 0;
                }
            `}</style>
        </div>
    );
};

export default JobForm;

