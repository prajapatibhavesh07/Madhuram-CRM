import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredModule }: { children: React.ReactNode, requiredModule?: string }) => {
    const { isAuthenticated, loading, user, activeRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '600' }}>Loading Session...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredModule && user && user.role !== 'Super Admin') {
        const hasPermission = activeRole?.permissions?.[requiredModule]?.view === true;
        if (!hasPermission) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
