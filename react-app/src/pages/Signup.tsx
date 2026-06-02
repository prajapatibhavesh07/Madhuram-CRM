import React, { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role] = useState<UserRole>('Normal User');
    const [phone, setPhone] = useState('');
    const [wasValidated, setWasValidated] = useState(false);
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

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
            await register(username, email, password, name, role);
            showToast('Registration successful! Welcome.', 'success');
            navigate('/dashboard');
        } catch (error) {
            showToast('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
    };

    return (
        <div className="glass-card max-w-480 w-full mx-auto mt-40">
            <div className="text-center mb-40">
                <h2 className="text-3xl mb-8">
                    Create <span className="text-gradient">Account</span>
                </h2>
                <p className="text-muted">Join the CRM management system</p>
            </div>

            <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
                <input type="hidden" id="role" value={role} className="input-field" />
                <div className="input-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            placeholder="johndoe"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                            type="text"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="input-field"
                            placeholder="xxxxx-xxxxx"
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        placeholder="john@example.com"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary mt-16">
                    Register
                </button>
            </form>

            <p className="text-center mt-32 text-muted text-sm">
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                    Sign In
                </Link>
            </p>
        </div>
    );
};

export default Signup;
