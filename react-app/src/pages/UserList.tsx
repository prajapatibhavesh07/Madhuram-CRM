import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, BASE_URL } from '../services/api';
import UserViewModal from '../components/UserViewModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';
import { createPortal } from 'react-dom';
import { GridIcon, ListIcon, EyeIcon, EditIcon, TrashIcon, GripVerticalIcon, ChevronDownIcon, MoreVerticalIcon, SearchIcon, PlusIcon, XCircleIcon, CheckCircleIcon, MailIcon, BriefcaseIcon, UserIcon } from '../icons';
import Pagination from '../components/Pagination';

const HighlightText = ({ text, highlight }: { text: string | number, highlight: string }) => {
    const stringText = text?.toString() || '';
    if (!highlight.trim()) return <>{stringText}</>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = stringText.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="search-highlight">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

interface UserData {
    _id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    lastLogin: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    isOnline?: boolean;
    managerId?: { name: string };
    teamLeadId?: { name: string };
    profilePhoto?: string;
    dob?: string;
}

const UserList = () => {
    const { user: currentUser, activeRole } = useAuth();
    const canDelete = currentUser?.role === 'Super Admin' || activeRole?.permissions?.users?.delete === true;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [viewUser, setViewUser] = useState<UserData | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [activeTab, setActiveTab] = useState<'employees' | 'users'>('employees');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [rowMenu, setRowMenu] = useState<{ user: any; x: number; y: number; type: 'click' | 'context' } | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const itemsPerPage = 10;

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Never';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const handleStatusToggle = async (user: UserData) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.updateUser(user._id, { status: newStatus });
            setUsers(prevUsers => prevUsers.map(u =>
                u._id === user._id ? { ...u, status: newStatus as 'Active' | 'Inactive' } : u
            ));
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedUserIds([]);
    }, [searchQuery, activeTab]);

    const handleAction = (action: 'view' | 'edit' | 'delete', user: UserData) => {
        setActiveMenu(null);
        switch (action) {
            case 'view':
                setViewUser(user);
                break;
            case 'edit':
                navigate(`/users/edit/${user._id}`);
                break;
            case 'delete':
                setDeleteUser(user);
                break;
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteUser && selectedUserIds.length === 0) return;
        
        try {
            if (deleteUser) {
                await api.deleteUser(deleteUser._id);
                showToast('User deleted successfully', 'success');
            } else if (selectedUserIds.length > 0) {
                await api.bulkDeleteUsers(selectedUserIds);
                showToast(`${selectedUserIds.length} users deleted successfully`, 'success');
                setSelectedUserIds([]);
            }
            fetchUsers();
            setDeleteUser(null);
            setIsBulkDeleting(false);
        } catch (error) {
            showToast('Error deleting: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(paginatedUsers.map(u => u._id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectUser = (id: string) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = (
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.role?.toLowerCase().includes(query) ||
            u.department?.toLowerCase().includes(query) ||
            u.designation?.toLowerCase().includes(query) ||
            u.status?.toLowerCase().includes(query) ||
            u.employeeId?.toLowerCase().includes(query)
        );

        if (activeTab === 'employees') {
            return matchesQuery && u.role !== 'Normal User' && u.role !== 'Super Admin';
        } else {
            return matchesQuery && u.role === 'Normal User';
        }
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getRoleBadgeClass = (role: string) => {
        const classes: Record<string, string> = {
            'Super Admin': 'role-super-admin',
            'Admin': 'role-admin',
            'HR': 'role-hr',
            'Manager': 'role-manager',
            'Team Lead': 'role-team-lead',
            'Recruiter': 'role-recruiter',
            'Normal User': 'role-normal-user'
        };
        return `role-badge ${classes[role] || 'role-custom'}`;
    };

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-tabs">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`candidate-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
                >
                    Company Employees
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`candidate-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                >
                    Normal Users
                </button>
            </div>

            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        User Management
                        <span className="total-badge">
                            {filteredUsers.length} Total
                        </span>
                    </h3>
                    <p>Manage users and track recruitment progress.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon-pos">
                            <SearchIcon size={16} />
                        </div>
                    </div>

                    <div className="segmented-control">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`control-btn ${viewMode === 'list' ? 'active' : ''}`}
                            title="List View"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`control-btn ${viewMode === 'card' ? 'active' : ''}`}
                            title="Grid View"
                        >
                            <GridIcon size={18} />
                        </button>
                    </div>

                    {selectedUserIds.length > 0 && canDelete && (
                        <button
                            onClick={() => setIsBulkDeleting(true)}
                            className="btn btn-danger"
                            title={`Delete Selected (${selectedUserIds.length})`}
                        >
                            <TrashIcon size={18} className="mr-8" /> Delete ({selectedUserIds.length})
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/users/register')}
                        className="btn btn-primary"
                    >
                        <PlusIcon size={18} className="mr-8" /> Add User
                    </button>
                </div>
            </div>
            {viewMode === 'list' ? (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th className="checkbox-cell">
                                    <div className="gear-btn-wrapper">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAll}
                                            checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                                            className="pointer-cursor"
                                        />
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            EMPLOYEE NAME
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            EMPLOYEE ID
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            DEPARTMENT
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            ROLE
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            STATUS
                                        </div>
                                        <div className="th-actions-right">
                                            <button className="header-menu-trigger">
                                                <ChevronDownIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            ACTIONS
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((u) => (
                                <tr
                                    key={u._id || u.username}
                                    onDoubleClick={() => handleAction('edit', u)}
                                    className={`modern-table-row pointer-cursor ${selectedUserIds.includes(u._id) ? 'row-selected' : ''}`}
                                    onClick={() => handleSelectUser(u._id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setRowMenu({ user: u, x: e.clientX, y: e.clientY, type: 'context' });
                                    }}
                                >
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedUserIds.includes(u._id)}
                                            onChange={() => handleSelectUser(u._id)}
                                            className="pointer-cursor"
                                        />
                                    </td>
                                    <td>
                                        <div className="user-profile-cell">
                                            <div className={`user-avatar-premium ${!u.profilePhoto ? 'no-photo' : ''}`}>
                                                {u.profilePhoto ? (
                                                    <img src={`${BASE_URL}${u.profilePhoto}`} alt={u.name} />
                                                ) : (
                                                    <span>{u.name.charAt(0).toUpperCase()}</span>
                                                )}
                                                <div className={`online-status-dot ${u.isOnline ? 'online' : 'offline'}`}></div>
                                            </div>
                                            <div className="user-details-premium">
                                                <span className="user-name-text">
                                                    <HighlightText text={u.name} highlight={searchQuery} />
                                                </span>
                                                <span className="user-role-text">
                                                    <HighlightText text={u.designation || u.role} highlight={searchQuery} />
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="employee-id-text">
                                            <HighlightText text={u.employeeId || 'D00000'} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="department-text">
                                            <HighlightText text={u.department || 'General'} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td>
                                        <span className={getRoleBadgeClass(u.role)}>
                                            <HighlightText text={u.role === 'Super Admin' ? 'Admin' : u.role} highlight={searchQuery} />
                                        </span>
                                    </td>
                                    <td>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusToggle(u);
                                            }}
                                            className={`status-badge ${u.status === 'Active' ? 'success' : 'warning'}`}
                                        >
                                            <div className="status-indicator"></div>
                                            <HighlightText text={u.status} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td className="sticky-last">
                                        <div className="flex-row-gap-center">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setRowMenu({ user: u, x: rect.right, y: rect.bottom, type: 'click' });
                                                }}
                                                title="More Actions"
                                            >
                                                <MoreVerticalIcon size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            ) : (
                <>
                    <div className="modern-grid fade-in">
                        {paginatedUsers.map(u => (
                            <div
                                key={u._id || u.username}
                                className="modern-card"
                                onDoubleClick={() => handleAction('edit', u)}
                            >
                                <div className="modern-card-header">
                                    <div className={`modern-avatar-large ${!u.profilePhoto ? 'no-photo' : ''}`} style={u.profilePhoto ? { backgroundImage: `url(${BASE_URL}${u.profilePhoto})` } : {}}>
                                        {!u.profilePhoto && u.name.charAt(0).toUpperCase()}
                                        <div className={`online-indicator ${u.isOnline ? 'online' : 'offline'}`}></div>
                                    </div>
                                    <div className="modern-info-large">
                                        <div className="promo-badge">
                                            <HighlightText text={u.role === 'Super Admin' ? 'Admin' : u.role} highlight={searchQuery} />
                                        </div>
                                        <h3><HighlightText text={u.name} highlight={searchQuery} /></h3>
                                        <div className="user-card__email">
                                            <MailIcon size={12} />
                                            <HighlightText text={u.email} highlight={searchQuery} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === u._id ? null : u._id);
                                        }}
                                        className="user-card__menu-trigger"
                                    >
                                        <MoreVerticalIcon size={18} />
                                    </button>
                                    {activeMenu === u._id && (
                                        <div className="user-card-menu">
                                            <div onClick={() => { handleAction('view', u); setActiveMenu(null); }} className="user-menu-item">
                                                <EyeIcon size={16} /> View Profile
                                            </div>
                                            <div onClick={() => { handleAction('edit', u); setActiveMenu(null); }} className="user-menu-item">
                                                <EditIcon size={16} /> Edit Details
                                            </div>
                                            <div onClick={() => { handleStatusToggle(u); setActiveMenu(null); }} className="user-menu-item">
                                                {u.status === 'Active' ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                                                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </div>
                                            {canDelete && (
                                                <div onClick={() => { handleAction('delete', u); setActiveMenu(null); }} className="user-menu-item delete">
                                                    <TrashIcon size={16} /> Delete User
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="metric-grid">
                                    <div className={`metric-pill ${u.status === 'Active' ? 'success' : 'neutral'}`}>
                                        <div className="status-dot"></div>
                                        <HighlightText text={u.status} highlight={searchQuery} />
                                    </div>
                                    {u.designation && (
                                        <div className="metric-pill">
                                            <BriefcaseIcon size={12} />
                                            <HighlightText text={u.designation} highlight={searchQuery} />
                                        </div>
                                    )}
                                    {u.department && (
                                        <div className="metric-pill">
                                            <UserIcon size={12} />
                                            <HighlightText text={u.department} highlight={searchQuery} />
                                        </div>
                                    )}
                                    {u.employeeId && (
                                        <div className="metric-pill">
                                            <HighlightText text={u.employeeId} highlight={searchQuery} />
                                        </div>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <div className="card-footer-text">
                                        Joined {formatDate(u.createdAt)}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleAction('view', u); }} className="primary-action-btn">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredUsers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </>
            )
            }

            <UserViewModal
                isOpen={!!viewUser}
                onClose={() => setViewUser(null)}
                user={viewUser}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteUser || isBulkDeleting}
                onClose={() => {
                    setDeleteUser(null);
                    setIsBulkDeleting(false);
                }}
                onConfirm={handleDeleteConfirm}
                itemName={deleteUser ? deleteUser.name : `${selectedUserIds.length} selected users`}
                itemType="User"
            />
            {/* Row Actions Menu */}
            {rowMenu && createPortal(
                <>
                    <div 
                        className="menu-backdrop" 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2999 }} 
                        onClick={() => setRowMenu(null)}
                    />
                    <div
                        className="row-actions-container animate-fade-in"
                        style={{
                            position: 'fixed',
                            top: rowMenu.y + (rowMenu.type === 'context' ? 0 : 5),
                            left: rowMenu.type === 'context' ? rowMenu.x : rowMenu.x - 180,
                            zIndex: 3000,
                            minWidth: '180px'
                        }}
                    >
                        <div className="menu-item" onClick={() => { handleAction('view', rowMenu.user); setRowMenu(null); }}>
                            <EyeIcon size={16} />
                            <span>View Details</span>
                        </div>
                        <div className="menu-item" onClick={() => { handleAction('edit', rowMenu.user); setRowMenu(null); }}>
                            <EditIcon size={16} />
                            <span>Edit User</span>
                        </div>
                        <div className="menu-item" onClick={() => { handleStatusToggle(rowMenu.user); setRowMenu(null); }}>
                            {rowMenu.user.status === 'Active' ? <XCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                            <span>{rowMenu.user.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </div>
                        <div className="menu-divider" />
                        {canDelete && (
                            <div className="menu-item danger" onClick={() => { handleAction('delete', rowMenu.user); setRowMenu(null); }}>
                                <TrashIcon size={16} />
                                <span>Delete User</span>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div >
    );
};

export default UserList;
