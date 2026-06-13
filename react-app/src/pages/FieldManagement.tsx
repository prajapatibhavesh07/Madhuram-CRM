import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
    PlusIcon, EditIcon, TrashIcon, GripVerticalIcon, 
    SearchIcon, SettingsIcon, ChevronRightIcon, CheckIcon, XIcon
} from '../icons';

// Simple Copy Icon SVG
const CopyIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

// Archive Icon SVG
const ArchiveIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
);

interface WorkflowStage {
    _id?: string;
    name: string;
    requirements: {
        requireResume: boolean;
        requireFeedback: boolean;
        requireOfferLetter: boolean;
        requireSalarySlip: boolean;
    };
    actions: {
        showRejectButton: boolean;
        showOfferButton: boolean;
        showOnboardingSettings: boolean;
    };
    automationRules: {
        sendEmail: boolean;
        emailTemplateId: string | null;
        updateCandidateStatus: string;
    };
    isEnabled: boolean;
    isArchived: boolean;
}

interface Workflow {
    _id: string;
    name: string;
    description: string;
    isActive: boolean;
    isDefault: boolean;
    companyName: string;
    jobId: any;
    category: string;
    stages: WorkflowStage[];
}

const FieldManagement = () => {
    const { showToast } = useToast();
    const { user, activeRole } = useAuth();
    
    const canCreate = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.settings?.create === true;
    const canEdit = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.settings?.edit === true;
    const canDelete = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.settings?.delete === true;
    
    // Set general admin capability to edit capability for backward compatibility
    const isAdmin = canEdit;

    // Submodules Tabs: 'workflows' | 'options'
    const [activeSubTab, setActiveSubTab] = useState<'workflows' | 'options'>('workflows');

    // Workflows State
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [workflowSaving, setWorkflowSaving] = useState(false);

    // Search and Selection
    const [stageSearch, setStageSearch] = useState('');
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);

    // Workflow Modal
    const [showWorkflowModal, setShowWorkflowModal] = useState(false);
    const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
    const [workflowForm, setWorkflowForm] = useState({
        name: '',
        description: '',
        isDefault: false,
        isActive: true,
        companyName: '',
        jobId: '',
        category: ''
    });

    // Stage Modal / Drawer
    const [showStageModal, setShowStageModal] = useState(false);
    const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
    const [stageForm, setStageForm] = useState<WorkflowStage>({
        name: '',
        requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
        actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
        automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: '' },
        isEnabled: true,
        isArchived: false
    });

    // Option Dropdowns State
    const [options, setOptions] = useState<Record<string, string[]>>({});
    const [selectedOptionCategory, setSelectedOptionCategory] = useState<string>('designation');
    const [newOptionValue, setNewOptionValue] = useState('');
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [editingOption, setEditingOption] = useState<{ category: string, value: string } | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    const OPTION_CATEGORIES = [
        { key: 'currentCompany', label: 'Current Company' },
        { key: 'currentProfile', label: 'Current Profile' },
        { key: 'designation', label: 'Designation' },
        { key: 'noticePeriod', label: 'Notice Period' },
        { key: 'sector', label: 'Sectors/industries' },
        { key: 'channel', label: 'Sourcing Channels' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'leadTag', label: 'Lead Tag' },
        { key: 'recruitmentStatus', label: 'Recruitment Status' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'assessmentStatus', label: 'Assessment Status' }
    ];

    const ATS_STATUSES = ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Joined'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [wfs, jobsData, tmpls] = await Promise.all([
                api.getWorkflows(),
                api.getJobs({ status: 'Open' }).catch(() => []),
                api.getTemplates().catch(() => [])
            ]);
            setWorkflows(wfs);
            setJobs(jobsData);
            setTemplates(tmpls.filter((t: any) => t.type === 'Email'));
            
            // Set first workflow as selected
            if (wfs.length > 0) {
                setSelectedWorkflow(wfs[0]);
            }
        } catch (error) {
            showToast('Failed to load workflow configurations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownOptions = async () => {
        setOptionsLoading(true);
        try {
            const data = await api.getOptions();
            setOptions(data);
        } catch (error) {
            showToast('Failed to load option fields', 'error');
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'options') {
            fetchDropdownOptions();
        }
    }, [activeSubTab]);

    const handleOpenEditWorkflow = (wf: Workflow) => {
        setWorkflowForm({
            name: wf.name,
            description: wf.description || '',
            isDefault: wf.isDefault || false,
            isActive: wf.isActive || false,
            companyName: wf.companyName || '',
            jobId: (wf.jobId?._id || wf.jobId || ''),
            category: wf.category || ''
        });
        setEditingWorkflowId(wf._id);
        setShowWorkflowModal(true);
    };

    // Handle Workflow Save
    const handleWorkflowSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workflowForm.name.trim()) return showToast('Workflow name is required', 'warning');

        setWorkflowSaving(true);
        try {
            const payload = {
                ...workflowForm,
                jobId: workflowForm.jobId || null
            };

            if (editingWorkflowId) {
                const updated = await api.updateWorkflow(editingWorkflowId, payload);
                setWorkflows(prev => prev.map(w => w._id === editingWorkflowId ? updated : w));
                setSelectedWorkflow(updated);
                showToast('Interview workflow updated successfully', 'success');
            } else {
                const newWf = await api.createWorkflow(payload);
                setWorkflows(prev => [newWf, ...prev]);
                setSelectedWorkflow(newWf);
                showToast('Interview workflow created successfully', 'success');
            }
            setShowWorkflowModal(false);
            setEditingWorkflowId(null);
        } catch (error: any) {
            showToast(error.message || `Failed to ${editingWorkflowId ? 'update' : 'create'} workflow`, 'error');
        } finally {
            setWorkflowSaving(false);
        }
    };

    // Duplicate Workflow
    const handleDuplicateWorkflow = async (id: string) => {
        if (!window.confirm('Duplicate this workflow with all its stages and rules?')) return;
        try {
            const newWf = await api.duplicateWorkflow(id);
            setWorkflows(prev => [...prev, newWf]);
            setSelectedWorkflow(newWf);
            showToast('Workflow duplicated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to duplicate workflow', 'error');
        }
    };

    // Delete Workflow
    const handleDeleteWorkflow = async (id: string) => {
        const wf = workflows.find(w => w._id === id);
        if (!wf) return;
        if (wf.isDefault) return showToast('Cannot delete the default workflow', 'warning');
        if (!window.confirm(`Are you sure you want to delete "${wf.name}"? This action cannot be undone.`)) return;

        try {
            await api.deleteWorkflow(id);
            const remaining = workflows.filter(w => w._id !== id);
            setWorkflows(remaining);
            setSelectedWorkflow(remaining[0] || null);
            showToast('Workflow deleted successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to delete workflow', 'error');
        }
    };

    // Update Workflow settings
    const handleUpdateWorkflowSettings = async (updates: Partial<Workflow>) => {
        if (!selectedWorkflow) return;
        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, updates);
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            showToast('Workflow rules updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update workflow rules', 'error');
        }
    };

    // Filter stages by search query
    const filteredStages = useMemo(() => {
        if (!selectedWorkflow) return [];
        return selectedWorkflow.stages.filter(stage => 
            stage.name.toLowerCase().includes(stageSearch.toLowerCase())
        );
    }, [selectedWorkflow, stageSearch]);

    // HTML5 Native Drag & Drop Reordering
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = async () => {
        if (!selectedWorkflow || dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        const copyListItems = [...selectedWorkflow.stages];
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;

        // Perform instant local update
        const updatedWf = { ...selectedWorkflow, stages: copyListItems };
        setSelectedWorkflow(updatedWf);

        try {
            await api.updateWorkflow(selectedWorkflow._id, { stages: copyListItems });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updatedWf : w));
            showToast('Stage order updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save stage order', 'error');
            // Revert on error
            fetchInitialData();
        }
    };

    // Stage Form Drawer Handler
    const handleOpenStageModal = (index: number | null = null) => {
        if (!canEdit) return showToast('Access denied', 'error');
        if (index !== null && selectedWorkflow) {
            setEditingStageIndex(index);
            setStageForm({ ...selectedWorkflow.stages[index] });
        } else {
            setEditingStageIndex(null);
            setStageForm({
                name: '',
                requirements: { requireResume: false, requireFeedback: false, requireOfferLetter: false, requireSalarySlip: false },
                actions: { showRejectButton: true, showOfferButton: false, showOnboardingSettings: false },
                automationRules: { sendEmail: false, emailTemplateId: null, updateCandidateStatus: '' },
                isEnabled: true,
                isArchived: false
            });
        }
        setShowStageModal(true);
    };

    const handleStageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return showToast('Access denied', 'error');
        if (!selectedWorkflow) return;
        if (!stageForm.name.trim()) return showToast('Stage name is required', 'warning');

        const updatedStages = [...selectedWorkflow.stages];

        if (editingStageIndex !== null) {
            // Update
            updatedStages[editingStageIndex] = stageForm;
        } else {
            // Create
            updatedStages.push(stageForm);
        }

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: updatedStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            setShowStageModal(false);
            showToast(editingStageIndex !== null ? 'Stage updated successfully' : 'Stage added successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save stage details', 'error');
        }
    };

    // Duplicate Stage
    const handleDuplicateStage = async (index: number) => {
        if (!canEdit) return showToast('Access denied', 'error');
        if (!selectedWorkflow) return;
        const target = selectedWorkflow.stages[index];
        const newStages = [...selectedWorkflow.stages];
        
        newStages.splice(index + 1, 0, {
            ...target,
            name: `${target.name} (Copy)`
        });

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: newStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            showToast('Stage duplicated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to duplicate stage', 'error');
        }
    };

    // Toggle Stage Enabled status
    const handleToggleStageEnabled = async (index: number) => {
        if (!canEdit) return showToast('Access denied', 'error');
        if (!selectedWorkflow) return;
        const newStages = [...selectedWorkflow.stages];
        newStages[index].isEnabled = !newStages[index].isEnabled;

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: newStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            showToast(`Stage ${newStages[index].isEnabled ? 'enabled' : 'disabled'}`, 'info');
        } catch (error: any) {
            showToast(error.message || 'Failed to update stage status', 'error');
        }
    };

    // Archive Stage
    const handleToggleStageArchived = async (index: number) => {
        if (!canEdit) return showToast('Access denied', 'error');
        if (!selectedWorkflow) return;
        const newStages = [...selectedWorkflow.stages];
        newStages[index].isArchived = !newStages[index].isArchived;

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: newStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            showToast(newStages[index].isArchived ? 'Stage archived' : 'Stage unarchived', 'info');
        } catch (error: any) {
            showToast(error.message || 'Failed to update archive status', 'error');
        }
    };

    // Delete Stage
    const handleDeleteStage = async (index: number) => {
        if (!canDelete) return showToast('Access denied', 'error');
        if (!selectedWorkflow) return;
        if (!window.confirm(`Delete stage "${selectedWorkflow.stages[index].name}"?`)) return;

        const newStages = selectedWorkflow.stages.filter((_, idx) => idx !== index);

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: newStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            showToast('Stage deleted successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to delete stage', 'error');
        }
    };

    // Bulk toggle / update
    const handleBulkStageAction = async (action: 'enable' | 'disable' | 'archive' | 'unarchive' | 'delete') => {
        if (action === 'delete' ? !canDelete : !canEdit) return showToast('Access denied', 'error');
        if (!selectedWorkflow || selectedStageIds.length === 0) return;
        if (action === 'delete' && !window.confirm(`Delete ${selectedStageIds.length} selected stages?`)) return;

        let newStages = [...selectedWorkflow.stages];

        if (action === 'delete') {
            newStages = newStages.filter(s => !selectedStageIds.includes(s._id || s.name));
        } else {
            newStages = newStages.map(s => {
                const matches = selectedStageIds.includes(s._id || s.name);
                if (matches) {
                    if (action === 'enable') return { ...s, isEnabled: true };
                    if (action === 'disable') return { ...s, isEnabled: false };
                    if (action === 'archive') return { ...s, isArchived: true };
                    if (action === 'unarchive') return { ...s, isArchived: false };
                }
                return s;
            });
        }

        try {
            const updated = await api.updateWorkflow(selectedWorkflow._id, { stages: newStages });
            setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? updated : w));
            setSelectedWorkflow(updated);
            setSelectedStageIds([]);
            showToast(`Bulk action completed successfully`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to complete bulk updates', 'error');
        }
    };

    // CENTRAL OPTIONS MANAGEMENT
    const handleAddOption = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreate) return showToast('Access denied', 'error');
        if (!newOptionValue.trim()) return showToast('Please enter an option value', 'warning');

        try {
            await api.addOption({
                category: selectedOptionCategory,
                value: newOptionValue.trim()
            });
            showToast('Option value added successfully', 'success');
            setNewOptionValue('');
            fetchDropdownOptions(); // Refresh options list
        } catch (error: any) {
            showToast(error.message || 'Failed to add option', 'error');
        }
    };

    const handleDeleteOption = async (value: string) => {
        if (!canDelete) return showToast('Access denied', 'error');
        if (!window.confirm(`Delete the value "${value}" from dropdown options?`)) return;

        try {
            await api.deleteOption({
                category: selectedOptionCategory,
                value: value
            });
            showToast('Option value deleted successfully', 'success');
            fetchDropdownOptions(); // Refresh
        } catch (error: any) {
            showToast(error.message || 'Failed to delete option', 'error');
        }
    };

    const handleSaveEditOption = async (oldValue: string) => {
        if (!canEdit) return showToast('Access denied', 'error');
        const trimmedNewVal = editingValue.trim();
        if (!trimmedNewVal) return showToast('Option value cannot be empty', 'warning');
        if (trimmedNewVal === oldValue) {
            setEditingOption(null);
            setEditingValue('');
            return;
        }

        try {
            await api.updateOption({
                category: selectedOptionCategory,
                oldValue: oldValue,
                newValue: trimmedNewVal
            });
            showToast('Option value renamed successfully', 'success');
            setEditingOption(null);
            setEditingValue('');
            fetchDropdownOptions(); // Refresh
        } catch (error: any) {
            showToast(error.message || 'Failed to rename option', 'error');
        }
    };

    return (
        <div className="fade-in custom-scrollbar" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
            {/* Page Title */}
            <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SettingsIcon size={24} color="var(--primary)" /> Field & Workflow Management
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Configure candidate fields, standard option dropdowns, and dynamic recruitment timeline workflows.</p>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1.5rem' }}>
                <button
                    onClick={() => setActiveSubTab('workflows')}
                    style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: activeSubTab === 'workflows' ? 'var(--primary)' : '#64748b',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: activeSubTab === 'workflows' ? '3px solid var(--primary)' : '3px solid transparent',
                        background: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Recruitment Workflows
                </button>
                <button
                    onClick={() => setActiveSubTab('options')}
                    style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: activeSubTab === 'options' ? 'var(--primary)' : '#64748b',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: activeSubTab === 'options' ? '3px solid var(--primary)' : '3px solid transparent',
                        background: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Dropdown Options
                </button>
            </div>

            {/* Content Switcher */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner"></div>
                    <p style={{ color: '#64748b' }}>Fetching configurations...</p>
                </div>
            ) : activeSubTab === 'workflows' ? (
                /* Workflows Sub-Tab */
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                    
                    {/* Left: Workflows Selection Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="widget-card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>Active Workflows</h3>
                                {canCreate && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ height: '30px', padding: '0 8px', fontSize: '0.75rem', display: 'flex', gap: '4px' }}
                                        onClick={() => {
                                            setWorkflowForm({
                                                name: '',
                                                description: '',
                                                isDefault: false,
                                                isActive: true,
                                                companyName: '',
                                                jobId: '',
                                                category: ''
                                            });
                                            setEditingWorkflowId(null);
                                            setShowWorkflowModal(true);
                                        }}
                                    >
                                        <PlusIcon size={12} /> Add
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {workflows.map(wf => (
                                    <div
                                        key={wf._id}
                                        onClick={() => setSelectedWorkflow(wf)}
                                        className="nav-item-hover"
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: selectedWorkflow?._id === wf._id ? 'rgba(0, 84, 141, 0.06)' : 'transparent',
                                            border: selectedWorkflow?._id === wf._id ? '1px solid rgba(0, 84, 141, 0.15)' : '1px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, paddingRight: '4px' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: selectedWorkflow?._id === wf._id ? 'var(--primary)' : '#1e293b', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                {wf.name}
                                            </span>
                                            {wf.isDefault && (
                                                <span style={{ fontSize: '0.65rem', color: '#fa801c', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                                                    [ System Default ]
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleOpenEditWorkflow(wf)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                    title="Edit Workflow"
                                                >
                                                    <EditIcon size={13} />
                                                </button>
                                            )}
                                            {!wf.isDefault && canDelete && (
                                                <button
                                                    onClick={() => handleDeleteWorkflow(wf._id)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                    title="Delete Workflow"
                                                >
                                                    <TrashIcon size={13} />
                                                </button>
                                            )}
                                            <ChevronRightIcon size={14} color="#94a3b8" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matching Target Rules (Context for selected workflow) */}
                        {selectedWorkflow && (
                            <div className="widget-card" style={{ padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Matching Context Rules
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Assigned Job</label>
                                        <select
                                            className="input-field"
                                            style={{ height: '34px', fontSize: '0.8rem', padding: '0 8px' }}
                                            value={selectedWorkflow.jobId?._id || selectedWorkflow.jobId || ''}
                                            onChange={e => handleUpdateWorkflowSettings({ jobId: e.target.value || null })}
                                            disabled={!isAdmin || selectedWorkflow.isDefault}
                                        >
                                            <option value="">Matches any Job</option>
                                            {jobs.map(j => (
                                                <option key={j._id} value={j._id}>{j.company ? `${j.company} - ${j.title}` : j.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Matching Company</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. MasterCard"
                                            style={{ height: '34px', fontSize: '0.8rem', padding: '0 8px' }}
                                            value={selectedWorkflow.companyName || ''}
                                            onBlur={e => handleUpdateWorkflowSettings({ companyName: e.target.value })}
                                            onChange={e => setSelectedWorkflow({ ...selectedWorkflow, companyName: e.target.value })}
                                            disabled={!isAdmin || selectedWorkflow.isDefault}
                                        />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Sector Category</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. BFSI, IT"
                                            style={{ height: '34px', fontSize: '0.8rem', padding: '0 8px' }}
                                            value={selectedWorkflow.category || ''}
                                            onBlur={e => handleUpdateWorkflowSettings({ category: e.target.value })}
                                            onChange={e => setSelectedWorkflow({ ...selectedWorkflow, category: e.target.value })}
                                            disabled={!isAdmin || selectedWorkflow.isDefault}
                                        />
                                    </div>

                                    {/* System Default Switch */}
                                    {isAdmin && !selectedWorkflow.isDefault && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginTop: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedWorkflow.isDefault}
                                                onChange={e => handleUpdateWorkflowSettings({ isDefault: e.target.checked })}
                                            />
                                            Set as Default Workflow
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Stage List & Reordering */}
                    {selectedWorkflow ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Workflow detail header */}
                            <div className="widget-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0, 84, 141, 0.04) 0%, rgba(250, 128, 28, 0.04) 100%)' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                                        {selectedWorkflow.name}
                                    </h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{selectedWorkflow.description || 'No description provided.'}</p>
                                </div>

                                {(canCreate || canEdit || (!selectedWorkflow.isDefault && canDelete)) && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {canEdit && (
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}
                                                onClick={() => handleOpenEditWorkflow(selectedWorkflow)}
                                            >
                                                <EditIcon size={14} /> Edit Workflow
                                            </button>
                                        )}
                                        {canCreate && (
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}
                                                onClick={() => handleDuplicateWorkflow(selectedWorkflow._id)}
                                            >
                                                <CopyIcon size={14} /> Duplicate Workflow
                                            </button>
                                        )}
                                        {!selectedWorkflow.isDefault && canDelete && (
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fca5a5' }}
                                                onClick={() => handleDeleteWorkflow(selectedWorkflow._id)}
                                            >
                                                Delete Workflow
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stage Controls: Search, Add, Bulk Actions */}
                            <div className="widget-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                                    
                                    {/* Search input */}
                                    <div className="search-field" style={{ width: '280px', margin: 0 }}>
                                        <SearchIcon size={16} className="search-icon-svg" />
                                        <input
                                            type="text"
                                            placeholder="Search stages in workflow..."
                                            value={stageSearch}
                                            onChange={e => setStageSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        
                                        {/* Bulk Actions Panel */}
                                        {selectedStageIds.length > 0 && isAdmin && (
                                            <div style={{ display: 'flex', gap: '6px', paddingRight: '8px', borderRight: '1px solid var(--border)' }}>
                                                <button onClick={() => handleBulkStageAction('enable')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}>Bulk Enable</button>
                                                <button onClick={() => handleBulkStageAction('disable')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}>Bulk Disable</button>
                                                <button onClick={() => handleBulkStageAction('archive')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}><ArchiveIcon size={12} /> Bulk Archive</button>
                                                <button onClick={() => handleBulkStageAction('delete')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', color: '#ef4444' }}>Bulk Delete</button>
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => handleOpenStageModal(null)}
                                                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                                            >
                                                <PlusIcon size={14} /> Add Stage
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Stepper Preview Map */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', alignSelf: 'center', marginRight: '6px' }}>Timeline Preview:</span>
                                    {selectedWorkflow.stages.filter(s => s.isEnabled && !s.isArchived).map((stage, idx, arr) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                                                {stage.name}
                                            </span>
                                            {idx < arr.length - 1 && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>&rarr;</span>}
                                        </div>
                                    ))}
                                </div>

                                {/* Drag-and-drop Stage List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {filteredStages.map((stage, index) => {
                                        const stageIdentifier = stage._id || stage.name;
                                        const isChecked = selectedStageIds.includes(stageIdentifier);

                                        return (
                                            <div
                                                key={stageIdentifier}
                                                draggable={isAdmin}
                                                onDragStart={() => handleDragStart(index)}
                                                onDragEnter={() => handleDragEnter(index)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => e.preventDefault()}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    background: stage.isArchived ? '#f1f5f9' : 'white',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                    cursor: isAdmin ? 'grab' : 'default',
                                                    opacity: stage.isEnabled ? 1 : 0.6,
                                                    transition: 'all 0.15s ease'
                                                }}
                                                className="stage-card-item"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {/* Checkbox for Bulk Actions */}
                                                    {isAdmin && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                setSelectedStageIds(prev => 
                                                                    isChecked 
                                                                        ? prev.filter(id => id !== stageIdentifier)
                                                                        : [...prev, stageIdentifier]
                                                                );
                                                            }}
                                                        />
                                                    )}
                                                    
                                                    {/* Drag Handle Icon */}
                                                    {isAdmin && <GripVerticalIcon size={16} color="#94a3b8" style={{ cursor: 'grab' }} />}
                                                    
                                                    {/* Stage Name / Badge info */}
                                                    <div>
                                                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                                                            {stage.name}
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                            {/* Requirements markers */}
                                                            {Object.entries(stage.requirements).some(([_, v]) => v) && (
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                                    Requires: {Object.entries(stage.requirements).filter(([_, v]) => v).map(([k]) => k.replace('require', '')).join(', ')}
                                                                </span>
                                                            )}
                                                            {/* Automations markers */}
                                                            {stage.automationRules.sendEmail && (
                                                                <span style={{ fontSize: '0.65rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                                    Auto-Email
                                                                </span>
                                                            )}
                                                            {stage.automationRules.updateCandidateStatus && (
                                                                <span style={{ fontSize: '0.65rem', color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                                    Auto-ATS: {stage.automationRules.updateCandidateStatus}
                                                                </span>
                                                            )}
                                                            {stage.isArchived && (
                                                                <span style={{ fontSize: '0.65rem', color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                                                    ARCHIVED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stage Actions */}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    {isAdmin && (
                                                        <>
                                                            {/* Toggle switch for enabled/disabled */}
                                                            <button 
                                                                onClick={() => handleToggleStageEnabled(index)}
                                                                className={`btn ${stage.isEnabled ? 'btn-secondary' : 'btn-primary'}`}
                                                                style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                                                            >
                                                                {stage.isEnabled ? 'Disable' : 'Enable'}
                                                            </button>

                                                            {/* Archive toggle */}
                                                            <button 
                                                                onClick={() => handleToggleStageArchived(index)}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '4px', height: '26px', width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                title={stage.isArchived ? 'Unarchive Stage' : 'Archive Stage'}
                                                            >
                                                                <ArchiveIcon size={12} color={stage.isArchived ? '#ef4444' : '#64748b'} />
                                                            </button>

                                                            {/* Duplicate stage */}
                                                            <button 
                                                                onClick={() => handleDuplicateStage(index)}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '4px', height: '26px', width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                title="Duplicate Stage"
                                                            >
                                                                <CopyIcon size={12} color="#64748b" />
                                                            </button>

                                                            {/* Edit Stage */}
                                                            <button 
                                                                onClick={() => handleOpenStageModal(index)}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '4px', height: '26px', width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <EditIcon size={12} color="#64748b" />
                                                            </button>

                                                            {/* Delete Stage */}
                                                            {canDelete && (
                                                                <button 
                                                                    onClick={() => handleDeleteStage(index)}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '4px', height: '26px', width: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <TrashIcon size={12} color="#ef4444" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No workflows found. Create one to get started.</div>
                    )}
                </div>
            ) : (
                /* Dropdown Options Sub-Tab */
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                    {/* Left: Options Categories List */}
                    <div className="widget-card" style={{ padding: '1.25rem', height: 'fit-content' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem' }}>Dropdown Categories</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {OPTION_CATEGORIES.map(category => (
                                <button
                                    key={category.key}
                                    onClick={() => setSelectedOptionCategory(category.key)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        background: selectedOptionCategory === category.key ? 'rgba(0, 84, 141, 0.06)' : 'transparent',
                                        color: selectedOptionCategory === category.key ? 'var(--primary)' : '#475569',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Values Management */}
                    <div className="widget-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                            {OPTION_CATEGORIES.find(c => c.key === selectedOptionCategory)?.label} Values
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Configure dropdown options. New options will instantly populate input forms throughout the CRM.
                        </p>

                        {/* Add Option Form */}
                        {canCreate && (
                            <form onSubmit={handleAddOption} style={{ display: 'flex', gap: '12px', maxWidth: '500px', marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter new option value..."
                                    className="input-field"
                                    style={{ margin: 0 }}
                                    value={newOptionValue}
                                    onChange={e => setNewOptionValue(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <PlusIcon size={16} /> Add Value
                                </button>
                            </form>
                        )}

                        {optionsLoading ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '1.5rem', color: '#64748b' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px' }}></div> Fetching options...
                            </div>
                        ) : (
                            /* Values Grid List */
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                {(options[selectedOptionCategory] || []).map(val => {
                                    const isEditing = editingOption?.category === selectedOptionCategory && editingOption?.value === val;
                                    return (
                                        <div
                                            key={val}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                background: '#f8fafc',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                gap: '8px',
                                                minHeight: '42px',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        style={{ margin: 0, padding: '4px 8px', fontSize: '0.85rem', height: '28px', flex: 1 }}
                                                        value={editingValue}
                                                        onChange={e => setEditingValue(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleSaveEditOption(val);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingOption(null);
                                                                setEditingValue('');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSaveEditOption(val)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#10b981', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                        title="Save"
                                                    >
                                                        <CheckIcon size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingOption(null); setEditingValue(''); }}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                        title="Cancel"
                                                    >
                                                        <XIcon size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155', wordBreak: 'break-all' }}>{val}</span>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingOption({ category: selectedOptionCategory, value: val });
                                                                    setEditingValue(val);
                                                                }}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                                title="Edit Option"
                                                            >
                                                                <EditIcon size={14} />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDeleteOption(val)}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                                title="Delete Option"
                                                            >
                                                                <TrashIcon size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                {(options[selectedOptionCategory] || []).length === 0 && (
                                    <div style={{ gridColumn: 'span 4', color: '#94a3b8', fontSize: '0.85rem', padding: '1rem', fontStyle: 'italic' }}>
                                        No values added yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Workflow Create/Edit Modal */}
            {showWorkflowModal && (
                <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="modal-card" style={{ background: 'white', borderRadius: '12px', width: '500px', maxWidth: '90%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                                {editingWorkflowId ? 'Edit Interview Workflow' : 'Create New Interview Workflow'}
                            </h3>
                            <button onClick={() => { setShowWorkflowModal(false); setEditingWorkflowId(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#94a3b8' }}>&times;</button>
                        </div>
                        
                        <form onSubmit={handleWorkflowSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Workflow Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Banca Workflow"
                                    className="input-field"
                                    required
                                    value={workflowForm.name}
                                    onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Description</label>
                                <textarea
                                    placeholder="Describe when this workflow is applied..."
                                    className="input-field"
                                    style={{ minHeight: '80px', padding: '8px' }}
                                    value={workflowForm.description}
                                    onChange={e => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Apply Target Job (Optional)</label>
                                <select
                                    className="input-field"
                                    value={workflowForm.jobId}
                                    onChange={e => setWorkflowForm({ ...workflowForm, jobId: e.target.value })}
                                >
                                    <option value="">Matches any Job</option>
                                    {jobs.map(j => (
                                        <option key={j._id} value={j._id}>{j.company ? `${j.company} - ${j.title}` : j.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>Matching Company (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Master Card"
                                        className="input-field"
                                        value={workflowForm.companyName}
                                        onChange={e => setWorkflowForm({ ...workflowForm, companyName: e.target.value })}
                                    />
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>Sector Category (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. BFSI"
                                        className="input-field"
                                        value={workflowForm.category}
                                        onChange={e => setWorkflowForm({ ...workflowForm, category: e.target.value })}
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginTop: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={workflowForm.isDefault}
                                    onChange={e => setWorkflowForm({ ...workflowForm, isDefault: e.target.checked })}
                                />
                                Set as System Default Workflow
                            </label>

                            <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => { setShowWorkflowModal(false); setEditingWorkflowId(null); }} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={workflowSaving}>
                                    {workflowSaving ? (editingWorkflowId ? 'Saving...' : 'Creating...') : (editingWorkflowId ? 'Save Changes' : 'Create Workflow')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stage Configure Modal (Add/Edit Stage Details) */}
            {showStageModal && (
                <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="modal-card" style={{ background: 'white', borderRadius: '12px', width: '560px', maxWidth: '95%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                                {editingStageIndex !== null ? 'Configure Stage Details' : 'Add Stage to Workflow'}
                            </h3>
                            <button onClick={() => setShowStageModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <form onSubmit={handleStageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Stage Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Tech Panel Interview"
                                    className="input-field"
                                    required
                                    value={stageForm.name}
                                    onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
                                />
                            </div>

                            {/* Requirements Configuration */}
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Configure Requirements</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.requirements.requireResume}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                requirements: { ...stageForm.requirements, requireResume: e.target.checked }
                                            })}
                                        /> Require Uploaded Resume
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.requirements.requireFeedback}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                requirements: { ...stageForm.requirements, requireFeedback: e.target.checked }
                                            })}
                                        /> Require Interviewer Feedback
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.requirements.requireOfferLetter}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                requirements: { ...stageForm.requirements, requireOfferLetter: e.target.checked }
                                            })}
                                        /> Require Offer Letter Upload
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.requirements.requireSalarySlip}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                requirements: { ...stageForm.requirements, requireSalarySlip: e.target.checked }
                                            })}
                                        /> Require Salary Slip Upload
                                    </label>
                                </div>
                            </div>

                            {/* Visibility Actions Configuration */}
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Control Visibility & Action Buttons</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.actions.showRejectButton}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                actions: { ...stageForm.actions, showRejectButton: e.target.checked }
                                            })}
                                        /> Show Reject Stage Button
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.actions.showOfferButton}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                actions: { ...stageForm.actions, showOfferButton: e.target.checked }
                                            })}
                                        /> Show Offer Decisions (Accept/Reject by Candidate)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', gridColumn: 'span 2' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.actions.showOnboardingSettings}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                actions: { ...stageForm.actions, showOnboardingSettings: e.target.checked }
                                            })}
                                        /> Show Onboarding Settings (DOJ, Resignation file)
                                    </label>
                                </div>
                            </div>

                            {/* Automation Rules Configuration */}
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Workflow Automation Rules</h4>
                                
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', paddingBottom: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.automationRules.sendEmail}
                                            onChange={e => setStageForm({
                                                ...stageForm,
                                                automationRules: { ...stageForm.automationRules, sendEmail: e.target.checked }
                                            })}
                                        /> Auto-Email Candidate
                                    </label>
                                    
                                    {stageForm.automationRules.sendEmail && (
                                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Select Template</label>
                                            <select
                                                className="input-field"
                                                style={{ height: '34px', fontSize: '0.8rem', padding: '0 8px' }}
                                                value={stageForm.automationRules.emailTemplateId || ''}
                                                onChange={e => setStageForm({
                                                    ...stageForm,
                                                    automationRules: { ...stageForm.automationRules, emailTemplateId: e.target.value || null }
                                                })}
                                            >
                                                <option value="">Select Email Template</option>
                                                {templates.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>Update Candidate Recruitment Status</label>
                                    <select
                                        className="input-field"
                                        style={{ height: '34px', fontSize: '0.8rem', padding: '0 8px' }}
                                        value={stageForm.automationRules.updateCandidateStatus || ''}
                                        onChange={e => setStageForm({
                                            ...stageForm,
                                            automationRules: { ...stageForm.automationRules, updateCandidateStatus: e.target.value }
                                        })}
                                    >
                                        <option value="">Do not update status</option>
                                        {ATS_STATUSES.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowStageModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Stage</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldManagement;
