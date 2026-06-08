import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CheckIcon, XIcon, EditIcon, TrashIcon, PlusIcon, RefreshIcon, GripVerticalIcon } from '../icons';

interface Permission {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

interface Role {
    _id: string;
    name: string;
    description: string;
    isBuiltIn: boolean;
    reportsTo?: string;
    permissions: Record<string, Permission>;
    createdBy?: { name: string; email: string };
    createdAt?: string;
}

const MODULES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'candidates', label: 'Candidates' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'operations', label: 'Operations' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'callHistory', label: 'Call History' },
    { key: 'offers', label: 'Offers' },
    { key: 'users', label: 'Users' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Leaves' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'fileManager', label: 'File Manager' },
    { key: 'importExport', label: 'Import/Export' },
    { key: 'settings', label: 'Settings' },
    { key: 'birthdays', label: 'Birthdays' },
    { key: 'roles', label: 'Roles' }
];

const RolePermissions = () => {
    const { showToast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [wasValidated, setWasValidated] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'hierarchy'>('list');
    const [draggedRole, setDraggedRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        reportsTo: '',
        permissions: {} as Record<string, Permission>
    });

    const fetchRoles = async () => {
        try {
            const data = await api.getRoles();
            setRoles(data);
        } catch (error) {
            showToast('Failed to fetch roles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReparent = async (roleId: string, parentRoleName: string | null) => {
        try {
            await api.updateRole(roleId, {
                reportsTo: parentRoleName
            });
            showToast('Reporting relationship updated successfully', 'success');
            fetchRoles();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to update reporting structure', 'error');
        }
    };

    const handleInsertBetween = async (draggedRoleId: string, parentRoleName: string | null, childRoleId: string, draggedRoleName: string) => {
        try {
            await api.updateRole(draggedRoleId, {
                reportsTo: parentRoleName
            });
            await api.updateRole(childRoleId, {
                reportsTo: draggedRoleName
            });
            showToast('Role inserted and hierarchy rearranged successfully', 'success');
            fetchRoles();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to rearrange roles', 'error');
            fetchRoles();
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const builtInRoles = roles.filter(r => r.isBuiltIn && r.name !== 'Super Admin');
    const customRoles = roles.filter(r => !r.isBuiltIn);

    const initFormData = (role?: Role) => {
        const permissions: Record<string, Permission> = {};
        MODULES.forEach(m => {
            permissions[m.key] = role?.permissions[m.key] || { view: false, create: false, edit: false, delete: false };
        });
        setFormData({
            name: role?.name || '',
            description: role?.description || '',
            reportsTo: role?.reportsTo || '',
            permissions
        });
    };

    const handleOpenModal = (role?: Role) => {
        setEditingRole(role || null);
        initFormData(role);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRole(null);
    };

    const handlePermissionChange = (moduleKey: string, action: keyof Permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    ...prev.permissions[moduleKey],
                    [action]: !prev.permissions[moduleKey][action]
                }
            }
        }));
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
        try {
            if (editingRole) {
                await api.updateRole(editingRole._id, {
                    name: formData.name,
                    description: formData.description,
                    reportsTo: formData.reportsTo || null,
                    permissions: formData.permissions
                });
                showToast('Role updated successfully', 'success');
            } else {
                await api.createRole({
                    name: formData.name,
                    description: formData.description,
                    reportsTo: formData.reportsTo || null,
                    permissions: formData.permissions
                });
                showToast('Role created successfully', 'success');
            }
            handleCloseModal();
            fetchRoles();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to save role', 'error');
        }
    };

    const handleDelete = async (roleId: string, roleName: string) => {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;
        try {
            await api.deleteRole(roleId);
            showToast('Role deleted successfully', 'success');
            fetchRoles();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete role', 'error');
        }
    };

    const handleReset = async (roleId: string, roleName: string) => {
        if (!confirm(`Reset "${roleName}" to default permissions?`)) return;
        try {
            await api.resetRole(roleId);
            showToast('Role reset to default permissions', 'success');
            fetchRoles();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to reset role', 'error');
        }
    };

    const getEnabledModules = (permissions: Record<string, Permission>) => {
        return MODULES.filter(m => permissions[m.key]?.view).map(m => m.label);
    };



    if (loading) {
        return (
            <div className="loading-container">
                <div className="text-gradient loading-text-large">Loading...</div>
            </div>
        );
    }

    return (
        <div className="fade-in roles-page custom-scrollbar">
            <div className="roles-header">
                <h1 className="roles-title text-gradient">Role Permissions</h1>
                <p className="roles-subtitle">Manage default roles and create custom roles with granular permissions.</p>
            </div>

            <div className="candidate-list-tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`candidate-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600' }}
                >
                    Roles & Permissions
                </button>
                <button
                    onClick={() => setActiveTab('hierarchy')}
                    className={`candidate-tab-btn ${activeTab === 'hierarchy' ? 'active' : ''}`}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600' }}
                >
                    Organization Flow (Drag & Drop)
                </button>
            </div>

            {activeTab === 'list' ? (
                <div className="roles-grid">
                <div className="widget-card">
                    <div className="roles-section-header">
                        <div>
                            <h2 className="roles-section-title">Default Roles</h2>
                            <p className="roles-section-subtitle">
                                {builtInRoles.length} default role{builtInRoles.length !== 1 ? 's' : ''} (Super Admin hidden)
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <PlusIcon size={16} /> Create Custom Role
                        </button>
                    </div>

                    {builtInRoles.length === 0 ? (
                        <div className="empty-state-container">
                            <p>Loading default roles...</p>
                        </div>
                    ) : (
                        <div className="roles-cards-grid">
                            {builtInRoles.map(role => (
                                <div key={role._id} className="role-card">
                                    <div className="role-card-header">
                                        <div>
                                            <div className="role-card-name-row">
                                                <h3 className="role-card-name">{role.name}</h3>
                                                <span className="role-badge role-badge--default">Default</span>
                                            </div>
                                            <p className="role-card-description">
                                                {role.description || 'No description'}
                                            </p>
                                        </div>
                                        <div className="role-card-actions">
                                            <button 
                                                onClick={() => handleOpenModal(role)}
                                                className="role-action-btn role-action-btn--primary"
                                                title="Edit Permissions"
                                            >
                                                <EditIcon size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleReset(role._id, role.name)}
                                                className="role-action-btn role-action-btn--secondary"
                                                title="Reset to Default"
                                            >
                                                <RefreshIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="role-card-modules">
                                        {getEnabledModules(role.permissions).length > 0 ? (
                                            getEnabledModules(role.permissions).map(label => (
                                                <span key={label} className="role-module-badge">
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="role-footer-text">No module access</span>
                                        )}
                                    </div>
                                    <div className="role-card-footer">
                                        <CheckIcon size={12} color="var(--secondary)" />
                                        <span className="role-footer-text">Can View Dashboard</span>
                                        {role.permissions.candidates?.create && (
                                            <>
                                                <CheckIcon size={12} color="var(--secondary)" />
                                                <span className="role-footer-text">Create Candidates</span>
                                            </>
                                        )}
                                        {role.permissions.users?.view && (
                                            <>
                                                <CheckIcon size={12} color="var(--secondary)" />
                                                <span className="role-footer-text">Manage Users</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="widget-card">
                    <div className="roles-section-header">
                        <div>
                            <h2 className="roles-section-title">Custom Roles</h2>
                            <p className="roles-section-subtitle">
                                {customRoles.length} custom role{customRoles.length !== 1 ? 's' : ''} created
                            </p>
                        </div>
                    </div>

                    {customRoles.length === 0 ? (
                        <div className="empty-state-container">
                            <p>No custom roles created yet.</p>
                            <p>Click "Create Custom Role" at the top to get started.</p>
                        </div>
                    ) : (
                        <div className="roles-cards-grid">
                            {customRoles.map(role => (
                                <div key={role._id} className="role-card role-card--custom">
                                    <div className="role-card-header">
                                        <div>
                                            <div className="role-card-name-row">
                                                <h3 className="role-card-name">{role.name}</h3>
                                                <span className="role-badge role-badge--custom">Custom</span>
                                            </div>
                                            <p className="role-card-description">
                                                {role.description || 'No description'}
                                            </p>
                                        </div>
                                        <div className="role-card-actions">
                                            <button 
                                                onClick={() => handleOpenModal(role)}
                                                className="role-action-btn role-action-btn--primary"
                                                title="Edit"
                                            >
                                                <EditIcon size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(role._id, role.name)}
                                                className="role-action-btn role-action-btn--danger"
                                                title="Delete"
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="role-card-modules">
                                        {getEnabledModules(role.permissions).length > 0 ? (
                                            getEnabledModules(role.permissions).map(label => (
                                                <span key={label} className="role-module-badge role-module-badge--custom">
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="role-footer-text">No module access</span>
                                        )}
                                    </div>
                                    <p className="role-footer-text">
                                        Created {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'N/A'}
                                        {role.createdBy && ` by ${role.createdBy.name}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="widget-card permission-legend-card">
                    <h3 className="permission-legend-title">Permission Legend</h3>
                    <div className="legend-items">
                        <div className="legend-item">
                            <CheckIcon size={16} color="var(--secondary)" />
                            <span>View - Can see module</span>
                        </div>
                        <div className="legend-item">
                            <CheckIcon size={16} color="var(--secondary)" />
                            <span>Create - Can add new records</span>
                        </div>
                        <div className="legend-item">
                            <CheckIcon size={16} color="var(--secondary)" />
                            <span>Edit - Can modify records</span>
                        </div>
                        <div className="legend-item">
                            <CheckIcon size={16} color="var(--secondary)" />
                            <span>Delete - Can remove records</span>
                        </div>
                    </div>
                    </div>
                </div>
                ) : (
                    <div className={`role-tree-container fade-in ${draggedRole ? 'dragging-active' : ''}`}>
                        <div className="root-drop-zone-wrapper">
                            <RootDropZone 
                                onReparent={handleReparent}
                                draggedRole={draggedRole}
                                visibleRoles={roles}
                            />
                        </div>
                        
                        <div className="role-tree-nodes">
                            {getRoots(roles).length === 0 ? (
                                <div className="empty-state-container">
                                    <p>No hierarchy roots defined.</p>
                                    <p>Configure a role's parent or drag a role out to set up reporting lines.</p>
                                </div>
                            ) : (
                                getRoots(roles).map(root => (
                                    <RoleTreeNode 
                                        key={root._id}
                                        role={root}
                                        visibleRoles={roles}
                                        draggedRole={draggedRole}
                                        setDraggedRole={setDraggedRole}
                                        onReparent={handleReparent}
                                        onInsert={handleInsertBetween}
                                        showToast={showToast}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

            {showModal && (
                <div className="permissions-modal-overlay" onClick={handleCloseModal}>
                    <div className="permissions-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="permissions-modal-header">
                            <h2 className="permissions-modal-title">
                                {editingRole ? `Edit ${editingRole.isBuiltIn ? 'Default' : 'Custom'} Role` : 'Create Custom Role'}
                            </h2>
                            <button onClick={handleCloseModal} className="permissions-modal-close">
                                <XIcon size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
                            <div className="permissions-form-grid">
                                <div className="input-group">
                                    <label>Role Name</label>
                                    <input
                                        type="text"
                                        className={`input-field ${editingRole?.isBuiltIn ? 'disabled-input' : ''}`}
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Sales Executive"
                                        required
                                        disabled={editingRole?.isBuiltIn}
                                    />
                                    {editingRole?.isBuiltIn && (
                                        <small className="help-text-small">Built-in role names cannot be changed</small>
                                    )}
                                </div>
                                <div className="input-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this role"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Reports To (Parent Role)</label>
                                    <select
                                        className="input-field"
                                        value={formData.reportsTo}
                                        onChange={e => setFormData(prev => ({ ...prev, reportsTo: e.target.value }))}
                                    >
                                        <option value="">None / Reports to Admin</option>
                                        {roles
                                            .filter(r => r.name !== formData.name) // Prevent reporting to itself
                                            .map(r => (
                                                <option key={r._id} value={r.name}>{r.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                             <div className="permissions-table-section">
                                <h3 className="section-title-small">Module Permissions</h3>
                                <div className="permissions-table-wrapper">
                                    <table className="permissions-table">
                                        <thead>
                                            <tr>
                                                <th>Module</th>
                                                <th>View</th>
                                                <th>Create</th>
                                                <th>Edit</th>
                                                <th>Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MODULES.map(module => (
                                                <tr key={module.key}>
                                                    <td>{module.label}</td>
                                                    {(['view', 'create', 'edit', 'delete'] as const).map(action => (
                                                        <td key={action}>
                                                            <label className="permissions-checkbox-label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.permissions[module.key]?.[action] || false}
                                                                    onChange={() => handlePermissionChange(module.key, action)}
                                                                    className="permissions-checkbox"
                                                                />
                                                            </label>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="permissions-modal-footer">
                                <button type="button" className="btn btn-secondary btn-cancel-glass" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Role Hierarchy Tree Utilities and Sub-components ---

const wouldCreateCycle = (roleName: string, targetParentName: string | null, allRoles: Role[]): boolean => {
    if (!targetParentName) return false;
    if (roleName === targetParentName) return true;
    
    let currentParentName: string | null = targetParentName;
    const maxDepth = 100;
    let depth = 0;
    
    while (currentParentName && depth < maxDepth) {
        const parentRole = allRoles.find(r => r.name === currentParentName);
        if (!parentRole) break;
        
        if (parentRole.reportsTo === roleName) {
            return true;
        }
        currentParentName = parentRole.reportsTo || null;
        depth++;
    }
    
    return false;
};

const getRoots = (rolesList: Role[]) => {
    const visibleRoles = rolesList.filter(r => r.name !== 'Super Admin');
    return visibleRoles.filter(r => {
        return !r.reportsTo || !visibleRoles.some(other => other.name === r.reportsTo);
    });
};

const RootDropZone = ({ onReparent, draggedRole }: { onReparent: any; draggedRole: Role | null; visibleRoles: Role[] }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedRole && draggedRole.reportsTo) {
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (draggedRole && draggedRole.reportsTo) {
            onReparent(draggedRole._id, null);
        }
    };

    const active = !!(draggedRole && draggedRole.reportsTo);

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`root-drop-zone ${isDragOver ? 'drag-over' : ''} ${active ? 'active' : 'inactive'}`}
        >
            Drop here to set "{draggedRole?.name}" as Top-Level Role (Reports to None)
        </div>
    );
};

const InsertDropZone = ({
    parentRole,
    childRole,
    draggedRole,
    onInsert,
    visibleRoles
}: {
    parentRole: Role;
    childRole: Role;
    draggedRole: Role | null;
    onInsert: (draggedRoleId: string, parentRoleName: string | null, childRoleId: string, draggedRoleName: string) => void;
    visibleRoles: Role[];
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const isVisible = !!(
        draggedRole &&
        draggedRole._id !== childRole._id &&
        draggedRole.name !== parentRole.name &&
        !wouldCreateCycle(draggedRole.name, parentRole.name, visibleRoles)
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isVisible) {
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isVisible && draggedRole) {
            onInsert(draggedRole._id, parentRole.name, childRole._id, draggedRole.name);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`insert-drop-zone ${isDragOver ? 'drag-over' : ''} ${isVisible ? 'active' : 'inactive'}`}
        >
            <div className="insert-line"></div>
        </div>
    );
};

const RoleTreeNode = ({ 
    role, 
    visibleRoles, 
    draggedRole, 
    setDraggedRole, 
    onReparent,
    onInsert,
    showToast
}: { 
    role: Role; 
    visibleRoles: Role[]; 
    draggedRole: Role | null; 
    setDraggedRole: (r: Role | null) => void;
    onReparent: (id: string, parentName: string | null) => void;
    onInsert: (draggedRoleId: string, parentRoleName: string | null, childRoleId: string, draggedRoleName: string) => void;
    showToast: any;
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const visibleSubRoles = visibleRoles.filter(r => r.name !== 'Super Admin');
    const children = visibleSubRoles.filter(r => r.reportsTo === role.name);

    const handleDragStart = (e: React.DragEvent) => {
        setDraggedRole(role);
        e.dataTransfer.setData('text/plain', role._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedRole(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedRole && draggedRole._id !== role._id) {
            if (!wouldCreateCycle(draggedRole.name, role.name, visibleRoles)) {
                setIsDragOver(true);
                e.dataTransfer.dropEffect = 'move';
            }
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (draggedRole && draggedRole._id !== role._id) {
            if (wouldCreateCycle(draggedRole.name, role.name, visibleRoles)) {
                showToast('Loop detected! A parent role cannot report to its own child role.', 'error');
                return;
            }
            onReparent(draggedRole._id, role.name);
        }
    };

    return (
        <div className="role-tree-node-wrapper animate-fade-in">
            <div 
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`role-tree-node ${isDragOver ? 'drag-over' : ''} ${role.isBuiltIn ? 'builtin-node' : 'custom-node'} ${draggedRole?._id === role._id ? 'dragging' : ''}`}
            >
                <div className="node-drag-handle">
                    <GripVerticalIcon size={14} />
                </div>
                <div className="node-content">
                    <div className="node-header-row">
                        <span className="node-name">{role.name}</span>
                        <span className={`node-badge-sm ${role.isBuiltIn ? 'builtin' : 'custom'}`}>
                            {role.isBuiltIn ? 'System' : 'Custom'}
                        </span>
                    </div>
                    <p className="node-desc">{role.description || 'No description'}</p>
                </div>
                {role.reportsTo && (
                    <button 
                        className="node-detach-btn"
                        title="Remove parent relation (Reports to None)"
                        onClick={() => onReparent(role._id, null)}
                    >
                        ✕
                    </button>
                )}
            </div>
            
            {children.length > 0 && (
                <div className="node-children-container">
                    <div className="hierarchy-connector-line"></div>
                    {children.map(child => (
                        <React.Fragment key={child._id}>
                            <InsertDropZone
                                parentRole={role}
                                childRole={child}
                                draggedRole={draggedRole}
                                onInsert={onInsert}
                                visibleRoles={visibleRoles}
                            />
                            <RoleTreeNode 
                                role={child}
                                visibleRoles={visibleRoles}
                                draggedRole={draggedRole}
                                setDraggedRole={setDraggedRole}
                                onReparent={onReparent}
                                onInsert={onInsert}
                                showToast={showToast}
                            />
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RolePermissions;
