import { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon, MailIcon, SlidersIcon } from '../icons';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'smtp' | 'emails' | 'general' | 'payroll' | 'apiKeys'>('smtp');
    const [showPassword, setShowPassword] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showTwilioToken, setShowTwilioToken] = useState(false);
    const [showAppSecurityKey, setShowAppSecurityKey] = useState(false);
    const [showEncryptionSecret, setShowEncryptionSecret] = useState(false);

    const [smtpConfig, setSmtpConfig] = useState({
        host: '',
        port: '',
        username: '',
        password: '',
        encryption: 'TLS',
        from: ''
    });
    const [, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [emailConfig, setEmailConfig] = useState({
        support: '',
        info: '',
        hr: '',
        billing: ''
    });

    const [generalConfig, setGeneralConfig] = useState({
        companyName: 'CRM Enterprise',
        website: 'https://example.com'
    });

    const [payrollConfig, setPayrollConfig] = useState({
        logo: '',
        address: '',
        contact: {
            email: '',
            phone: ''
        },
        footerText: ''
    });
    
    const [apiKeysConfig, setApiKeysConfig] = useState({
        openai: '',
        twilioSid: '',
        twilioToken: '',
        twilioPhone: '',
        googleMapsKey: '',
        appSecurityKey: '',
        encryptionSecret: ''
    });

    const fetchSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data.smtp) setSmtpConfig(data.smtp);
            if (data.emails) setEmailConfig(data.emails);
            if (data.general) setGeneralConfig(data.general);
            if (data.payroll) setPayrollConfig(data.payroll);
            if (data.apiKeys) setApiKeysConfig(data.apiKeys);
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateSettings({
                smtp: smtpConfig,
                emails: emailConfig,
                general: generalConfig,
                payroll: payrollConfig,
                apiKeys: apiKeysConfig
            });
            showToast('Settings saved successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>System Settings</h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Configure your system preferences, SMTP, and company communication channels.</p>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="widget-card" style={{ padding: '0' }}>
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--border)',
                        padding: '0 1.5rem'
                    }}>
                        {[
                            { id: 'smtp', label: 'SMTP Configuration', icon: <SlidersIcon size={18} /> },
                            { id: 'emails', label: 'Company Emails', icon: <MailIcon size={18} /> },
                            { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
                            { id: 'payroll', label: 'Payroll PDF Settings', icon: <SettingsIcon size={18} /> },
                            { id: 'apiKeys', label: 'API & Security', icon: <SlidersIcon size={18} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '1.25rem 1.5rem',
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: '700',
                                    color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '2rem 2.5rem' }}>
                        {activeTab === 'smtp' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group">
                                        <label>SMTP Host</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. smtp.gmail.com"
                                            value={smtpConfig.host}
                                            onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>SMTP Port</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. 587"
                                            value={smtpConfig.port}
                                            onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Email address"
                                            value={smtpConfig.username}
                                            onChange={e => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="••••••••"
                                                value={smtpConfig.password}
                                                onChange={e => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '👁️' : '🔒'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Encryption</label>
                                        <select
                                            className="input-field"
                                            value={smtpConfig.encryption}
                                            onChange={e => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                                        >
                                            <option>None</option>
                                            <option>SSL</option>
                                            <option>TLS</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>From Address</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder='e.g. "ATS System" <noreply@company.com>'
                                            value={smtpConfig.from}
                                            onChange={e => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'emails' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group">
                                        <label>Support Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="support@company.com"
                                            value={emailConfig.support}
                                            onChange={e => setEmailConfig({ ...emailConfig, support: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Information Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="info@company.com"
                                            value={emailConfig.info}
                                            onChange={e => setEmailConfig({ ...emailConfig, info: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>HR Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="hr@company.com"
                                            value={emailConfig.hr}
                                            onChange={e => setEmailConfig({ ...emailConfig, hr: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Billing Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="billing@company.com"
                                            value={emailConfig.billing}
                                            onChange={e => setEmailConfig({ ...emailConfig, billing: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group">
                                        <label>Company Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={generalConfig.companyName}
                                            onChange={e => setGeneralConfig({ ...generalConfig, companyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            className="input-field"
                                            value={generalConfig.website}
                                            onChange={e => setGeneralConfig({ ...generalConfig, website: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payroll' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group full-width">
                                        <label>Company logo (Base64 or URL)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="data:image/png;base64,..."
                                            value={payrollConfig.logo}
                                            onChange={e => setPayrollConfig({ ...payrollConfig, logo: e.target.value })}
                                        />
                                        {payrollConfig.logo && (
                                            <div style={{ marginTop: '1rem', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>
                                                <img src={payrollConfig.logo} alt="Preview" style={{ maxHeight: '60px' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Company Address</label>
                                        <textarea
                                            className="input-field"
                                            style={{ minHeight: '80px', padding: '0.75rem' }}
                                            placeholder="Complete office address for payslip"
                                            value={payrollConfig.address}
                                            onChange={e => setPayrollConfig({ ...payrollConfig, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Contact Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="payroll@company.com"
                                            value={payrollConfig.contact.email}
                                            onChange={e => setPayrollConfig({ ...payrollConfig, contact: { ...payrollConfig.contact, email: e.target.value } })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Contact Phone</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="+1 234 567 890"
                                            value={payrollConfig.contact.phone}
                                            onChange={e => setPayrollConfig({ ...payrollConfig, contact: { ...payrollConfig.contact, phone: e.target.value } })}
                                        />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Payslip Footer Text</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Computer generated document, no signature required."
                                            value={payrollConfig.footerText}
                                            onChange={e => setPayrollConfig({ ...payrollConfig, footerText: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'apiKeys' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group full-width">
                                        <label>OpenAI API Key</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="sk-..."
                                                value={apiKeysConfig.openai}
                                                onChange={e => setApiKeysConfig({ ...apiKeysConfig, openai: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                            >
                                                {showApiKey ? '👁️' : '🔒'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Used for AI Resume Parsing and Candidate Scoring.</p>
                                    </div>

                                    <div className="input-group">
                                        <label>Twilio Account SID</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="AC..."
                                            value={apiKeysConfig.twilioSid}
                                            onChange={e => setApiKeysConfig({ ...apiKeysConfig, twilioSid: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Twilio Auth Token</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showTwilioToken ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="••••••••"
                                                value={apiKeysConfig.twilioToken}
                                                onChange={e => setApiKeysConfig({ ...apiKeysConfig, twilioToken: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowTwilioToken(!showTwilioToken)}
                                            >
                                                {showTwilioToken ? '👁️' : '🔒'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Twilio Phone Number</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="+1234567890"
                                            value={apiKeysConfig.twilioPhone}
                                            onChange={e => setApiKeysConfig({ ...apiKeysConfig, twilioPhone: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group full-width">
                                        <label>Google Maps API Key</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="AIza..."
                                            value={apiKeysConfig.googleMapsKey}
                                            onChange={e => setApiKeysConfig({ ...apiKeysConfig, googleMapsKey: e.target.value })}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Used for address lookup and geocoding features.</p>
                                    </div>

                                    <div className="input-group">
                                        <label>Application Security Key</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showAppSecurityKey ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="Master security key"
                                                value={apiKeysConfig.appSecurityKey}
                                                onChange={e => setApiKeysConfig({ ...apiKeysConfig, appSecurityKey: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowAppSecurityKey(!showAppSecurityKey)}
                                            >
                                                {showAppSecurityKey ? '👁️' : '🔒'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>Encryption Secret</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showEncryptionSecret ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="Data encryption secret"
                                                value={apiKeysConfig.encryptionSecret}
                                                onChange={e => setApiKeysConfig({ ...apiKeysConfig, encryptionSecret: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowEncryptionSecret(!showEncryptionSecret)}
                                            >
                                                {showEncryptionSecret ? '👁️' : '🔒'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{
                        padding: '1.5rem 2.5rem',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        background: '#f8fafc',
                        borderBottomLeftRadius: '16px',
                        borderBottomRightRadius: '16px'
                    }}>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            style={{
                                width: 'auto',
                                padding: '0.75rem 2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                            disabled={saving}
                        >
                            <SaveIcon size={18} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
