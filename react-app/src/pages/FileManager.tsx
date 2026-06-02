import React, { useState, useEffect } from 'react';
import { api, BASE_URL } from '../services/api';
import { useLocation } from 'react-router-dom';
import {
    PlusIcon, DatabaseIcon, FileTextIcon, ChevronRightIcon,
    TrashIcon, FilterIcon, SearchIcon, DownloadIcon,
    ClockIcon
} from '../icons';
import Modal from '../components/Modal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

interface Folder {
    _id: string;
    name: string;
    parentFolder: string | null;
}

interface FileVersion {
    versionNumber: number;
    fileUrl: string;
    note: string;
    uploadedBy: { _id: string; name: string };
    uploadedAt: string;
}

interface File {
    _id: string;
    name: string;
    folder: string;
    tags: string[];
    currentVersion: number;
    versions: FileVersion[];
    createdBy: { _id: string; name: string };
    updatedAt: string;
}

const FileManager: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Root' }]);

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadData, setUploadData] = useState({ name: '', tags: '', note: '', file: null as File | null });

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [tagFilter, setTagFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, [currentFolderId, tagFilter]);

    const fetchData = async () => {
        try {
            const folderRes = await api.getFolders(currentFolderId);
            setFolders(folderRes);

            const fileRes = await api.getFiles(currentFolderId, tagFilter);
            setFiles(fileRes);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        try {
            await api.createFolder(newFolderName, currentFolderId);
            setNewFolderName('');
            setIsFolderModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleUploadFile = async () => {
        if (!uploadData.file) return;
        try {
            const formData = new FormData();
            formData.append('file', uploadData.file as any);
            formData.append('name', uploadData.name);
            formData.append('folderId', currentFolderId || '');
            formData.append('tags', uploadData.tags);
            formData.append('note', uploadData.note);

            await api.uploadFile(formData);
            setUploadData({ name: '', tags: '', note: '', file: null });
            setIsUploadModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleUploadVersion = async () => {
        if (!uploadData.file || !selectedFile) return;
        try {
            const formData = new FormData();
            formData.append('file', uploadData.file as any);
            formData.append('note', uploadData.note);

            await api.uploadFileVersion(selectedFile._id, formData);
            setUploadData({ name: '', tags: '', note: '', file: null });
            setIsVersionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error uploading version:', error);
        }
    };

    const navigateToFolder = (folder: Folder) => {
        setCurrentFolderId(folder._id);
        setBreadcrumb([...breadcrumb, { id: folder._id, name: folder.name }]);
    };

    const navigateBreadcrumb = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);
        setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h3 style={{ marginTop: '0rem', marginBottom: '0.25rem' }} className="text-dark">File Manager</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {breadcrumb.map((b, i) => (
                            <React.Fragment key={i}>
                                <span
                                    onClick={() => navigateBreadcrumb(i)}
                                    style={{
                                        cursor: 'pointer',
                                        color: i === breadcrumb.length - 1 ? 'var(--primary)' : 'inherit',
                                        fontWeight: i === breadcrumb.length - 1 ? '700' : '500',
                                        transition: 'color 0.2s'
                                    }}
                                    className="nav-item-hover-simple"
                                >
                                    {b.name}
                                </span>
                                {i < breadcrumb.length - 1 && <span style={{ opacity: 0.5 }}><ChevronRightIcon size={14} /></span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={() => setIsFolderModalOpen(true)}>
                        <PlusIcon size={18} style={{ marginRight: '0.4rem' }} /> New Folder
                    </button>
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} onClick={() => setIsUploadModalOpen(true)}>
                        <PlusIcon size={18} style={{ marginRight: '0.4rem' }} /> Upload File
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }}><SearchIcon size={18} /></span>
                    <input
                        type="text"
                        placeholder="Search files and tags..."
                        className="input-field"
                        style={{ paddingLeft: '2.75rem', background: 'rgba(255,255,255,0.5)' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ position: 'relative', width: '220px' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7, pointerEvents: 'none' }}><FilterIcon size={18} /></span>
                    <select
                        className="input-field"
                        style={{ paddingLeft: '2.75rem', appearance: 'none' }}
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                    >
                        <option value="">All Tags</option>
                        <option value="Draft">Draft</option>
                        <option value="Final">Final</option>
                        <option value="Important">Important</option>
                        <option value="Resume">Resume</option>
                        <option value="Offer">Offer</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.75rem' }}>
                {folders.map(folder => (
                    <div
                        key={folder._id}
                        className="glass-card modern-card nav-item-hover folder-card"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'var(--bg-card)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s ease',
                            border: '1px solid transparent'
                        }}
                        onClick={() => navigateToFolder(folder)}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(0, 120, 198, 0.1), rgba(25, 157, 255, 0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.25rem'
                        }}>
                            <DatabaseIcon size={40} color="var(--primary)" style={{ opacity: 0.8 }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>{folder.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Folder</div>
                        </div>
                    </div>
                ))}

                {filteredFiles.map(file => {
                    const isPDF = file.name.toLowerCase().endsWith('.pdf');
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name.toLowerCase());
                    const fileColor = isPDF ? '#ef4444' : (isImage ? '#10b981' : '#0078C6');

                    return (
                        <div
                            key={file._id}
                            className="glass-card modern-card file-card"
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                background: 'white',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                borderTop: `4px solid ${fileColor}40`
                            }}
                        >
                            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => { setSelectedFile(file); setIsPreviewModalOpen(true); }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '16px',
                                    background: `${fileColor}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1rem auto'
                                }}>
                                    <FileTextIcon size={36} color={fileColor} style={{ opacity: 0.9 }} />
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.4rem', color: 'var(--text-main)' }}>{file.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>v{file.currentVersion}</span>
                                    <span>•</span>
                                    <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '1.5rem', justifyContent: 'center' }}>
                                {file.tags.map(tag => (
                                    <span key={tag} style={{
                                        fontSize: '0.65rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        background: 'rgba(0, 120, 198, 0.08)',
                                        color: 'var(--primary)',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        letterSpacing: '0.025em'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '0.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border)'
                            }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button className="icon-btn-sm" title="New Version" onClick={() => { setSelectedFile(file); setIsVersionModalOpen(true); }}>
                                        <ClockIcon size={16} />
                                    </button>
                                    <button className="icon-btn-sm" title="Download" onClick={() => window.open(`${BASE_URL}${file.versions[file.versions.length - 1].fileUrl}`)}>
                                        <DownloadIcon size={16} />
                                    </button>
                                </div>
                                <button className="icon-btn-sm" style={{ color: '#ef4444' }} title="Delete" onClick={async () => { if (confirm('Delete file?')) { await api.deleteFile(file._id); fetchData(); } }}>
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {folders.length === 0 && filteredFiles.length === 0 && (
                <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', background: 'white' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(0, 120, 198, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        color: 'var(--primary)'
                    }}>
                        <DatabaseIcon size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>No Items Found</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>This folder is empty or matches no search criteria.</p>
                </div>
            )}

            {/* Folder Modal */}
            <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="New Folder"
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsFolderModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleCreateFolder}>Create Folder</button>
                    </div>
                }
            >
                <div className="input-group">
                    <label className="input-label">Folder Name</label>
                    <input
                        type="text"
                        className="input-field"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g. Invoices 2024"
                    />
                </div>
            </Modal>

            {/* Upload Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload File"
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleUploadFile}>Upload File</button>
                    </div>
                }
            >
                <div className="input-group">
                    <label className="input-label">Display Name</label>
                    <input
                        type="text"
                        className="input-field"
                        value={uploadData.name}
                        onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                        placeholder="Enter display name (optional)"
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Tags (comma separated)</label>
                    <input
                        type="text"
                        className="input-field"
                        value={uploadData.tags}
                        onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                        placeholder="e.g. Draft, Important"
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Select File</label>
                    <input
                        type="file"
                        className="input-field"
                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files ? e.target.files[0] as any : null })}
                    />
                </div>
            </Modal>

            {/* New Version Modal */}
            <Modal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} title={`New Version: ${selectedFile?.name}`}
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsVersionModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleUploadVersion}>Upload Version</button>
                    </div>
                }
            >
                <div className="input-group">
                    <label className="input-label">Version Note</label>
                    <textarea
                        className="input-field"
                        rows={3}
                        value={uploadData.note}
                        onChange={(e) => setUploadData({ ...uploadData, note: e.target.value })}
                        placeholder="What changed in this version?"
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Select Updated File</label>
                    <input
                        type="file"
                        className="input-field"
                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files ? e.target.files[0] as any : null })}
                    />
                </div>
            </Modal>

            {/* Preview Modal */}
            {selectedFile && (
                <DocumentPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    fileUrl={`${BASE_URL}${selectedFile.versions[selectedFile.versions.length - 1].fileUrl}`}
                    fileName={selectedFile.name}
                />
            )}
        </div>
    );
};

export default FileManager;
