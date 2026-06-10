export const BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`;

const API_URL = `${BASE_URL}/api/users`;

const getHeaders = (isFormData = false) => {
    const headers: any = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user._id) {
                headers['User-Id'] = user._id;
            }
        } catch (e) {
            console.error('Error parsing user from storage', e);
        }
    }
    return headers;
};

const handleResponse = async (response: Response, defaultError: string) => {
    if (!response.ok) {
        const text = await response.text();
        if (response.status === 401) {
            try {
                const data = JSON.parse(text);
                if (data.message && (data.message.toLowerCase().includes("session") || data.message.toLowerCase().includes("login"))) {
                    localStorage.removeItem('user');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } catch (e) { }
        }
        try {
            const data = JSON.parse(text);
            throw new Error(data.message || data.error || defaultError);
        } catch (e) {
            throw new Error(`${defaultError} (${response.status}): ${text || response.statusText}`);
        }
    }
    return response.json();
};

export const api = {
    register: async (data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });

        return handleResponse(response, 'Registration failed');
    },

    login: async (credentials: any) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(credentials)
        });

        return handleResponse(response, 'Login failed');
    },

    getUsers: async (role?: string) => {
        const url = role ? `${API_URL}?role=${encodeURIComponent(role)}` : API_URL;
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to fetch users');
    },

    getUserById: async (id: string) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to fetch user');
    },

    updateUser: async (id: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data)
        });

        return handleResponse(response, 'Failed to update user');
    },

    changePassword: async (id: string, oldPassword: string, newPassword: string) => {
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ userId: id, oldPassword, newPassword })
        });
        
        return handleResponse(response, 'Failed to change password');
    },

    deleteUser: async (id: string) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to delete user');
    },

    bulkDeleteUsers: async (ids: string[]) => {
        const response = await fetch(`${API_URL}/bulk-delete`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids })
        });

        return handleResponse(response, 'Bulk delete failed');
    },

    logout: async (id: string) => {
        const response = await fetch(`${API_URL}/logout/${id}`, {
            method: 'POST',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to logout');
    },

    // Candidate ATS System
    getCandidates: async (params?: any) => {
        const url = new URL(`${BASE_URL}/api/candidates`);
        
        // Support both old boolean argument and new params object
        if (typeof params === 'boolean') {
            url.searchParams.append('isApproved', params.toString());
        } else if (params && typeof params === 'object') {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) {
                    url.searchParams.append(key, params[key].toString());
                }
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to fetch candidates');
    },

    getCandidateById: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to fetch candidate');
    },

    createCandidate: async (data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${BASE_URL}/api/candidates`, {
            method: 'POST',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });

        return handleResponse(response, 'Failed to create candidate');
    },

    updateCandidate: async (id: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
            method: 'PATCH',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });

        return handleResponse(response, 'Failed to update candidate');
    },

    deleteCandidate: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to delete candidate');
    },

    bulkDeleteCandidates: async (ids: string[]) => {
        const response = await fetch(`${BASE_URL}/api/candidates/bulk-delete`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });

        return handleResponse(response, 'Bulk delete failed');
    },

    bulkUpdateRecruiter: async (ids: string[], recruiterId: string, taskDetails?: any) => {
        const response = await fetch(`${BASE_URL}/api/candidates/bulk-switch-recruiter`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids, recruiterId, taskDetails }),
        });

        return handleResponse(response, 'Bulk recruiter update failed');
    },

    sendBulkEmail: async (ids: string[] | 'all', subject: string, content: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/send-email`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids, subject, content }),
        });

        return handleResponse(response, 'Email send failed');
    },

    approveCandidate: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/${id}/approve`, {
            method: 'PUT',
            headers: getHeaders(),
        });

        return handleResponse(response, 'Approve failed');
    },

    checkDuplicateCandidate: async (field: string, value: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/check-duplicate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ field, value }),
        });

        return handleResponse(response, 'Duplicate check failed');
    },

    requestProfileUpdate: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/candidates/${id}/request-update`, {
            method: 'POST',
            headers: getHeaders(),
        });

        return handleResponse(response, 'Failed to send profile update request');
    },

    // Dropdown Options Management
    getOptions: async () => {
        const response = await fetch(`${BASE_URL}/api/options`, {
            method: 'GET',
            headers: getHeaders()
        });

        return handleResponse(response, 'Failed to fetch options');
    },

    addOption: async (data: { category: string, value: string }) => {
        const response = await fetch(`${BASE_URL}/api/options`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        return handleResponse(response, 'Failed to add option');
    },

    // Jobs
    getJobs: async (filters?: { status?: string, type?: string, company?: string }) => {
        const query = new URLSearchParams(filters as any).toString();
        const response = await fetch(`${BASE_URL}/api/jobs?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch jobs');
    },

    getJobById: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/jobs/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch job');
    },

    createJob: async (data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${BASE_URL}/api/jobs`, {
            method: 'POST',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to create job');
    },

    updateJob: async (id: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${BASE_URL}/api/jobs/${id}`, {
            method: 'PUT',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update job');
    },

    emailCandidatesForJob: async (id: string, payload: { subject: string, message: string, candidateId?: string, candidateIds?: string[] }) => {
        const response = await fetch(`${BASE_URL}/api/jobs/${id}/email-candidates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response, 'Failed to send emails');
    },

    shareCandidatesWithHR: async (id: string, payload: { hrEmail: string, subject: string, message: string }) => {
        const response = await fetch(`${BASE_URL}/api/jobs/${id}/share-hr`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response, 'Failed to share candidates with HR');
    },

    deleteJob: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/jobs/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete job');
    },

    bulkDeleteJobs: async (ids: string[]) => {
        const response = await fetch(`${BASE_URL}/api/jobs/bulk-delete`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        return handleResponse(response, 'Bulk delete failed');
    },

    // Templates
    getTemplates: async () => {
        const response = await fetch(`${BASE_URL}/api/templates`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch templates');
    },

    getTemplateById: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/templates/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch template');
    },

    createTemplate: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/templates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to create template');
    },

    updateTemplate: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/templates/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update template');
    },

    deleteTemplate: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/templates/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete template');
    },

    // Interviews
    getInterviews: async (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/api/interviews?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch interviews');
    },

    getInterviewById: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch interview');
    },

    scheduleInterview: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/interviews`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to schedule interview');
    },

    updateInterview: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update interview');
    },

    deleteInterview: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to cancel interview');
    },

    // Offers
    getOffers: async () => {
        const response = await fetch(`${BASE_URL}/api/offers`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch offers');
    },

    createOffer: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/offers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to create offer');
    },

    updateOffer: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/offers/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update offer');
    },

    deleteOffer: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/offers/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete offer');
    },

    bulkDeleteOffers: async (ids: string[]) => {
        const response = await fetch(`${BASE_URL}/api/offers/bulk-delete`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids }),
        });
        return handleResponse(response, 'Bulk delete failed');
    },

    deletePayroll: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/payroll/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete payroll');
    },

    // Attendance
    punchIn: async () => {
        const response = await fetch(`${BASE_URL}/api/attendance/punch-in`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, 'Punch in failed');
    },

    punchOut: async () => {
        const response = await fetch(`${BASE_URL}/api/attendance/punch-out`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, 'Punch out failed');
    },

    getAttendance: async (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/api/attendance?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch attendance');
    },

    getMyAttendance: async (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/api/attendance/my-history?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch attendance history');
    },

    deleteAttendance: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/attendance/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete attendance record');
    },

    addAttendance: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/attendance`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to add attendance record');
    },

    // Leaves
    applyLeave: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/leaves/apply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Leave application failed');
    },

    getLeaves: async (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/api/leaves?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch leaves');
    },

    getMyLeaves: async () => {
        const response = await fetch(`${BASE_URL}/api/leaves/my-leaves`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch leaves');
    },

    getLeaveBalance: async () => {
        const response = await fetch(`${BASE_URL}/api/leaves/balance`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch balance');
    },

    updateLeaveStatus: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/leaves/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update leave');
    },

    deleteLeave: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/leaves/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete leave request');
    },

    // Payroll
    generatePayroll: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/payroll/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Payroll generation failed');
    },

    getPayrolls: async (filters?: any) => {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/api/payroll?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch payrolls');
    },

    updatePayrollStatus: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/payroll/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update payroll');
    },

    downloadPayrollPdf: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/payroll/${id}/pdf`, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to download PDF (${response.status}): ${text}`);
        }
        return response.blob();
    },

    // System Settings
    getSettings: async () => {
        const response = await fetch(`${BASE_URL}/api/settings`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch settings');
    },

    updateSettings: async (settingsData: any) => {
        const response = await fetch(`${BASE_URL}/api/settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(settingsData)
        });
        return handleResponse(response, 'Failed to update settings');
    },

    // Chat Module
    getChatUsers: async () => {
        const response = await fetch(`${BASE_URL}/api/chat/users`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch chat users');
    },

    getChatHistory: async (otherUserId: string) => {
        const response = await fetch(`${BASE_URL}/api/chat/history/${otherUserId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch chat history');
    },

    // Operations
    getOperations: async () => {
        const response = await fetch(`${BASE_URL}/api/operations`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch operations');
    },

    assignToOperation: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/operations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to assign candidate to operations');
    },

    // Tasks Management
    getTasks: async (filters?: any) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        const response = await fetch(`${BASE_URL}/api/tasks?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch tasks');
    },

    createTask: async (taskData: any) => {
        const response = await fetch(`${BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(response, 'Failed to create task');
    },

    updateTask: async (id: string, taskData: any) => {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(response, 'Failed to update task');
    },

    deleteTask: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete task');
    },

    // Notifications
    getNotifications: async () => {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch notifications');
    },

    markNotificationAsRead: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to mark notification as read');
    },

    markAllNotificationsAsRead: async () => {
        const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to mark all as read');
    },
    
    deleteNotification: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete notification');
    },

    clearAllNotifications: async () => {
        const response = await fetch(`${BASE_URL}/api/notifications`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to clear all notifications');
    },

    // File Management
    getFolders: async (parentFolder?: string | null) => {
        const url = parentFolder ? `${BASE_URL}/api/folders?parentFolder=${parentFolder}` : `${BASE_URL}/api/folders`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch folders');
    },

    createFolder: async (name: string, parentFolder?: string | null) => {
        const response = await fetch(`${BASE_URL}/api/folders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, parentFolder })
        });
        return handleResponse(response, 'Failed to create folder');
    },

    getFiles: async (folderId?: string | null, tag?: string) => {
        let url = `${BASE_URL}/api/files`;
        const params = new URLSearchParams();
        if (folderId) params.append('folderId', folderId);
        if (tag) params.append('tag', tag);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch files');
    },

    uploadFile: async (formData: FormData) => {
        const response = await fetch(`${BASE_URL}/api/files`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });
        return handleResponse(response, 'Failed to upload file');
    },

    uploadFileVersion: async (fileId: string, formData: FormData) => {
        const response = await fetch(`${BASE_URL}/api/files/${fileId}/versions`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });
        return handleResponse(response, 'Failed to upload new version');
    },

    deleteFile: async (fileId: string) => {
        const response = await fetch(`${BASE_URL}/api/files/${fileId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete file');
    },

    // AI Features
    parseResume: async (file: File) => {
        const formData = new FormData();
        formData.append('resume', file);
        const response = await fetch(`${BASE_URL}/api/candidates/parse-resume`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });
        return handleResponse(response, 'Failed to parse resume');
    },

    scoreCandidate: async (candidateId: string, jobId: string) => {
        const response = await fetch(`${BASE_URL}/api/ai/score`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ candidateId, jobId })
        });
        return handleResponse(response, 'Failed to score candidate');
    },

    askAssistant: async (query: string) => {
        const response = await fetch(`${BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ query })
        });
        return handleResponse(response, 'AI Assistant failed');
    },
    
    getCompanySuggestions: async (candidateData: any, openJobs: any[], mode: 'global' | 'openJobs') => {
        const response = await fetch(`${BASE_URL}/api/ai/suggest-companies`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ candidateData, openJobs, mode })
        });
        return handleResponse(response, 'Failed to get AI suggestions');
    },

    generateResume: async (candidateId: string) => {
        const response = await fetch(`${BASE_URL}/api/ai/generate-resume`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ candidateId })
        });
        if (!response.ok) {
            const text = await response.text();
            let errorMsg = `Error (${response.status})`;
            try {
                const json = JSON.parse(text);
                if (json.error) errorMsg = json.error;
            } catch {
                if (text) errorMsg = text;
            }
            throw new Error(errorMsg);
        }
        return response.blob();
    },
    generateCustomResume: async (candidateId: string) => {
        const response = await fetch(`${BASE_URL}/api/ai/generate-custom-resume`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ candidateId })
        });
        if (!response.ok) {
            const text = await response.text();
            let errorMsg = `Error (${response.status})`;
            try {
                const json = JSON.parse(text);
                if (json.error) errorMsg = json.error;
            } catch {
                if (text) errorMsg = text;
            }
            throw new Error(errorMsg);
        }
        return response.blob();
    },

    // Task Comments
    getTaskComments: async (taskId: string) => {
        const response = await fetch(`${BASE_URL}/api/tasks/${taskId}/comments`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch comments');
    },

    addTaskComment: async (taskId: string, content: string) => {
        const response = await fetch(`${BASE_URL}/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(response, 'Failed to add comment');
    },

    // Dashboard Stats
    getDashboardStats: async (filters?: any) => {
        const query = filters ? new URLSearchParams(filters).toString() : '';
        const response = await fetch(`${BASE_URL}/api/dashboard/stats?${query}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch dashboard stats');
    },

    // Call History
    getCallHistory: async () => {
        const response = await fetch(`${BASE_URL}/api/call-history`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch call history');
    },

    createCall: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/call-history`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to create call');
    },

    getTodaysBirthdays: async () => {
        const response = await fetch(`${BASE_URL}/api/users/birthdates/today`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch today\'s birthdays');
    },

    getUpcomingBirthdays: async () => {
        const response = await fetch(`${BASE_URL}/api/users/birthdates/upcoming`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch upcoming birthdays');
    },

    bulkCreateCalls: async (list: any[]) => {
        const response = await fetch(`${BASE_URL}/api/call-history/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ list })
        });
        return handleResponse(response, 'Failed to import calls');
    },

    updateCall: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/call-history/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update call');
    },

    deleteCall: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/call-history/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete call');
    },

    // Roles
    getRoles: async () => {
        const response = await fetch(`${BASE_URL}/api/roles`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch roles');
    },

    getRoleById: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/roles/${id}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to fetch role');
    },

    createRole: async (data: any) => {
        const response = await fetch(`${BASE_URL}/api/roles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to create role');
    },

    updateRole: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/api/roles/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response, 'Failed to update role');
    },

    deleteRole: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/roles/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to delete role');
    },

    resetRole: async (id: string) => {
        const response = await fetch(`${BASE_URL}/api/roles/${id}/reset`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response, 'Failed to reset role');
    }
};
