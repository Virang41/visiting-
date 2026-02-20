import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdSearch, MdFilterList } from 'react-icons/md';

export default function CheckLog() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [type, setType] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/checkins', { params: { type, from, to } });
            setLogs(res.data.logs); setTotal(res.data.total);
        } catch (err) { toast.error('Failed to load logs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [type, from, to]);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>📋 Check-In/Out <span style={{ color: 'var(--accent-primary)' }}>Logs</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} records</p>
                </div>
                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <select className="form-select" style={{ width: 180 }} value={type} onChange={e => setType(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="check-in">Check In</option>
                            <option value="check-out">Check Out</option>
                        </select>
                        <input type="date" className="form-input" style={{ width: 160 }} value={from} onChange={e => setFrom(e.target.value)} />
                        <input type="date" className="form-input" style={{ width: 160 }} value={to} onChange={e => setTo(e.target.value)} />
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr><th>Visitor</th><th>Type</th><th>Time</th><th>Location</th><th>Method</th><th>Scanned By</th></tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0
                                            ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><p>No logs found</p></div></td></tr>
                                            : logs.map(log => (
                                                <tr key={log._id}>
                                                    <td>
                                                        <div className="visitor-cell">
                                                            <div className="visitor-avatar-sm">
                                                                {log.visitor?.photo ? <img src={`http://localhost:5000${log.visitor.photo}`} alt="" /> : log.visitor?.name?.[0]}
                                                            </div>
                                                            <div><div className="visitor-name">{log.visitor?.name}</div><div className="visitor-email">{log.visitor?.email}</div></div>
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge badge-${log.type === 'check-in' ? 'green' : 'yellow'}`}>{log.type}</span></td>
                                                    <td style={{ fontSize: 13 }}>
                                                        <div>{new Date(log.timestamp).toLocaleDateString('en-IN')}</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{log.location}</td>
                                                    <td><span className={`badge badge-${log.method === 'qr_scan' ? 'purple' : 'blue'}`}>{log.method}</span></td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{log.scannedBy?.name || '—'}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
