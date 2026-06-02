import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage = 10, 
    onPageChange,
    onItemsPerPageChange 
}) => {
    if (totalPages <= 1 && !onItemsPerPageChange) return null;

    const showStats = totalItems !== undefined;
    const startItem = showStats ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = showStats ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    return (
        <div className="pagination-modern">
            <div className="rows-per-page">
                <span>Rows per page:</span>
                <select 
                    value={itemsPerPage} 
                    onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>

            <div className="pagination-controls">
                {showStats ? (
                    <span className="range-text">
                        {startItem}-{endItem} of {totalItems}
                    </span>
                ) : (
                    <span className="range-text">
                        Page {currentPage} of {totalPages}
                    </span>
                )}
                <div className="nav-buttons">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="nav-btn"
                        title="Previous Page"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="nav-btn"
                        title="Next Page"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
