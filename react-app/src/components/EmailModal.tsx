import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { SparklesIcon } from '../icons';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (subject: string, content: string) => void;
    candidateCount: number | 'all';
    loading?: boolean;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSend, candidateCount, loading = false }) => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await api.getTemplates();
                const emailTemplates = (data || []).filter((t: any) => t.type === 'Email');
                setTemplates(emailTemplates);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            }
        };
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setContent('');
            setSelectedTemplateId('custom');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(subject, content);
    };

    const insertTag = (tag: string) => {
        setContent(prev => prev + ' ' + tag);
    };

    const tags = [
        { label: 'Name', tag: '@name' },
        { label: 'Designation', tag: '@designation' },
        { label: 'Company', tag: '@company' },
        { label: 'Location', tag: '@location' },
        { label: 'Email', tag: '@email' },
    ];

    const handleGenerateDraft = async () => {
        if (!subject.trim()) {
            alert('Please enter a subject first to generate a relevant draft.');
            return;
        }
        setIsGenerating(true);
        try {
            const prompt = `Write a professional email draft for the subject: "${subject}". Use the following exact tags where appropriate: @name (Candidate Name), @company (Company Name), @designation (Job Role), @location (Location). Keep it concise and professional. Return ONLY the email body.`;
            const response = await api.askAssistant(prompt);
            setContent(response.data?.answer || response.answer || '');
        } catch (error) {
            console.error('Failed to generate AI draft', error);
            alert('Failed to generate AI draft. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compose Email"
            subtitle={`Sending to ${candidateCount === 'all' ? 'All' : candidateCount} selected candidate(s)`}
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !subject.trim() || !content.trim()}
                    >
                        {loading ? 'Sending...' : 'Send Email'}
                    </button>
                </>
            }
        >
            <div className="email-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                    <label className="input-label">Select Template</label>
                    <select
                        className="input-field"
                        value={selectedTemplateId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedTemplateId(val);
                            if (val === 'custom') {
                                setSubject('');
                                setContent('');
                            } else {
                                const selected = templates.find(t => t._id === val);
                                if (selected) {
                                    setSubject(selected.subject || '');
                                    setContent(selected.body || '');
                                }
                            }
                        }}
                    >
                        <option value="custom">Custom Message (No Template)</option>
                        {templates.map(t => (
                            <option key={t._id} value={t._id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Subject</label>
                    <input
                        type="text"
                        className="input-field"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                        disabled={selectedTemplateId !== 'custom'}
                        required
                    />
                </div>

                <div className="input-group">
                    <div className="flex justify-between align-center mb-10">
                        <label className="input-label mb-0">Message Content</label>
                        <button
                            type="button"
                            onClick={handleGenerateDraft}
                            disabled={isGenerating || !subject.trim() || selectedTemplateId !== 'custom'}
                            className="ai-magic-btn"
                        >
                            <SparklesIcon size={14} />
                            {isGenerating ? 'AI Writing...' : 'Generate with AI'}
                        </button>
                    </div>
                    
                    <div className="tag-list mb-12">
                        {tags.map(t => (
                            <button
                                key={t.tag}
                                type="button"
                                onClick={() => insertTag(t.tag)}
                                className="tag-pill"
                                disabled={selectedTemplateId !== 'custom'}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="input-field"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your email here... You can use @tags for dynamic data."
                        style={{ minHeight: '280px', paddingTop: '1rem', lineHeight: '1.6' }}
                        disabled={selectedTemplateId !== 'custom'}
                        required
                    />
                </div>
            </div>

        </Modal>
    );
};

export default EmailModal;
