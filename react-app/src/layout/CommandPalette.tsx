import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api, BASE_URL } from '../services/api';
import { useAuth, type UserRole } from '../context/AuthContext';
import {
    XIcon,
    SearchIcon,
    BriefcaseIcon,
    UsersIcon,
    UserIcon
} from '../icons';

interface SearchItem {
    id: string;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    category: string;
    shortcut?: string;
    path: string;
    roles?: UserRole[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    // Wrap in try-catch if possible, though hooks must be top level
    const auth = useAuth();
    const user = auth?.user;

    const [search, setSearch] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [dataItems, setDataItems] = React.useState<SearchItem[]>([]);
    const navigate = useNavigate();
    const inputRef = React.useRef<HTMLInputElement>(null);

    const hasPermission = (roles?: UserRole[]) => {
        if (!roles) return true;
        if (!user || !user.role) return false;
        return roles.includes(user.role);
    };

    // Static items (Actions only)
    const staticItems: SearchItem[] = [
        { id: 'dashboard', label: 'Go to Dashboard', icon: <SearchIcon size={18} />, category: 'NAVIGATION', shortcut: '⌘ D', path: '/dashboard' },
        { id: 'tasks', label: 'My Tasks', icon: <SearchIcon size={18} />, category: 'NAVIGATION', shortcut: '⌘ T', path: '/tasks' },
        { id: 'new-user', label: 'Create new user', icon: <UsersIcon size={18} />, category: 'ACTIONS', shortcut: '⌘ U', path: '/users/register', roles: ['Super Admin', 'Admin'] as UserRole[] },
        { id: 'new-candidate', label: 'Add New Candidate', icon: <UsersIcon size={18} />, category: 'ACTIONS', shortcut: '⌘ B', path: '/candidates/new', roles: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'] as UserRole[] },
    ].filter(item => hasPermission(item.roles));

    const [recentIds, setRecentIds] = React.useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('recentSearchIds');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return [];
        }
    });

    const fetchData = React.useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const fetchPromises: Promise<any>[] = [];
            const dataTypes: string[] = [];

            if (hasPermission(['Super Admin', 'Admin'])) {
                fetchPromises.push(api.getUsers().catch(e => { console.error('Users fetch error:', e); return []; }));
                dataTypes.push('USERS');
            }
            if (hasPermission(['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Recruiter'])) {
                fetchPromises.push(api.getCandidates().catch(e => { console.error('Candidates fetch error:', e); return []; }));
                dataTypes.push('CANDIDATES');
                fetchPromises.push(api.getJobs().catch(e => { console.error('Jobs fetch error:', e); return []; }));
                dataTypes.push('JOBS');
            }

            const results = await Promise.all(fetchPromises);
            let combinedItems: SearchItem[] = [];

            results.forEach((data, index) => {
                if (!Array.isArray(data)) {
                    console.warn(`Search data for ${dataTypes[index]} is not an array:`, data);
                    return;
                }

                const type = dataTypes[index];
                if (type === 'USERS') {
                    combinedItems = [...combinedItems, ...data.map((u: any) => ({
                        id: `u-${u?._id || Math.random()}`,
                        label: u?.name || u?.username || 'Unknown User',
                        sublabel: `${u?.role || 'No Role'} • ${u?.email || 'No email'}`,
                        icon: u?.profilePhoto ? (
                            <img src={`${BASE_URL}${u.profilePhoto}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon size={18} />
                        ),
                        category: 'USERS',
                        path: `/users`
                    }))];
                } else if (type === 'CANDIDATES') {
                    combinedItems = [...combinedItems, ...data.map((c: any) => ({
                        id: `c-${c?._id || Math.random()}`,
                        label: c?.name || 'Anonymous Candidate',
                        sublabel: `${c?.designation || 'Candidate'} • ${c?.email || c?.phone || 'No contact info'}`,
                        icon: c?.photograph?.fileUrl ? (
                            <img src={c.photograph.fileUrl.startsWith('http') ? c.photograph.fileUrl : `${BASE_URL}${c.photograph.fileUrl}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                        ) : (
                            <UsersIcon size={18} />
                        ),
                        category: 'CANDIDATES',
                        path: `/candidates`
                    }))];
                } else if (type === 'JOBS') {
                    combinedItems = [...combinedItems, ...data.map((j: any) => ({
                        id: `j-${j?._id || Math.random()}`,
                        label: j?.title || 'Untitled Job',
                        sublabel: `${j?.company || 'Unknown Company'} • ${j?.location || 'Remote'}`,
                        icon: <BriefcaseIcon size={18} />,
                        category: 'JOBS',
                        path: `/jobs`
                    }))];
                }
            });

            setDataItems(combinedItems);
        } catch (error) {
            console.error('Critical error in global search fetchData:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 100);
            document.body.style.overflow = 'hidden';
            setSearch('');
            fetchData();
            return () => clearTimeout(timer);
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen, fetchData]);

    if (!isOpen) return null;

    const allCombinedItems = [...staticItems, ...dataItems];

    const recentItems = recentIds
        .map(id => allCombinedItems.find(item => item.id === id))
        .filter((item): item is SearchItem => !!item);

    const filteredItems = search.trim() === ''
        ? staticItems
        : allCombinedItems.filter(item => {
            const query = search.toLowerCase();
            const labelMatch = (item?.label || '').toLowerCase().includes(query);
            const sublabelMatch = (item?.sublabel || '').toLowerCase().includes(query);
            const categoryMatch = (item?.category || '').toLowerCase().includes(query);
            return labelMatch || sublabelMatch || categoryMatch;
        });

    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!item || !item.category) return acc;
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, SearchItem[]>);

    const handleItemClick = (item: SearchItem) => {
        if (!item || !item.id) return;

        // Update recent searches
        const updatedIds = [item.id, ...recentIds.filter(id => id !== item.id)].slice(0, 5);
        setRecentIds(updatedIds);
        try {
            localStorage.setItem('recentSearchIds', JSON.stringify(updatedIds));
        } catch (e) {
            console.warn('Failed to save recent searches', e);
        }

        if (item.path) {
            navigate(item.path);
            onClose();
        }
    };

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-palette" onClick={e => e.stopPropagation()}>
                <div className="search-header">
                    <SearchIcon size={20} color="#80868b" />
                    <input
                        ref={inputRef}
                        className="search-input"
                        placeholder="Search for candidates, users, or jobs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && filteredItems.length > 0) {
                                handleItemClick(filteredItems[0]);
                            }
                        }}
                    />
                    {isLoading && (
                        <div className="search-spinner" style={{ marginRight: 12 }}></div>
                    )}
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#80868b', cursor: 'pointer', padding: 4 }}>
                        <XIcon size={18} />
                    </button>
                </div>
                <div className="search-body">
                    {/* Results / Categories */}
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {Object.keys(groupedItems).length > 0 ? (
                            Object.keys(groupedItems).map(category => (
                                <div key={category}>
                                    <div className="search-section-label">{category}</div>
                                    {groupedItems[category].slice(0, 10).map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                                            <div className="search-item-icon">{item.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div className="search-item-label">{item.label}</div>
                                                {item.sublabel && <div style={{ fontSize: '0.75rem', color: '#80868b' }}>{item.sublabel}</div>}
                                            </div>
                                            {item.shortcut && <div className="search-item-shortcut">{item.shortcut}</div>}
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            search.trim() !== '' && !isLoading && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#80868b' }}>
                                    No results found for "{search}"
                                </div>
                            )
                        )}
                    </div>

                    {/* Recent Searches */}
                    {search.trim() === '' && recentItems.length > 0 && (
                        <div>
                            <div className="search-section-label">RECENT SEARCH</div>
                            {recentItems.map(item => (
                                <div key={`recent-${item.id}`} className="search-item" onClick={() => handleItemClick(item)} style={{ cursor: 'pointer' }}>
                                    <div className="search-item-icon">{item.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="search-item-label">{item.label}</div>
                                        {item.sublabel && <div style={{ fontSize: '0.75rem', color: '#80868b' }}>{item.sublabel}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="search-footer">
                    <div className="search-hint">
                        <kbd>Esc</kbd> <span>Close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
