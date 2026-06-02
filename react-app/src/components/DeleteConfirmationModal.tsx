import React from 'react';
import Modal from './Modal';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    itemName, 
    itemType = 'item' 
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Delete ${itemType}`}
            hideHeader={true}
            size="sm"
            padding="0"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-danger"
                    >
                        Delete
                    </button>
                </>
            }
        >
            <div className="delete-modal-body">
                <div className="delete-illustration-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>
                <h3 className="delete-modal-title">Delete {itemType}?</h3>
                <p className="delete-modal-desc">
                    Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
                </p>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
