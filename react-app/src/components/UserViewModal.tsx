import React from 'react';
import Modal from './Modal';

interface UserViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ isOpen, onClose, user }) => {
    if (!user) return null;

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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Profile"
            size="md"
            footer={
                <button
                    onClick={onClose}
                    className="btn btn-secondary"
                >Close Profile</button>
            }
        >
            <div className="user-profile-modal">
                <div className="user-hero-section mb-24">
                    <div className="user-avatar-box">
                        {user.name?.charAt(0)}
                    </div>
                    <div className="user-hero-info">
                        <h2>{user.name}</h2>
                        <div className="user-badges">
                            <span className="badge-role">{user.role}</span>
                            <span className={`badge-status ${user.status?.toLowerCase() || 'active'}`}>
                                {user.status || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="user-details-grid">
                    <div className="detail-item">
                        <label>Username</label>
                        <span>{user.username || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Email Address</label>
                        <span>{user.email || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Contact Number</label>
                        <span>{user.phone || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>PAN Card</label>
                        <span>{user.panCard || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Bank Name</label>
                        <span>{user.bankName || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Account Number</label>
                        <span>{user.accountNo || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>IFSC Code</label>
                        <span>{user.ifscCode || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>UPI ID</label>
                        <span>{user.upiId || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Join Date</label>
                        <span>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Last Login</label>
                        <span>{formatDate(user.lastLogin)}</span>
                    </div>
                </div>
            </div>

            <style>{`
                .user-profile-modal { padding: 0.5rem 0; }
                .user-hero-section {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .user-avatar-box {
                    width: 64px;
                    height: 64px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, var(--primary), #4f46e5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
                }
                .user-hero-info h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }
                .user-badges { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
                .badge-role { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; background: #eff6ff; padding: 2px 8px; border-radius: 6px; }
                .badge-status { font-size: 0.75rem; font-weight: 600; }
                .badge-status.active { color: #10b981; }
                .badge-status.inactive { color: #ef4444; }
                
                .user-details-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                    padding-top: 1.5rem;
                }
                .detail-item { display: flex; flex-direction: column; gap: 4px; }
                .detail-item label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
                .detail-item span { font-size: 0.9375rem; font-weight: 600; color: #334155; }
                
                .mb-24 { margin-bottom: 24px; }
            `}</style>
        </Modal>
    );
};

export default UserViewModal;
