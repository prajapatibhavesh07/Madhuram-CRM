import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { EditIcon, TrashIcon, GridIcon, ListIcon, SearchIcon, MoreVerticalIcon, GripVerticalIcon, ChevronDownIcon, PlusIcon } from '../icons';
import Pagination from '../components/Pagination';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { formatAppDate } from '../utils/helpers';

interface Offer {
    _id: string;
    candidateId: { _id: string; name: string };
    jobId: { _id: string; title: string };
    salary: { ctc: number };
    joiningDate: string;
    status: string;
}

const HighlightText = ({ text, highlight }: { text: string | number, highlight: string }) => {
    const stringText = text?.toString() || '';
    if (!highlight.trim()) return <>{stringText}</>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = stringText.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="text-highlight">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const OfferList = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const { showToast } = useToast();
    const navigate = useNavigate();
    const { user, activeRole } = useAuth();
    const canCreate = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.offers?.create === true;
    const canEdit = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.offers?.edit === true;
    const canDelete = user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.offers?.delete === true;

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const data = await api.getOffers();
            setOffers(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to fetch offers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeletingOfferId(id);
    };

    const confirmDelete = async () => {
        if (!deletingOfferId) return;
        try {
            await api.deleteOffer(deletingOfferId);
            showToast('Offer deleted successfully', 'success');
            setOffers(offers.filter(o => o._id !== deletingOfferId));
        } catch (error) {
            console.error(error);
            showToast('Failed to delete offer', 'error');
        } finally {
            setDeletingOfferId(null);
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id => api.deleteOffer(id)));
            showToast('Selected offers deleted successfully', 'success');
            setOffers(offers.filter(o => !selectedIds.includes(o._id)));
            setSelectedIds([]);
        } catch (error) {
            console.error(error);
            showToast('Failed to delete some offers', 'error');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedOffers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedOffers.map(o => o._id));
        }
    };

    const filteredOffers = offers.filter(offer =>
        offer.candidateId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.jobId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
    const paginatedOffers = filteredOffers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="candidate-list-page">
            <div className="candidate-list-header">
                <div className="header-title">
                    <h3>
                        Offer Letters
                        <span className="total-badge">
                            {filteredOffers.length} Total
                        </span>
                    </h3>
                    <p>Manage and track candidate offer letters.</p>
                </div>
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search offers..."
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

                    {canDelete && selectedIds.length > 0 && (
                        <button
                            className="btn btn-danger"
                            onClick={handleBulkDelete}
                        >
                            <TrashIcon size={18} className="mr-8" /> Delete ({selectedIds.length})
                        </button>
                    )}
                    {canCreate && (
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/offers/new')}
                        >
                            <PlusIcon size={18} className="mr-8" /> Create Offer
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-container">Loading offers...</div>
            ) : filteredOffers.length === 0 ? (
                <div className="empty-state-message">
                    {searchQuery ? `No offers matching "${searchQuery}"` : 'No offers found.'}
                </div>
            ) : viewMode === 'list' ? (
                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                {canDelete && (
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === paginatedOffers.length && paginatedOffers.length > 0}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                )}
                                <th>
                                    <div className="modern-th-content">
                                        <div className="modern-th-label">
                                            <GripVerticalIcon size={12} className="grip-icon" />
                                            Candidate
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
                                            Job
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
                                            CTC
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
                                            Joining Date
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
                                            Status
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
                                        <div className="modern-th-label">Actions</div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                             {paginatedOffers.map(offer => (
                                <tr 
                                    key={offer._id} 
                                    className={selectedIds.includes(offer._id) ? 'selected-row' : ''}
                                    onDoubleClick={() => canEdit && navigate(`/offers/edit/${offer._id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {canDelete && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(offer._id)}
                                                onChange={() => toggleSelect(offer._id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                    )}
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">
                                                {offer.candidateId?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">
                                                    <HighlightText text={offer.candidateId?.name} highlight={searchQuery} />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="job-title-text">
                                            <HighlightText text={offer.jobId?.title} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="salary-text">
                                            ₹<HighlightText text={offer.salary?.ctc?.toLocaleString() || '-'} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-text">
                                            {formatAppDate(offer.joiningDate)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status-badge ${offer.status === 'Accepted' ? 'success' : offer.status === 'Sent' ? 'warning' : 'danger'}`}>
                                            <div className="status-dot"></div>
                                            <HighlightText text={offer.status} highlight={searchQuery} />
                                        </div>
                                    </td>
                                    <td className="sticky-last">
                                        <div className="flex-row-gap-center">
                                            {canEdit && (
                                                <button onClick={() => navigate(`/offers/edit/${offer._id}`)} className="action-btn" title="Edit"><EditIcon size={16} /></button>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => handleDelete(offer._id)} className="action-btn action-btn--delete" title="Delete"><TrashIcon size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            ) : (
                <>
                    <div className="modern-grid fade-in">
                        {paginatedOffers.map(offer => (
                            <div key={offer._id} className="modern-card">
                                <div className="modern-card-header">
                                    <div className="modern-avatar-large" style={{ background: '#f3f4f6' }}>
                                        {offer.candidateId?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="modern-info-large">
                                        <div className="promo-badge">
                                            <HighlightText text={offer.jobId?.title || 'Unknown Role'} highlight={searchQuery} />
                                        </div>
                                        <h3><HighlightText text={offer.candidateId?.name} highlight={searchQuery} /></h3>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0' }}>
                                            <span style={{ fontWeight: '600', color: '#059669' }}>
                                                ₹<HighlightText text={offer.salary?.ctc?.toLocaleString() || '-'} highlight={searchQuery} /> CTC
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === offer._id ? null : offer._id);
                                        }}
                                        className="icon-btn"
                                        style={{ position: 'absolute', top: 0, right: 0 }}
                                    >
                                        <MoreVerticalIcon size={18} />
                                    </button>
                                    {activeMenu === offer._id && (
                                        <div className="user-action-menu">
                                             {canEdit && (
                                                 <div onClick={() => navigate(`/offers/edit/${offer._id}`)} className="user-menu-item">
                                                     <EditIcon size={16} /> Edit
                                                 </div>
                                             )}
                                            {canDelete && (
                                                <div onClick={() => handleDelete(offer._id)} className="user-menu-item delete">
                                                    <TrashIcon size={16} /> Delete
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="metric-grid">
                                    <div className={`metric-pill ${offer.status === 'Accepted' ? 'success' : 'neutral'}`}>
                                        <div className="status-dot"></div>
                                        <HighlightText text={offer.status} highlight={searchQuery} />
                                    </div>
                                    <div className="metric-pill neutral">
                                        Join: {formatAppDate(offer.joiningDate)}
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <div className="card-footer-text">
                                        ID: {offer._id.substring(0, 8)}...
                                    </div>
                                    {canEdit && (
                                        <button onClick={() => navigate(`/offers/edit/${offer._id}`)} className="primary-action-btn">
                                            Manage Offer
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
            <DeleteConfirmationModal
                isOpen={!!deletingOfferId}
                onClose={() => setDeletingOfferId(null)}
                onConfirm={confirmDelete}
                itemName="this offer letter"
                itemType="offer"
            />

            <DeleteConfirmationModal
                isOpen={isBulkDeleting}
                onClose={() => setIsBulkDeleting(false)}
                onConfirm={confirmBulkDelete}
                itemName={`${selectedIds.length} selected offer letters`}
                itemType="bulk offers"
            />
        </div>
    );
};

export default OfferList;
