import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setWasValidated(true);
        setSubmitted(true);
    };

    return (
        <div className="glass-card max-w-440 w-full mx-auto mt-40">
            <div className="text-center mb-40">
                <h2 className="text-3xl mb-8">
                    Forgot <span className="text-gradient">Password?</span>
                </h2>
                <p className="text-muted">
                    {submitted ? "Check your email for reset instructions" : "Enter your email to receive a reset link"}
                </p>
            </div>

            {!submitted ? (
                <form onSubmit={handleSubmit} className={wasValidated ? 'was-validated' : ''} noValidate>
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
                    <button type="submit" className="btn-primary">
                        Send Reset Link
                    </button>
                </form>
            ) : (
                <button onClick={() => setSubmitted(false)} className="btn-primary">
                    Try Again
                </button>
            )}

            <p className="text-center mt-32 text-muted text-sm">
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                    Back to Login
                </Link>
            </p>
        </div>
    );
};

export default ForgotPassword;
