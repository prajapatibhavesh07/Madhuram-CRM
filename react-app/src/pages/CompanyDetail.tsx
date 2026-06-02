import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    BriefcaseIcon, 
    MapPinIcon, 
    CalendarIcon, 
    UsersIcon, 
    ChevronRightIcon, 
    SearchIcon,
    FilterIcon,
    InfoIcon
} from '../icons';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const ArrowLeftIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

const Building2Icon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/></svg>
);

const GlobeIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);

const CompanyDetail: React.FC = () => {
    const { companyName } = useParams<{ companyName: string }>();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        const fetchCompanyJobs = async () => {
            if (!companyName) return;
            setLoading(true);
            try {
                const data = await api.getJobs({ company: companyName });
                setJobs(data);
            } catch (error) {
                showToast('Failed to load company jobs', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyJobs();
    }, [companyName]);

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openJobsCount = jobs.filter(j => j.status === 'Open').length;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', borderBottom: '2px solid #2563eb', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ marginLeft: '16px', color: '#475569', fontWeight: 500 }}>Loading company details...</span>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="company-detail-page bg-[#f8fafc] min-h-screen">
            {/* Header / Banner */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to="/jobs" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeftIcon size={20} />
                        </Link>
                        <div className="h-16 w-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <Building2Icon size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{companyName}</h1>
                            <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                                <span className="flex items-center gap-1.5"><GlobeIcon size={14} /> Global Enterprise</span>
                                <span className="flex items-center gap-1.5"><UsersIcon size={14} /> 1,000+ Employees</span>
                                <span className="flex items-center gap-1.5"><MapPinIcon size={14} /> Multiple Locations</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 overflow-hidden relative group">
                            <div className="relative z-10">
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Positions</p>
                                <h3 className="text-4xl font-bold">{jobs.length}</h3>
                            </div>
                            <div style={{ position: 'absolute', right: '-16px', bottom: '-16px', opacity: 0.1 }} className="group-hover:scale-110 transition-transform duration-500">
                                <BriefcaseIcon size={120} />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-slate-500 text-sm font-medium mb-1">Currently Hiring</p>
                            <h3 className="text-4xl font-bold text-slate-900">{openJobsCount}</h3>
                            <div className="mt-2 flex items-center gap-2 text-green-600 text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {openJobsCount > 0 ? 'Actively seeking talent' : 'Currently filled'}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-slate-500 text-sm font-medium mb-1">Average Response Time</p>
                            <h3 className="text-4xl font-bold text-slate-900">2.4<span className="text-xl text-slate-400 ml-1">days</span></h3>
                            <div className="mt-2 text-slate-400 text-sm">Fast-track recruitment available</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar - Company Info */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <InfoIcon size={18} style={{ color: '#3b82f6' }} />
                                About the Company
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                {companyName} is a leading innovator in their sector, committed to excellence and professional growth. They foster a diverse and inclusive workplace environment.
                            </p>
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Industry</span>
                                    <span className="text-slate-900 font-medium">Technology / Services</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Founded</span>
                                    <span className="text-slate-900 font-medium">2005</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Website</span>
                                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">www.{companyName?.toLowerCase().replace(/\s+/g, '')}.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Job Feed */}
                    <div className="w-full lg:w-2/3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Associated Job Roles</h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                        <SearchIcon size={16} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search roles..."
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                                    <FilterIcon size={18} />
                                </button>
                            </div>
                        </div>

                        {filteredJobs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                                <div style={{ color: '#e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                    <BriefcaseIcon size={48} />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg">No positions found</h3>
                                <p className="text-slate-500 mt-1">Try adjusting your search criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredJobs.map((job) => (
                                    <div key={job._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <BriefcaseIcon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1.5"><MapPinIcon size={14} /> {job.location}</span>
                                                    <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                                    <span className="font-medium text-slate-700 capitalize">{job.type}</span>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        job.status === 'Open' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                        {job.candidateCount || 0} Applicants
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 group-hover:text-blue-600">
                                            <ChevronRightIcon size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetail;
