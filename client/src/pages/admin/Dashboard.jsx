import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MdPeople, MdBadge, MdAssignment, MdLogin, MdPendingActions, MdGroups } from 'react-icons/md';

const COLORS = ['#6c63ff', '#e94560', '#10d48e', '#f5a623', '#4facfe'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState({ recentLogs: [], recentAppointments: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/recent')])
            .then(([statsRes, recentRes]) => {
                setStats(statsRes.data.stats);
                setRecent(recentRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="layout">
            <Sidebar />
            <div className="main-content loading-center"><div className="spinner" /></div>
        </div>
    );

    const statCards = [
        { label: 'Total Visitors', value: stats?.totalVisitors || 0, icon: <MdGroups />, color: '#6c63ff', bg: 'rgba(108,99,255,0.15)' },
        { label: 'Today Check-ins', value: stats?.todayCheckins || 0, icon: <MdLogin />, color: '#10d48e', bg: 'rgba(16,212,142,0.15)' },
        { label: 'Today Appointments', value: stats?.todayAppointments || 0, icon: <MdAssignment />, color: '#4facfe', bg: 'rgba(79,172,254,0.15)' },
        { label: 'Pending Approvals', value: stats?.pendingAppointments || 0, icon: <MdPendingActions />, color: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
        { label: 'Active Passes', value: stats?.activePassCount || 0, icon: <MdBadge />, color: '#e94560', bg: 'rgba(233,69,96,0.15)' },
        { label: 'Staff Users', value: stats?.totalUsers || 0, icon: <MdPeople />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' }
    ];

    const statusData = (stats?.statusCounts || []).map(s => ({
        name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
        value: s.count
    }));

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>📊 Admin <span style={{ color: 'var(--accent-primary)' }}>Dashboard</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="page-container" style={{ padding: '28px 32px' }}>
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        {statCards.map(s => (
                            <div key={s.label} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: 24 }}>{s.icon}</div>
                                <div className="stat-info">
                                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="card">
                            <div className="card-title">📈 Visitors (Last 7 Days)</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats?.last7Days || []}>
                                    <XAxis dataKey="date" tick={{ fill: '#9090b0', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e8e8f5' }} />
                                    <Bar dataKey="count" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Check-ins" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card">
                            <div className="card-title">🗂️ Appointment Status Distribution</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid #2a2a4a', borderRadius: 8 }} />
                                    <Legend wrapperStyle={{ fontSize: 12, color: '#9090b0' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="card">
                            <div className="card-title">🚪 Recent Check-ins</div>
                            {recent.recentLogs.length === 0
                                ? <div className="empty-state"><div className="empty-icon">🚶</div><p>No check-ins yet</p></div>
                                : recent.recentLogs.slice(0, 6).map(log => (
                                    <div key={log._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div className="visitor-avatar-sm">
                                            {log.visitor?.photo
                                                ? <img src={`http://localhost:5000${log.visitor.photo}`} alt="" />
                                                : log.visitor?.name?.[0] || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{log.visitor?.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.location} • {new Date(log.timestamp).toLocaleTimeString('en-IN')}</div>
                                        </div>
                                        <span className={`badge badge-${log.type === 'check-in' ? 'green' : 'yellow'}`}>{log.type}</span>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="card">
                            <div className="card-title">📅 Recent Appointments</div>
                            {recent.recentAppointments.length === 0
                                ? <div className="empty-state"><div className="empty-icon">📋</div><p>No appointments yet</p></div>
                                : recent.recentAppointments.map(appt => (
                                    <div key={appt._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div className="visitor-avatar-sm">{appt.visitor?.name?.[0] || '?'}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{appt.visitor?.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                Host: {appt.host?.name} • {new Date(appt.scheduledDate).toLocaleDateString('en-IN')}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${appt.status === 'approved' ? 'green' : appt.status === 'pending' ? 'yellow' :
                                                appt.status === 'rejected' ? 'red' : 'blue'}`}>{appt.status}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
