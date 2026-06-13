import { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon, MailIcon, SlidersIcon } from '../icons';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'smtp' | 'emails' | 'general' | 'attendance' | 'leavePolicy' | 'payroll' | 'apiKeys'>('smtp');
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
        website: 'https://example.com',
        dateFormat: 'DD/MM/YYYY',
        companyLogo: ''
    });

    const [attendanceConfig, setAttendanceConfig] = useState({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        shiftStart: '09:00',
        shiftEnd: '18:00',
        halfDayThreshold: '11:00'
    });

    const [leavePolicyConfig, setLeavePolicyConfig] = useState({
        casualLeaveDays: 12,
        sickLeaveDays: 12,
        earnedLeaveDays: 15,
        paternityLeaveDays: 15,
        maternityLeaveDays: 90,
        customLeaveTypes: [] as { name: string; days: number }[],
        enableSandwichRule: false
    });

    const [newCustomLeaveName, setNewCustomLeaveName] = useState('');
    const [newCustomLeaveDays, setNewCustomLeaveDays] = useState('');

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
            if (data.general) setGeneralConfig({
                companyName: data.general.companyName || 'CRM Enterprise',
                website: data.general.website || '',
                dateFormat: data.general.dateFormat || 'DD/MM/YYYY',
                companyLogo: data.general.companyLogo || ''
            });
            if (data.payroll) setPayrollConfig(data.payroll);
            if (data.apiKeys) setApiKeysConfig(data.apiKeys);
            if (data.attendance) setAttendanceConfig({
                workingDays: data.attendance.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                shiftStart: data.attendance.shiftStart || '09:00',
                shiftEnd: data.attendance.shiftEnd || '18:00',
                halfDayThreshold: data.attendance.halfDayThreshold || '11:00'
            });
            if (data.leavePolicy) setLeavePolicyConfig({
                casualLeaveDays: data.leavePolicy.casualLeaveDays ?? 12,
                sickLeaveDays: data.leavePolicy.sickLeaveDays ?? 12,
                earnedLeaveDays: data.leavePolicy.earnedLeaveDays ?? 15,
                paternityLeaveDays: data.leavePolicy.paternityLeaveDays ?? 15,
                maternityLeaveDays: data.leavePolicy.maternityLeaveDays ?? 90,
                customLeaveTypes: data.leavePolicy.customLeaveTypes || [],
                enableSandwichRule: !!data.leavePolicy.enableSandwichRule
            });
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

    const handleAddCustomLeave = () => {
        if (!newCustomLeaveName || !newCustomLeaveDays) {
            showToast('Please provide both leave name and number of days.', 'error');
            return;
        }
        if (leavePolicyConfig.customLeaveTypes.some(c => c.name.toLowerCase() === newCustomLeaveName.toLowerCase())) {
            showToast('A custom leave type with this name already exists.', 'error');
            return;
        }
        setLeavePolicyConfig({
            ...leavePolicyConfig,
            customLeaveTypes: [
                ...leavePolicyConfig.customLeaveTypes,
                { name: newCustomLeaveName, days: parseInt(newCustomLeaveDays) || 0 }
            ]
        });
        setNewCustomLeaveName('');
        setNewCustomLeaveDays('');
    };

    const handleRemoveCustomLeave = (index: number) => {
        setLeavePolicyConfig({
            ...leavePolicyConfig,
            customLeaveTypes: leavePolicyConfig.customLeaveTypes.filter((_, i) => i !== index)
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateSettings({
                smtp: smtpConfig,
                emails: emailConfig,
                general: generalConfig,
                payroll: payrollConfig,
                apiKeys: apiKeysConfig,
                attendance: attendanceConfig,
                leavePolicy: leavePolicyConfig
            });
            if (generalConfig.dateFormat) {
                localStorage.setItem('dateFormat', generalConfig.dateFormat);
            }
            if (generalConfig.companyName) {
                localStorage.setItem('companyName', generalConfig.companyName);
            }
            if (generalConfig.companyLogo) {
                localStorage.setItem('companyLogo', generalConfig.companyLogo);
            } else {
                localStorage.removeItem('companyLogo');
            }
            window.dispatchEvent(new Event('settingsUpdated'));
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
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Configure your system preferences, SMTP, shift schedules, and employee leave policies.</p>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="widget-card" style={{ padding: '0' }}>
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--border)',
                        padding: '0 1.5rem',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap'
                    }}>
                        {[
                            { id: 'smtp', label: 'SMTP Configuration', icon: <SlidersIcon size={18} /> },
                            { id: 'emails', label: 'Company Emails', icon: <MailIcon size={18} /> },
                            { id: 'general', label: 'General Settings', icon: <SettingsIcon size={18} /> },
                            { id: 'attendance', label: 'Attendance & Shift', icon: <SlidersIcon size={18} /> },
                            { id: 'leavePolicy', label: 'Leave Policy', icon: <SettingsIcon size={18} /> },
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
                                    borderTop: 'none',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    background: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: '700',
                                    color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
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
                                    <div className="input-group">
                                        <label>System Date Format</label>
                                        <select
                                            className="input-field"
                                            value={generalConfig.dateFormat}
                                            onChange={e => setGeneralConfig({ ...generalConfig, dateFormat: e.target.value })}
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 08/06/2026)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/08/2026)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-08)</option>
                                            <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 08-06-2026)</option>
                                            <option value="DD MMM YYYY">DD MMM YYYY (e.g. 08 Jun 2026)</option>
                                            <option value="DD MMMM YYYY">DD MMMM YYYY (e.g. 08 June 2026)</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Company Logo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setGeneralConfig({ ...generalConfig, companyLogo: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="input-field"
                                            style={{ padding: '6px' }}
                                        />
                                        {generalConfig.companyLogo && (
                                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={generalConfig.companyLogo} alt="Logo Preview" style={{ maxHeight: '50px', maxWidth: '150px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }} />
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => setGeneralConfig({ ...generalConfig, companyLogo: '' })}
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', lineHeight: 'normal' }}
                                                >
                                                    Remove Logo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2rem' }}>
                                    <div className="input-group full-width">
                                        <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Working Days of the Week</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                                const isChecked = attendanceConfig.workingDays.includes(day);
                                                return (
                                                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                const newDays = isChecked
                                                                    ? attendanceConfig.workingDays.filter(d => d !== day)
                                                                    : [...attendanceConfig.workingDays, day];
                                                                setAttendanceConfig({ ...attendanceConfig, workingDays: newDays });
                                                            }}
                                                        />
                                                        {day}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Shift Start Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={attendanceConfig.shiftStart}
                                            onChange={e => setAttendanceConfig({ ...attendanceConfig, shiftStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Shift End Time</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={attendanceConfig.shiftEnd}
                                            onChange={e => setAttendanceConfig({ ...attendanceConfig, shiftEnd: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Half Day Calculation Time Threshold</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={attendanceConfig.halfDayThreshold}
                                            onChange={e => setAttendanceConfig({ ...attendanceConfig, halfDayThreshold: e.target.value })}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Employees punching in after this time will automatically be marked as having a "Half Day" leave.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'leavePolicy' && (
                            <div className="fade-in">
                                <div className="compact-grid" style={{ gap: '2.5rem' }}>
                                    {/* Sandwich Rule Toggle */}
                                    <div className="input-group full-width" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={leavePolicyConfig.enableSandwichRule}
                                                onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, enableSandwichRule: e.target.checked })}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            Enable Sandwich Leave Rule
                                        </label>
                                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '28px' }}>
                                            If enabled, weekends and holidays that fall between two leave days (on both sides) will be counted as leave days.
                                        </p>
                                    </div>

                                    {/* Standard Leave Limits */}
                                    <div className="full-width" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.25rem' }}>Standard Leave Limits (Annual)</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label>Casual Leave (CL) Days</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    value={leavePolicyConfig.casualLeaveDays}
                                                    onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, casualLeaveDays: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Sick Leave (SL) Days</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    value={leavePolicyConfig.sickLeaveDays}
                                                    onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, sickLeaveDays: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Earned Leave (EL) Days</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    value={leavePolicyConfig.earnedLeaveDays}
                                                    onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, earnedLeaveDays: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Paternity Leave Days</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    value={leavePolicyConfig.paternityLeaveDays}
                                                    onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, paternityLeaveDays: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Maternity Leave Days</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    value={leavePolicyConfig.maternityLeaveDays}
                                                    onChange={e => setLeavePolicyConfig({ ...leavePolicyConfig, maternityLeaveDays: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Leave Types */}
                                    <div className="full-width" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>Custom Leave Types</h3>
                                        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>Create any other custom leave types and assign their annual day limit.</p>
                                        
                                        {/* List of Custom Leaves */}
                                        {leavePolicyConfig.customLeaveTypes.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', maxWidth: '500px' }}>
                                                {leavePolicyConfig.customLeaveTypes.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px' }}>
                                                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>{item.name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.days} Days / year</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveCustomLeave(idx)}
                                                                style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Custom Leave Input Block */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', maxWidth: '600px' }}>
                                            <div className="input-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                                                <label>Leave Type Name</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="e.g. Study Leave"
                                                    value={newCustomLeaveName}
                                                    onChange={e => setNewCustomLeaveName(e.target.value)}
                                                />
                                            </div>
                                            <div className="input-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                                                <label>Annual Days Limit</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="1"
                                                    placeholder="e.g. 5"
                                                    value={newCustomLeaveDays}
                                                    onChange={e => setNewCustomLeaveDays(e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={handleAddCustomLeave}
                                                className="btn btn-primary"
                                                style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', whiteSpace: 'nowrap' }}
                                            >
                                                Add Custom Leave
                                            </button>
                                        </div>
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
