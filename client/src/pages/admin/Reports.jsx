import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdDownload, MdSearch, MdFilterList } from 'react-icons/md';

export default function AdminReports() {
    const [appointments, setAppointments] = useState([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments', { params: filters });
            setAppointments(res.data.appointments); setTotal(res.data.total);
        } catch (err) { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filters]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/dashboard/export', { params: { from: filters.from, to: filters.to }, responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'visitors-report.csv'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported!');
        } catch (err) { toast.error('Export failed'); }
        finally { setExporting(false); }
    };

    const statusBadge = (s) => {
        const map = { approved: 'green', pending: 'yellow', rejected: 'red', completed: 'blue', cancelled: 'gray' };
        return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📊 Reports & <span style={{ color: 'var(--accent-primary)' }}>Analytics</span></h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} records found</p>
                    </div>
                    <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
                        <MdDownload /> {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <div className="search-input-wrap" style={{ flex: 2 }}>
                            <MdSearch className="search-icon" />
                            <input className="form-input search-input" placeholder="Search appointments..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
                        </div>
                        <select className="form-select" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                            <option value="">All Status</option>
                            {['pending', 'approved', 'rejected', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                        <input type="date" className="form-input" style={{ width: 160 }} value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
                        <input type="date" className="form-input" style={{ width: 160 }} value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Date & Time</th><th>Location</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {appointments.length === 0
                                            ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><p>No appointments found</p></div></td></tr>
                                            : appointments.map(a => (
                                                <tr key={a._id}>
                                                    <td>
                                                        <div className="visitor-cell">
                                                            <div className="visitor-avatar-sm">{a.visitor?.name?.[0]}</div>
                                                            <div><div className="visitor-name">{a.visitor?.name}</div><div className="visitor-email">{a.visitor?.email}</div></div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500 }}>{a.host?.name}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.host?.department}</div>
                                                    </td>
                                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.purpose}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 500 }}>{new Date(a.scheduledDate).toLocaleDateString('en-IN')}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.scheduledTime}</div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{a.location}</td>
                                                    <td>{statusBadge(a.status)}</td>
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
