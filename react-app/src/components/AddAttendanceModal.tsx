import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AddAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddAttendanceModal: React.FC<AddAttendanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        inTime: '',
        outTime: '',
        status: 'Present'
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userId || !formData.date || !formData.inTime) {
            showToast('Please fill required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            const dateStr = formData.date;
            const inTimeISO = new Date(`${dateStr}T${formData.inTime}`).toISOString();
            const outTimeISO = formData.outTime ? new Date(`${dateStr}T${formData.outTime}`).toISOString() : undefined;

            await api.addAttendance({
                userId: formData.userId,
                date: formData.date,
                inTime: inTimeISO,
                outTime: outTimeISO,
                status: formData.status
            });

            showToast('Attendance added successfully', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Failed to add attendance', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Manual Attendance" 
            subtitle="Record manual entry for an employee"
            size="md"
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Entry'}
                    </button>
                </>
            }
        >
            <div className="modal-form-grid">
                <div className="input-group full-width">
                    <label className="input-label">Select Employee</label>
                    <select 
                        value={formData.userId} 
                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                        className="input-field"
                        required
                    >
                        <option value="">-- Select Employee --</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.employeeId || 'No ID'})</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Date</label>
                    <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="input-field"
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Status</label>
                    <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="input-field"
                    >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Absent">Absent</option>
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Punch In Time</label>
                    <input 
                        type="time" 
                        value={formData.inTime}
                        onChange={(e) => setFormData({...formData, inTime: e.target.value})}
                        className="input-field"
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Punch Out Time</label>
                    <input 
                        type="time" 
                        value={formData.outTime}
                        onChange={(e) => setFormData({...formData, outTime: e.target.value})}
                        className="input-field"
                        placeholder="Optional"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AddAttendanceModal;
