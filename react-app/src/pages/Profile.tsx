import { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { user, activeRole, updateProfile, changePassword } = useAuth();
    const { showToast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<UserRole>(user?.role || 'Normal User');
    const [isEditing, setIsEditing] = useState(false);

    // Change Password states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [wasProfileValidated, setWasProfileValidated] = useState(false);
    const [wasPasswordValidated, setWasPasswordValidated] = useState(false);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasProfileValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasProfileValidated(true);
        updateProfile({ name, username, email, role });
        setIsEditing(false);
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasPasswordValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasPasswordValidated(true);
        setIsChangingPassword(true);
        try {
            await changePassword(oldPassword, newPassword);
            setPasswordMessage('Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (error) {
            setPasswordMessage('Failed to update password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
            <div className="glass-card">
                <h2 style={{ marginBottom: '2rem' }}>User <span className="text-gradient">Profile</span></h2>

                <form onSubmit={handleSave} className={wasProfileValidated ? 'was-validated' : ''} noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                disabled={!isEditing}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                disabled={!isEditing}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            disabled={!isEditing}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Current Role</label>
                        {(user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.users?.edit === true) && isEditing ? (
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="input-field"
                                disabled={!isEditing}
                            >
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="Normal User">Regular User</option>
                            </select>
                        ) : (
                            <input type="text" value={role === 'Super Admin' ? 'Admin' : role} className="input-field" disabled />
                        )}
                        {!(user?.role === 'Super Admin' || user?.role === 'Admin' || activeRole?.permissions?.users?.edit === true) && isEditing && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Roles can only be changed by Administrators.
                            </p>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        {isEditing ? (
                            <>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setName(user?.name || '');
                                        setUsername(user?.username || '');
                                        setEmail(user?.email || '');
                                        setRole(user?.role || 'Normal User');
                                    }}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--border)' }}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="btn-primary"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </form>

                <hr style={{ margin: '3rem 0', borderColor: 'var(--border)', opacity: 0.3 }} />

                <div className="input-group">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Security</h3>
                    <form onSubmit={handlePasswordChange} className={wasPasswordValidated ? 'was-validated' : ''} noValidate>
                        <div className="input-group">
                            <label>Current Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showOldPassword ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showOldPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label>New Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ border: '1px solid var(--border)', width: 'auto', padding: '0.75rem 1.5rem' }}
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? 'Updating...' : 'Change Password'}
                        </button>
                        {passwordMessage && (
                            <p style={{ marginTop: '1rem', color: passwordMessage.includes('successfully') ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                                {passwordMessage}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
