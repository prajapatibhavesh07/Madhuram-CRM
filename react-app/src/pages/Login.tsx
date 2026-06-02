import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const [loading, setLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);
        setLoading(true);
        try {
            await login(username, password);
            showToast('Welcome back!', 'success');
            navigate(from, { replace: true });
        } catch (error) {
            showToast('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card max-w-440 w-full mx-auto mt-40">
            <div className="text-center mb-40">
                <h2 className="text-3xl mb-8">
                    Welcome <span className="text-gradient">Back</span>
                </h2>
                <p className="text-muted">Enter your credentials to access the CRM</p>
            </div>

            <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
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

                <div className="flex flex-justify-between mb-24 text-sm">
                    <label className="flex-align-center cursor-pointer text-muted">
                        <input type="checkbox" className="mr-8" /> Remember me
                    </label>
                    <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        Forgot Password?
                    </Link>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <svg className="spin" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" opacity="0.7" />
                            </svg>
                            Signing In...
                        </span>
                    ) : 'Sign In'}
                </button>
            </form>

            <p className="text-center mt-32 text-muted text-sm">
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                    Create Account
                </Link>
            </p>
        </div>
    );
};

export default Login;
