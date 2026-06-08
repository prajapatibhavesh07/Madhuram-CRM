import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
    PlusIcon, EditIcon, TrashIcon, SparklesIcon, 
    MailIcon, SendIcon, SearchIcon, CheckIcon
} from '../icons';
import Modal from '../components/Modal';

interface Template {
    _id: string;
    name: string;
    type: 'Email' | 'WhatsApp';
    subject?: string;
    body: string;
    isAiGenerated: boolean;
    createdAt: string;
}

const TemplateManagement = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Email' | 'WhatsApp'>('Email');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

    // Form fields
    const [isEditMode, setIsEditMode] = useState(false);
    const [formId, setFormId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<'Email' | 'WhatsApp'>('Email');
    const [formSubject, setFormSubject] = useState('');
    const [formBody, setFormBody] = useState('');
    const [isAiGeneratedFlag, setIsAiGeneratedFlag] = useState(false);

    // AI fields
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const isAuthorized = useMemo(() => {
        return user && ['Super Admin', 'Admin', 'Manager', 'Team Lead'].includes(user.role);
    }, [user]);

    useEffect(() => {
        if (isAuthorized) {
            fetchTemplates();
        }
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="candidate-list-page" style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card text-center" style={{ padding: '2rem', maxWidth: '400px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)' }}>
                    <h3 className="text-danger" style={{ marginBottom: '1rem', color: 'var(--danger)', fontWeight: 700 }}>Access Denied</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        You do not have the required permissions to manage communication templates.
                    </p>
                </div>
            </div>
        );
    }

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await api.getTemplates();
            setTemplates(data || []);
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setFormId(null);
        setFormName('');
        setFormType(activeTab);
        setFormSubject('');
        setFormBody('');
        setIsAiGeneratedFlag(false);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (template: Template) => {
        setIsEditMode(true);
        setFormId(template._id);
        setFormName(template.name);
        setFormType(template.type);
        setFormSubject(template.subject || '');
        setFormBody(template.body);
        setIsAiGeneratedFlag(template.isAiGenerated);
        setIsFormModalOpen(true);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formBody.trim()) {
            showToast('Name and body are required', 'warning');
            return;
        }
        if (formType === 'Email' && !formSubject.trim()) {
            showToast('Subject is required for Email templates', 'warning');
            return;
        }

        const payload = {
            name: formName,
            type: formType,
            subject: formType === 'Email' ? formSubject : undefined,
            body: formBody,
            isAiGenerated: isAiGeneratedFlag
        };

        try {
            if (isEditMode && formId) {
                await api.updateTemplate(formId, payload);
                showToast('Template updated successfully', 'success');
            } else {
                await api.createTemplate(payload);
                showToast('Template created successfully', 'success');
            }
            setIsFormModalOpen(false);
            fetchTemplates();
        } catch (error: any) {
            showToast(error.message || 'Failed to save template', 'error');
        }
    };

    const handleDeleteTemplate = async () => {
        if (!deletingTemplateId) return;
        try {
            await api.deleteTemplate(deletingTemplateId);
            showToast('Template deleted successfully', 'success');
            setDeletingTemplateId(null);
            fetchTemplates();
        } catch (error: any) {
            showToast(error.message || 'Failed to delete template', 'error');
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) {
            showToast('Please specify a description prompt for the template', 'warning');
            return;
        }
        setIsGenerating(true);
        try {
            const systemPrompt = `You are a professional recruiting copywriter. Generate communication templates based on user prompts. Ensure to use placeholders like @name, @designation, @company, @location where applicable. Return ONLY the template text. For Email templates, start the first line with 'Subject: [Email Subject]' followed by a blank line and the email body. For WhatsApp templates, do not include any subject.`;
            const prompt = `${systemPrompt}\n\nUser Request: Write a ${formType} template for: ${aiPrompt}`;
            const response = await api.askAssistant(prompt);
            
            const aiAnswer: string = response.data?.answer || response.answer || '';
            
            if (formType === 'Email') {
                if (aiAnswer.toLowerCase().includes('subject:')) {
                    const lines = aiAnswer.split('\n');
                    // Find the subject line
                    const subjectIdx = lines.findIndex(l => l.toLowerCase().startsWith('subject:'));
                    if (subjectIdx !== -1) {
                        const sub = lines[subjectIdx].substring(8).trim();
                        setFormSubject(sub);
                        
                        // Remaining lines form the body
                        const bodyContent = lines.slice(subjectIdx + 1).join('\n').trim();
                        setFormBody(bodyContent);
                    } else {
                        setFormBody(aiAnswer.trim());
                    }
                } else {
                    setFormBody(aiAnswer.trim());
                }
            } else {
                setFormBody(aiAnswer.trim());
            }

            setIsAiGeneratedFlag(true);
            setIsAiModalOpen(false);
            setAiPrompt('');
            showToast('Template generated successfully!', 'success');
        } catch (error: any) {
            showToast('AI Generation failed. Please compose manually.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesType = t.type === activeTab;
            const matchesSearch = !searchQuery || 
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subject?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [templates, activeTab, searchQuery]);

    const tags = [
        { label: 'Candidate Name', tag: '@name' },
        { label: 'Applied Role', tag: '@designation' },
        { label: 'Current Company', tag: '@company' },
        { label: 'Location', tag: '@location' },
        { label: 'Email', tag: '@email' },
        { label: 'Phone', tag: '@phone' }
    ];

    const insertTag = (tag: string) => {
        setFormBody(prev => prev + ' ' + tag);
    };

    return (
        <div className="candidate-list-page" style={{ height: 'calc(100vh - 64px)', overflowY: 'auto', padding: '1.5rem' }}>
            {/* Header */}
            <div className="job-list-header" style={{ marginBottom: '1.5rem' }}>
                <div className="header-title">
                    <h3>Communication Templates</h3>
                    <p>Manage shared templates for candidate email and WhatsApp campaigns.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>
                        <PlusIcon size={18} className="mr-8" /> Add Template
                    </button>
                </div>
            </div>

            {/* Tab switch bar */}
            <div className="tab-nav mb-20" style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                <button
                    onClick={() => setActiveTab('Email')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        background: activeTab === 'Email' ? '#ffffff' : 'transparent',
                        color: activeTab === 'Email' ? 'var(--primary)' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: activeTab === 'Email' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    <MailIcon size={16} />
                    <span>Email Templates</span>
                </button>
                <button
                    onClick={() => setActiveTab('WhatsApp')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        background: activeTab === 'WhatsApp' ? '#ffffff' : 'transparent',
                        color: activeTab === 'WhatsApp' ? 'var(--primary)' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: activeTab === 'WhatsApp' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    <SendIcon size={16} />
                    <span>WhatsApp Templates</span>
                </button>
            </div>

            {/* Main view container */}
            {loading ? (
                <div className="loading-state">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
                <div className="empty-state">
                    {searchQuery ? `No templates found matching "${searchQuery}"` : `No ${activeTab} templates created yet.`}
                </div>
            ) : (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '200px' }}>TEMPLATE NAME</th>
                                {activeTab === 'Email' && <th>SUBJECT</th>}
                                <th>MESSAGE PREVIEW</th>
                                <th style={{ width: '120px', textAlign: 'center' }}>SOURCE</th>
                                <th style={{ width: '100px', textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTemplates.map(template => (
                                <tr key={template._id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{template.name}</td>
                                    {activeTab === 'Email' && (
                                        <td style={{ color: 'var(--text-muted)' }}>{template.subject || '-'}</td>
                                    )}
                                    <td style={{
                                        maxWidth: '400px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.85rem'
                                    }}>
                                        {template.body}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {template.isAiGenerated ? (
                                            <span style={{
                                                fontSize: '0.72rem',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#6366f1',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                fontWeight: 700,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <SparklesIcon size={10} /> AI
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.72rem',
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                fontWeight: 700
                                            }}>
                                                Manual
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => handleOpenEdit(template)}
                                                title="Edit Template"
                                            >
                                                <EditIcon size={16} />
                                            </button>
                                            <button 
                                                className="btn-icon text-danger" 
                                                onClick={() => setDeletingTemplateId(template._id)}
                                                title="Delete Template"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Template Compose Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? 'Edit Template' : 'Create Template'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-12">
                        <button className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveTemplate}>Save Template</button>
                    </div>
                }
            >
                <div className="modal-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* AI Prompt Button for Creation */}
                    {!isEditMode && (
                        <button 
                            type="button" 
                            className="btn btn-outline flex-align-center justify-center gap-8"
                            onClick={() => setIsAiModalOpen(true)}
                            style={{
                                border: '1px dashed var(--primary)',
                                background: 'rgba(0, 84, 141, 0.02)',
                                color: 'var(--primary)',
                                width: '100%',
                                padding: '12px'
                            }}
                        >
                            <SparklesIcon size={16} /> Generate Layout using AI Assistant
                        </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">Template Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Interview Invite"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Template Type</label>
                            <select
                                className="input-field"
                                value={formType}
                                onChange={(e) => setFormType(e.target.value as any)}
                                disabled={isEditMode}
                            >
                                <option value="Email">Email</option>
                                <option value="WhatsApp">WhatsApp</option>
                            </select>
                        </div>
                    </div>

                    {formType === 'Email' && (
                        <div className="input-group">
                            <label className="input-label">Subject</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Email subject line..."
                                value={formSubject}
                                onChange={(e) => setFormSubject(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label className="input-label mb-0">Message Body</label>
                            {isAiGeneratedFlag && (
                                <span style={{ fontSize: '0.75rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckIcon size={12} /> Drafted by AI
                                </span>
                            )}
                        </div>

                        {/* Tag Injectors */}
                        <div className="tag-list mb-12" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {tags.map(t => (
                                <button
                                    key={t.tag}
                                    type="button"
                                    onClick={() => insertTag(t.tag)}
                                    className="tag-pill"
                                    style={{
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        fontSize: '0.72rem',
                                        borderRadius: '100px',
                                        padding: '4px 10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="input-field"
                            placeholder="Write message content here... Insert placeholder tags to bind dynamically."
                            value={formBody}
                            onChange={(e) => setFormBody(e.target.value)}
                            style={{ minHeight: '220px', lineHeight: '1.5' }}
                            required
                        />
                    </div>
                </div>
            </Modal>

            {/* AI Generator Modal */}
            <Modal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                title="Draft Layout with AI"
                footer={
                    <div className="flex justify-end gap-12">
                        <button className="btn btn-secondary" onClick={() => setIsAiModalOpen(false)}>Cancel</button>
                        <button 
                            className="btn btn-primary flex-align-center gap-8" 
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Writing...' : <><SparklesIcon size={16} /> Generate Template</>}
                        </button>
                    </div>
                }
            >
                <div className="modal-form-container">
                    <div className="input-group">
                        <label className="input-label">What is the template for?</label>
                        <textarea
                            className="input-field"
                            placeholder="Describe your desired template, e.g. 'Draft a follow-up WhatsApp invitation for candidates whose document verification is pending. Keep it short.'"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            style={{ minHeight: '120px' }}
                            required
                        />
                    </div>
                    <div className="modal-info-box" style={{ fontSize: '0.8rem', color: '#475569' }}>
                        <span>The AI assistant will automatically draft a copy and pre-populate the subject/message fields with appropriate tag placeholders.</span>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingTemplateId}
                onClose={() => setDeletingTemplateId(null)}
                title="Delete Template"
                footer={
                    <div className="flex justify-end gap-12">
                        <button className="btn btn-secondary" onClick={() => setDeletingTemplateId(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleDeleteTemplate} style={{ background: 'var(--danger)', color: 'white' }}>Delete</button>
                    </div>
                }
            >
                <p>Are you sure you want to permanently delete this template? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default TemplateManagement;
