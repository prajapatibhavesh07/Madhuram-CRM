import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { type Role } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, BASE_URL } from '../services/api';
import { UsersIcon, UserIcon, MailIcon, PhoneIcon, ShieldIcon, FileTextIcon, BriefcaseIcon, CalendarIcon, PlusIcon, TrashIcon, UploadIcon } from '../icons';
import AppDateInput from '../components/AppDateInput';

const UserRegistration = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>('Normal User');
    const [customRoleId, setCustomRoleId] = useState('');
    const [managerId, setManagerId] = useState('');
    const [teamLeadId, setTeamLeadId] = useState('');
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [parentRoleName, setParentRoleName] = useState<string | null>(null);
    const [parentRoleUsers, setParentRoleUsers] = useState<any[]>([]);
    const [customRoles, setCustomRoles] = useState<Role[]>([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [sameAsPhone, setSameAsPhone] = useState(false);
    const [graduation, setGraduation] = useState('');
    const [dob, setDob] = useState('');
    const [age, setAge] = useState('');
    const [familyDetails, setFamilyDetails] = useState<{ name: string, relation: string }[]>([]);
    const [panCard, setPanCard] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);
    const [, setProfilePhoto] = useState('');
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        api.getRoles().then(roles => {
            setCustomRoles(roles.filter((r: Role) => !r.isBuiltIn));
            setAllRoles(roles);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (id) {
            setLoading(true);
            api.getUserById(id).then(user => {
                setName(user.name);
                setUsername(user.username);
                setEmail(user.email);
                setRole(user.role);
                setCustomRoleId(user.customRoleId || '');
                if (user.customRoleId) {
                }
                setManagerId(user.managerId?._id || user.managerId || '');
                setTeamLeadId(user.teamLeadId?._id || user.teamLeadId || '');
                setPhone(user.phone || '');
                setCompanyPhone(user.companyPhone || '');
                setWhatsapp(user.whatsapp || '');
                setGraduation(user.graduation || '');
                setDob(user.dob ? user.dob.split('T')[0] : '');
                setFamilyDetails(user.familyDetails || []);
                setPanCard(user.panCard || '');
                setIfscCode(user.ifscCode || '');
                setAccountNo(user.accountNo || '');
                setBankName(user.bankName || '');
                setUpiId(user.upiId || '');
                setProfilePhoto(user.profilePhoto || '');
                if (user.profilePhoto) setPreviewUrl(`${BASE_URL}${user.profilePhoto}`);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [id, customRoles]);

    useEffect(() => {
        const selectedRoleObj = allRoles.find(r => r.name === role);
        if (selectedRoleObj && selectedRoleObj.reportsTo) {
            const parentRole = selectedRoleObj.reportsTo;
            setParentRoleName(parentRole);
            api.getUsers(parentRole).then(setParentRoleUsers).catch(console.error);
        } else {
            setParentRoleName(null);
            setParentRoleUsers([]);
        }
    }, [role, allRoles]);

    useEffect(() => {
        if (sameAsPhone) setWhatsapp(phone);
    }, [sameAsPhone, phone]);

    useEffect(() => {
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let ageVal = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ageVal--;
            setAge(ageVal.toString());
        }
    }, [dob]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!e.currentTarget.checkValidity()) {
            e.stopPropagation();
            setWasValidated(true);
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        setWasValidated(true);

        if ((!id || password) && password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('username', username);
            formData.append('email', email);
            formData.append('role', role);
            if (customRoleId) formData.append('customRoleId', customRoleId);
            if (password) formData.append('password', password);
            if (parentRoleName === 'Team Lead' && teamLeadId) {
                formData.append('teamLeadId', teamLeadId);
            } else if (parentRoleName && managerId) {
                formData.append('managerId', managerId);
            }
            formData.append('phone', phone);
            formData.append('companyPhone', companyPhone);
            formData.append('whatsapp', whatsapp);
            formData.append('graduation', graduation);
            formData.append('dob', dob);
            formData.append('familyDetails', JSON.stringify(familyDetails));
            formData.append('panCard', panCard);
            formData.append('accountNo', accountNo);
            formData.append('ifscCode', ifscCode);
            formData.append('bankName', bankName);
            formData.append('upiId', upiId);
            
            if (profilePhotoFile) {
                formData.append('profilePhoto', profilePhotoFile);
            }

            if (id) {
                await api.updateUser(id, formData);
                showToast('User updated successfully', 'success');
            } else {
                await api.register(formData);
                showToast('User registered successfully', 'success');
            }
            setIsDirty(false);
            navigate('/users');
        } catch (error) {
            showToast('Error: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
    };

    return (
        <div className="fade-in user-reg-page">
            <div className="glass-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading user details...</div>
                    </div>
                ) : (
                    <>
                        <div className="registration-header-premium">
                            <div className="registration-title-group">
                                <div className="registration-icon-wrapper">
                                    <UsersIcon size={26} />
                                </div>
                                <div>
                                    <h1 className="registration-main-title">
                                        {id ? 'Update Profile' : 'User Registration'}
                                    </h1>
                                    <p className="registration-subtitle">{id ? 'Modify user information and platform permissions.' : 'Create a new system user or employee profile.'}</p>
                                </div>
                            </div>
                            
                            <div className="profile-upload-premium">
                                <div 
                                    className="profile-avatar-editable"
                                    style={{ backgroundImage: previewUrl ? `url(${previewUrl})` : 'none' }}
                                    onClick={() => document.getElementById('profilePhoto')?.click()}
                                >
                                    {!previewUrl && <UserIcon size={32} className="avatar-placeholder-svg" />}
                                    <div className="avatar-edit-overlay">
                                        <UploadIcon size={18} />
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    id="profilePhoto" 
                                    hidden 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setProfilePhotoFile(file);
                                            setPreviewUrl(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <span className="upload-label-text">Profile Photo</span>
                            </div>
                        </div>

                        <div className="registration-content-scrollable">
                            <form onChange={() => setIsDirty(true)} onSubmit={handleSubmit} className={`registration-form-premium ${wasValidated ? 'was-validated' : ''}`} noValidate>
                                
                                {/* SECTION 1: IDENTITY & ROLE */}
                                <div className="registration-section">
                                    <div className="section-header-modern">
                                        <UserIcon size={16} />
                                        <span>Identity & Role</span>
                                    </div>
                                    
                                    <div className="modern-grid-2">
                                        <div className="modern-input-group">
                                            <label>Full Name</label>
                                            <div className="input-with-icon-modern">
                                                <UserIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. John Doe"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Username</label>
                                            <div className="input-with-icon-modern">
                                                <BriefcaseIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="johndoe123"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Email Address</label>
                                            <div className="input-with-icon-modern">
                                                <MailIcon size={18} />
                                                <input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Assign Role</label>
                                            <div className="input-with-icon-modern">
                                                <UsersIcon size={18} />
                                                <select
                                                    value={customRoleId || role}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const isCustom = customRoles.some(cr => cr._id === val);
                                                        if (isCustom) {
                                                            setCustomRoleId(val);
                                                            const crole = customRoles.find(cr => cr._id === val);
                                                            setRole(crole ? crole.name : 'Normal User');
                                                        } else {
                                                            setCustomRoleId('');
                                                            setRole(val);
                                                        }
                                                    }}
                                                >
                                                    <optgroup label="Default Roles">
                                                        <option value="Admin">Admin</option>
                                                        <option value="HR">HR</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Team Lead">Team Lead</option>
                                                        <option value="Recruiter">Recruiter</option>
                                                        <option value="Normal User">Normal User</option>
                                                    </optgroup>
                                                    {customRoles.length > 0 && (
                                                        <optgroup label="Custom Roles">
                                                            {customRoles.map(cr => (
                                                                <option key={cr._id} value={cr._id}>{cr.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {parentRoleName && (
                                            <div className="modern-input-group">
                                                <label>Assign {parentRoleName}</label>
                                                <div className="input-with-icon-modern">
                                                    <UserIcon size={18} />
                                                    <select
                                                        value={parentRoleName === 'Team Lead' ? teamLeadId : managerId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (parentRoleName === 'Team Lead') {
                                                                setTeamLeadId(val);
                                                                setManagerId('');
                                                            } else {
                                                                setManagerId(val);
                                                                setTeamLeadId('');
                                                            }
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Select {parentRoleName}</option>
                                                        {parentRoleUsers.map(u => (
                                                            <option key={u._id} value={u._id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 2: PERSONAL DETAILS */}
                                <div className="registration-section">
                                    <div className="section-header-modern">
                                        <PhoneIcon size={16} />
                                        <span>Personal Information</span>
                                    </div>
                                    
                                    <div className="modern-grid-2">
                                        <div className="modern-input-group">
                                            <label>Personal Contact</label>
                                            <div className="input-with-icon-modern">
                                                <PhoneIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="+91 ..."
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Company Phone</label>
                                            <div className="input-with-icon-modern">
                                                <PhoneIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="+91 ..."
                                                    value={companyPhone}
                                                    onChange={(e) => setCompanyPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <label>WhatsApp</label>
                                                <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                                    <input type="checkbox" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} /> Same as Phone
                                                </label>
                                            </div>
                                            <div className="input-with-icon-modern">
                                                <PhoneIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="+91 ..."
                                                    value={whatsapp}
                                                    onChange={(e) => setWhatsapp(e.target.value)}
                                                    disabled={sameAsPhone}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Date of Birth</label>
                                            <AppDateInput
                                                value={dob}
                                                onChange={(e) => setDob(e.target.value)}
                                            />
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Age (Auto)</label>
                                            <div className="input-with-icon-modern">
                                                <CalendarIcon size={18} />
                                                <input
                                                    type="text"
                                                    className="input-readonly"
                                                    value={age}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Education</label>
                                            <div className="input-with-icon-modern">
                                                <BriefcaseIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. B.Tech"
                                                    value={graduation}
                                                    onChange={(e) => setGraduation(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group full-width-modern">
                                            <div className="family-header-modern">
                                                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>Family Details</label>
                                                <button type="button" onClick={() => setFamilyDetails([...familyDetails, { name: '', relation: 'Father' }])} className="btn-add-modern">
                                                    <PlusIcon size={14} /> Add Person
                                                </button>
                                            </div>
                                            <div className="family-grid-modern">
                                                {familyDetails.map((f, i) => (
                                                    <div key={i} className="family-row-modern">
                                                        <div className="input-with-icon-modern" style={{ flex: 1 }}>
                                                            <UserIcon size={16} />
                                                            <input type="text" placeholder="Name" value={f.name} onChange={(e) => {
                                                                const newF = [...familyDetails];
                                                                newF[i].name = e.target.value;
                                                                setFamilyDetails(newF);
                                                            }} />
                                                        </div>
                                                        <select className="modern-select-sm" value={f.relation} onChange={(e) => {
                                                            const newF = [...familyDetails];
                                                            newF[i].relation = e.target.value;
                                                            setFamilyDetails(newF);
                                                        }}>
                                                            <option>Father</option>
                                                            <option>Mother</option>
                                                            <option>Spouse</option>
                                                            <option>Brother</option>
                                                            <option>Sister</option>
                                                            <option>Son</option>
                                                            <option>Daughter</option>
                                                            <option>Other</option>
                                                        </select>
                                                        <button type="button" onClick={() => setFamilyDetails(familyDetails.filter((_, idx) => idx !== i))} className="btn-remove-modern">
                                                            <TrashIcon size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {familyDetails.length === 0 && <p className="empty-info-text">No family details added.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: FINANCIAL DETAILS */}
                                <div className="registration-section">
                                    <div className="section-header-modern">
                                        <FileTextIcon size={16} />
                                        <span>Financial Information</span>
                                    </div>
                                    
                                    <div className="modern-grid-2">
                                        <div className="modern-input-group">
                                            <label>Bank Name</label>
                                            <div className="input-with-icon-modern">
                                                <BriefcaseIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. HDFC Bank"
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>Account Number</label>
                                            <div className="input-with-icon-modern">
                                                <FileTextIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 50100..."
                                                    value={accountNo}
                                                    onChange={(e) => setAccountNo(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>IFSC Code</label>
                                            <div className="input-with-icon-modern">
                                                <ShieldIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="HDFC000..."
                                                    value={ifscCode}
                                                    onChange={(e) => setIfscCode(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group">
                                            <label>PAN Card</label>
                                            <div className="input-with-icon-modern">
                                                <FileTextIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="ABCDE1234F"
                                                    value={panCard}
                                                    onChange={(e) => setPanCard(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="modern-input-group full-width-modern">
                                            <label>UPI ID</label>
                                            <div className="input-with-icon-modern">
                                                <ShieldIcon size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="username@bank"
                                                    value={upiId}
                                                    onChange={(e) => setUpiId(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: SECURITY */}
                                <div className="registration-section" style={{ marginBottom: '2rem' }}>
                                    <div className="section-header-modern">
                                        <ShieldIcon size={16} />
                                        <span>Security Credentials</span>
                                    </div>
                                    
                                    <div className="modern-grid-2">
                                        <div className="modern-input-group">
                                            <label>Password</label>
                                            <div className="input-with-icon-modern">
                                                <ShieldIcon size={18} />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder={id ? "•••••••• (Keep Current)" : "••••••••"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required={!id}
                                                />
                                                <button
                                                    type="button"
                                                    className="password-reveal-btn"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="modern-input-group">
                                            <label>Confirm Password</label>
                                            <div className="input-with-icon-modern">
                                                <ShieldIcon size={18} />
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder={id ? "•••••••• (Keep Current)" : "••••••••"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required={!id}
                                                />
                                                <button
                                                    type="button"
                                                    className="password-reveal-btn"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="registration-footer-premium">
                            <button
                                type="button"
                                className="btn-modern-secondary"
                                onClick={() => {
                                    if (!isDirty || window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                                        navigate('/users');
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn-modern-primary"
                                onClick={() => (document.querySelector('form') as HTMLFormElement)?.requestSubmit()}
                            >
                                {id ? 'Save Changes' : 'Complete Registration'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserRegistration;
