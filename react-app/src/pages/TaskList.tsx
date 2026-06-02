import React, { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
    PlusIcon, SearchIcon, ClockIcon,
    CheckCircleIcon, AlertCircleIcon,
    TrashIcon, EditIcon, ListIcon, GridIcon,
    MessageIcon, EyeIcon, GripVerticalIcon, ChevronDownIcon
} from '../icons';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import CandidateDetailModal from '../components/CandidateDetailModal';

interface Task {
    _id: string;
    title: string;
    description: string;
    assignedTo: { _id: string, name: string };
    candidate?: { _id: string, name: string };
    job?: { _id: string, title: string };
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Todo' | 'In Progress' | 'Completed' | 'Cancelled';
    reminderTime?: string;
    subtasks: { title: string, isCompleted: boolean }[];
    dependencies: { _id: string, title: string, status: string }[];
    createdBy: { _id: string, name: string };
    createdAt: string;
}

const TASK_COLUMNS = [
    { key: 'title', label: 'Task' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' }
];

const TaskList = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchColumn, setSearchColumn] = useState('');
    const [statusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [users, setUsers] = useState<any[]>([]);

    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
        reminderTime: '',
        subtasks: [] as { title: string, isCompleted: boolean }[],
        dependencies: [] as string[]
    });
    const [newSubtask, setNewSubtask] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    
    // Delete Confirmation State
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [viewingCandidate, setViewingCandidate] = useState<{ candidate: any, history: any[] } | null>(null);
    const [fetchingCandidate, setFetchingCandidate] = useState(false);

    const { showToast } = useToast();
    const { user } = useAuth();

    const handleViewCandidate = async (candidateId: string | any) => {
        const id = typeof candidateId === 'string' ? candidateId : candidateId?._id;
        if (!id) return;
        setFetchingCandidate(true);
        try {
            // Fetch both candidate and their interview history
            const [fullCandidate, interviewHistory] = await Promise.all([
                api.getCandidateById(id),
                api.getInterviews({ candidateId: id }).catch(() => []) 
            ]);
            setViewingCandidate({ candidate: fullCandidate, history: interviewHistory });
        } catch (error) {
            console.error('Failed to fetch candidate details', error);
            showToast('Failed to fetch candidate details', 'error');
        } finally {
            setFetchingCandidate(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, [statusFilter]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await api.getTasks(statusFilter ? { status: statusFilter } : {});
            setTasks(data);
        } catch (error) {
            showToast('Failed to fetch tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) { }
    };

    const handleOpenModal = (task: Task | null = null) => {
        if (task) {
            setEditingTask(task);
            setFormData({
                title: task.title,
                description: task.description || '',
                assignedTo: task.assignedTo._id,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                reminderTime: task.reminderTime ? task.reminderTime.slice(0, 16) : '',
                subtasks: task.subtasks || [],
                dependencies: task.dependencies?.map(d => d._id) || []
            });
            fetchComments(task._id);
        } else {
            setComments([]);
            setEditingTask(null);
            setFormData({
                title: '',
                description: '',
                assignedTo: user?._id || '',
                priority: 'Medium',
                status: 'Todo',
                dueDate: new Date().toISOString().split('T')[0],
                reminderTime: '',
                subtasks: [],
                dependencies: []
            });
        }
        setIsModalOpen(true);
    };

    const fetchComments = async (taskId: string) => {
        try {
            const data = await api.getTaskComments(taskId);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !editingTask) return;
        setIsSubmittingComment(true);
        try {
            await api.addTaskComment(editingTask._id, newComment);
            setNewComment('');
            fetchComments(editingTask._id);
            showToast('Comment added', 'success');
        } catch (error) {
            showToast('Failed to add comment', 'error');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await api.updateTask(editingTask._id, formData);
                showToast('Task updated successfully', 'success');
            } else {
                await api.createTask(formData);
                showToast('Task created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchTasks();
        } catch (error: any) {
            showToast(error.message || 'Operation failed', 'error');
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await api.updateTask(taskId, { status: newStatus });
            showToast('Status updated successfully', 'success');
            fetchTasks(); // Refresh to ensure UI stays in sync
        } catch (error: any) {
            showToast(error.message || 'Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingTaskId(id);
    };

    const confirmDelete = async () => {
        if (!deletingTaskId) return;
        try {
            await api.deleteTask(deletingTaskId);
            showToast('Task deleted successfully', 'success');
            fetchTasks();
            setDeletingTaskId(null);
        } catch (error) {
            showToast('Failed to delete task', 'error');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Todo': return '#64748b';
            case 'In Progress': return '#0284c7';
            case 'Completed': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return 'var(--border)';
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        setFormData({
            ...formData,
            subtasks: [...formData.subtasks, { title: newSubtask.trim(), isCompleted: false }]
        });
        setNewSubtask('');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Todo': return <ClockIcon size={18} color="#64748b" />;
            case 'In Progress': return <AlertCircleIcon size={18} color="#0284c7" />;
            case 'Completed': return <CheckCircleIcon size={18} color="#10b981" />;
            case 'Cancelled': return <TrashIcon size={18} color="#ef4444" />;
            default: return null;
        }
    };

    const filteredTasks = tasks.filter(t => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;

        if (searchColumn) {
            let val = '';
            if (searchColumn === 'assignedTo') val = t.assignedTo?.name || '';
            else if (searchColumn === 'role') val = (t.assignedTo as any)?.role || '';
            else val = String((t as any)[searchColumn] || '');
            return val.toLowerCase().includes(query);
        }

        return (
            t.title.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.assignedTo?.name.toLowerCase().includes(query) ||
            (t.assignedTo as any)?.role?.toLowerCase().includes(query) ||
            t.status.toLowerCase().includes(query) ||
            t.priority.toLowerCase().includes(query)
        );
    });

    const kanbanColumns = [
        { id: 'Todo', title: 'To Do', color: '#64748b' },
        { id: 'In Progress', title: 'In Progress', color: '#0284c7' },
        { id: 'Completed', title: 'Completed', color: '#10b981' },
        { id: 'Cancelled', title: 'Cancelled', color: '#ef4444' }
    ];

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        try {
            await api.updateTask(taskId, { status: newStatus });
            showToast(`Task moved to ${newStatus}`, 'success');
            fetchTasks();
        } catch (error) {
            showToast('Failed to move task', 'error');
        }
    };

    const TaskCard = ({ task }: { task: Task }) => (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, task._id)}
            className="glass-card modern-card task-card"
            style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                borderLeft: `4px solid ${getStatusColor(task.status)}`,
                animation: 'fadeIn 0.3s ease-out',
                cursor: 'grab',
                background: 'var(--bg-card)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: `${getPriorityColor(task.priority)}15`,
                    color: getPriorityColor(task.priority),
                    textTransform: 'uppercase'
                }}>
                    {task.priority}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {task.candidate && (
                        <button onClick={(e) => { e.stopPropagation(); handleViewCandidate(task.candidate); }} disabled={fetchingCandidate} className="icon-btn-sm" style={{ padding: '4px', color: '#10b981' }} title="View Candidate Details">
                            <EyeIcon size={14} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(task); }} className="icon-btn-sm" style={{ padding: '4px' }} title="Edit"><EditIcon size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task._id); }} className="icon-btn-sm" style={{ color: '#ef4444', padding: '4px' }} title="Delete"><TrashIcon size={14} /></button>
                </div>
            </div>

            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1.4' }}>{task.title}</h4>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {task.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: new Date(task.dueDate) < new Date() && task.status !== 'Completed' ? '#ef4444' : 'var(--text-muted)' }}>
                        <ClockIcon size={12} color="inherit" />
                        <span style={{ fontWeight: 500 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: 'white',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            {task.assignedTo?.name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>{task.assignedTo?.name || 'Unassigned'}</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Assigned to</span>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1 }}>Created by</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-main)' }}>{task.createdBy?.name || 'Admin'}</div>
                    </div>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <div style={{ height: '4px', flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: '2px', marginRight: '8px', overflow: 'hidden' }}>
                            <div style={{ 
                                height: '100%', 
                                background: 'var(--primary)', 
                                width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        Tasks & Activities
                        <span className="total-badge">
                            {filteredTasks.length} Total
                        </span>
                    </h3>
                    <p>Track and manage recruiter activities and follow-ups.</p>
                </div>
                <div className="header-actions">
                    <div className="segmented-control">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`control-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                            title="Kanban View"
                        >
                            <GridIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`control-btn ${viewMode === 'list' ? 'active' : ''}`}
                            title="List View"
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>

                    <div className="payroll-filters" style={{ margin: 0 }}>
                        <select
                            value={searchColumn}
                            onChange={(e) => setSearchColumn(e.target.value)}
                            className="input-field payroll-filter-select"
                        >
                            <option value="">All Columns</option>
                            {TASK_COLUMNS.map(col => (
                                <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setFormData({
                                title: '',
                                description: '',
                                assignedTo: '',
                                priority: 'Medium',
                                status: 'Todo',
                                dueDate: '',
                                reminderTime: '',
                                subtasks: [],
                                dependencies: []
                            });
                            setEditingTask(null);
                            setIsModalOpen(true);
                        }}
                    >
                        <PlusIcon size={18} className="mr-8" /> Add Task
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading tasks...</div>
            ) : viewMode === 'kanban' ? (
                <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem', minHeight: '600px', alignItems: 'flex-start' }}>
                    {kanbanColumns.map(column => (
                        <div
                            key={column.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                            style={{
                                flex: 1,
                                minWidth: '280px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '0.75rem',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                border: '1px solid var(--border)',
                                minHeight: '500px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }}></div>
                                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{column.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        {filteredTasks.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredTasks
                                    .filter(t => t.status === column.id)
                                    .map(task => <TaskCard key={task._id} task={task} />)
                                }
                                {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        No tasks here
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                {TASK_COLUMNS.map(col => (
                                    <th key={col.key}>
                                        <div className="modern-th-content">
                                            <div className="modern-th-label">
                                                <GripVerticalIcon size={12} className="grip-icon" />
                                                {col.label.toUpperCase()}
                                            </div>
                                            <div className="th-actions-right">
                                                <button className="header-menu-trigger">
                                                    <ChevronDownIcon size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                                    <th className="sticky-last">
                                        <div className="modern-th-content">
                                            <div className="modern-th-label">ACTIONS</div>
                                        </div>
                                    </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No tasks found
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr key={task._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {getStatusIcon(task.status)}
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{task.title}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="employee-cell">
                                                <div className="employee-avatar">
                                                    {task.assignedTo?.name?.charAt(0)}
                                                </div>
                                                <div className="employee-info">
                                                    <div className="employee-name">{task.assignedTo?.name}</div>
                                                    <div className="employee-subtext">{(task.assignedTo as any).role || 'Team Member'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {task.dueDate ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                    <ClockIcon size={14} color="var(--primary)" />
                                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                         <td>
                                             <div className={`status-badge ${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success'}`}>
                                                 {task.priority.toUpperCase()}
                                             </div>
                                         </td>
                                         <td>
                                             <select
                                                 value={task.status}
                                                 onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                 className="status-select"
                                             >
                                                 <option value="Todo">Todo</option>
                                                 <option value="In Progress">In Progress</option>
                                                 <option value="Completed">Completed</option>
                                                 <option value="Cancelled">Cancelled</option>
                                             </select>
                                         </td>
                                         <td className="sticky-last">
                                            <div className="flex-row-gap-center">
                                                {task.candidate && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleViewCandidate(task.candidate); }}
                                                        disabled={fetchingCandidate}
                                                        className="action-btn"
                                                        style={{ color: 'var(--success)' }}
                                                        title="View Candidate"
                                                    >
                                                        <EyeIcon size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setEditingTask(task);
                                                        setFormData({
                                                            title: task.title,
                                                            description: task.description,
                                                            assignedTo: (task.assignedTo as any)._id,
                                                            priority: task.priority,
                                                            status: task.status,
                                                            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                                                            reminderTime: task.reminderTime ? new Date(task.reminderTime).toISOString().slice(0, 16) : '',
                                                            subtasks: task.subtasks || [],
                                                            dependencies: task.dependencies?.map(d => d._id) || []
                                                        });
                                                        setIsModalOpen(true);
                                                        fetchComments(task._id);
                                                    }}
                                                    className="action-btn action-btn--edit"
                                                    title="Edit Task"
                                                >
                                                    <EditIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task._id)}
                                                    className="action-btn action-btn--delete"
                                                    title="Delete Task"
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? 'Edit Task' : 'Create New Task'}
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit} style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                            {editingTask ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="input-group">
                        <label className="input-label">Task Title</label>
                        <input
                            type="text"
                            className="input-field"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label className="input-label">Assigned To</label>
                            <select
                                className="input-field"
                                required
                                value={formData.assignedTo}
                                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                            >
                                <option value="">Select User</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Due Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Priority</label>
                            <select
                                className="input-field"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                style={{ borderRadius: '0.5rem' }}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                className="input-field"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                style={{ borderRadius: '0.5rem' }}
                            >
                                <option value="Todo">Todo</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ClockIcon size={14} /> Reminder Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            style={{ borderRadius: '0.5rem' }}
                            value={formData.reminderTime}
                            onChange={e => setFormData({ ...formData, reminderTime: e.target.value })}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            System will trigger a notification at this specific time.
                        </p>
                    </div>

                    {/* Subtasks Section */}
                    <div className="input-group">
                        <label className="input-label">Subtasks ({formData.subtasks.length})</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Add a subtask..."
                                value={newSubtask}
                                onChange={e => setNewSubtask(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                            />
                            <button type="button" className="btn btn-secondary" onClick={handleAddSubtask} style={{ width: 'auto' }}>Add</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {formData.subtasks.map((st, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
                                    <input
                                        type="checkbox"
                                        checked={st.isCompleted}
                                        onChange={() => {
                                            const newSt = [...formData.subtasks];
                                            newSt[idx].isCompleted = !newSt[idx].isCompleted;
                                            setFormData({ ...formData, subtasks: newSt });
                                        }}
                                    />
                                    <span style={{ flex: 1, fontSize: '0.875rem', textDecoration: st.isCompleted ? 'line-through' : 'none', color: st.isCompleted ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                        {st.title}
                                    </span>
                                    <button type="button" onClick={() => {
                                        setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== idx) });
                                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments Section */}
                    {editingTask && (
                        <div className="input-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageIcon size={16} /> Discussions ({comments.length})
                            </label>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', padding: '0.5rem' }}>
                                {comments.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem' }}>No comments yet. Be the first to start the discussion!</div>
                                ) : (
                                    comments.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                                                {c.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '0 12px 12px 12px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{c.user?.name || 'User'}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{c.content}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Write a comment... use @ to mention"
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                                    style={{ borderRadius: '2rem', padding: '0.6rem 1.25rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddComment}
                                    disabled={isSubmittingComment || !newComment.trim()}
                                    style={{ width: 'auto', borderRadius: '2rem', padding: '0 1.25rem' }}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            <DeleteConfirmationModal
                isOpen={!!deletingTaskId}
                onClose={() => setDeletingTaskId(null)}
                onConfirm={confirmDelete}
                itemName={tasks.find(t => t._id === deletingTaskId)?.title || 'this task'}
                itemType="task"
            />

            <CandidateDetailModal
                isOpen={!!viewingCandidate}
                onClose={() => setViewingCandidate(null)}
                candidate={viewingCandidate?.candidate}
                interviewHistory={viewingCandidate?.history || []}
                baseUrl={BASE_URL}
            />
        </div>
    );
};

export default TaskList;
