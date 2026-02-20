import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { MdCheck, MdClose, MdBadge } from 'react-icons/md';

const statusBadge = (s) => {
    const map = { approved: 'green', pending: 'yellow', rejected: 'red', completed: 'blue', cancelled: 'gray' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
};

export default function MyAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments', { params: { status: statusFilter } });
            setAppointments(res.data.appointments);
        } catch (err) { toast.error('Failed to load appointments'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAppointments(); }, [statusFilter]);

    const updateStatus = async (id, status) => {
        const reason = status === 'rejected' ? prompt('Rejection reason (optional):') : undefined;
        try {
            await api.put(`/appointments/${id}/status`, { status, rejectionReason: reason });
            toast.success(`Appointment ${status}`);
            fetchAppointments();
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    const issuePass = async (apptId) => {
        setIssuing(apptId);
        try {
            const res = await api.post(`/passes/issue/${apptId}`);
            toast.success('🎫 Pass issued successfully!');
            fetchAppointments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to issue pass'); }
        finally { setIssuing(null); }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>📅 My <span style={{ color: 'var(--accent-primary)' }}>Appointments</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Manage visitor appointments assigned to you</p>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <select className="form-select" style={{ width: 200 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            {['pending', 'approved', 'rejected', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                        appointments.length === 0
                            ? <div className="empty-state card"><div className="empty-icon">📅</div><p>No appointments found</p></div>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {appointments.map(a => (
                                    <div key={a._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div className="visitor-avatar-sm" style={{ width: 44, height: 44, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                                            {a.visitor?.photo ? <img src={`http://localhost:5000${a.visitor.photo}`} alt="" /> : a.visitor?.name?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>{a.visitor?.name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                {a.purpose} • {new Date(a.scheduledDate).toLocaleDateString('en-IN')} at {a.scheduledTime}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.location} • {a.visitor?.phone}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {statusBadge(a.status)}
                                            {a.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(a._id, 'approved')}><MdCheck /> Approve</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a._id, 'rejected')}><MdClose /> Reject</button>
                                                </>
                                            )}
                                            {a.status === 'approved' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => issuePass(a._id)} disabled={issuing === a._id}>
                                                    <MdBadge /> {issuing === a._id ? 'Issuing...' : 'Issue Pass'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                    )}
                </div>
            </div>
        </div>
    );
}
