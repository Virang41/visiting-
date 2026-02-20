import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdBadge, MdDownload } from 'react-icons/md';

const statusBadge = (s) => {
    const map = { approved: 'green', pending: 'yellow', rejected: 'red', completed: 'blue', cancelled: 'gray' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
};

export default function AppointmentList() {
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState('');
    const [total, setTotal] = useState(0);
    const [issuing, setIssuing] = useState(null);

    const fetch = async () => {
        try {
            const res = await api.get('/appointments', { params: { status } });
            setAppointments(res.data.appointments); setTotal(res.data.total);
        } catch (err) { toast.error('Failed'); }
    };

    useEffect(() => { fetch(); }, [status]);

    const issuePass = async (id) => {
        setIssuing(id);
        try {
            await api.post(`/passes/issue/${id}`);
            toast.success('Pass issued!'); fetch();
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setIssuing(null); }
    };

    const updateStatus = async (id, s) => {
        try { await api.put(`/appointments/${id}/status`, { status: s }); toast.success('Updated'); fetch(); }
        catch (err) { toast.error('Error'); }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>📅 All <span style={{ color: 'var(--accent-primary)' }}>Appointments</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} total</p>
                </div>
                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <select className="form-select" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">All Status</option>
                            {['pending', 'approved', 'rejected', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {appointments.length === 0
                                        ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📅</div><p>No appointments</p></div></td></tr>
                                        : appointments.map(a => (
                                            <tr key={a._id}>
                                                <td><div className="visitor-cell"><div className="visitor-avatar-sm">{a.visitor?.name?.[0]}</div><div><div className="visitor-name">{a.visitor?.name}</div><div className="visitor-email">{a.visitor?.email}</div></div></div></td>
                                                <td><div style={{ fontWeight: 500 }}>{a.host?.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.host?.department}</div></td>
                                                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.purpose}</td>
                                                <td><div style={{ fontWeight: 500 }}>{new Date(a.scheduledDate).toLocaleDateString('en-IN')}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.scheduledTime}</div></td>
                                                <td>{statusBadge(a.status)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {a.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => updateStatus(a._id, 'approved')}>Approve</button>}
                                                        {a.status === 'approved' && <button className="btn btn-primary btn-sm" onClick={() => issuePass(a._id)} disabled={issuing === a._id}><MdBadge /> {issuing === a._id ? '...' : 'Issue Pass'}</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
