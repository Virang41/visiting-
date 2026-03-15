import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MdPeople, MdBadge, MdAssignment, MdLogin, MdPendingActions, MdGroups } from 'react-icons/md';

const PIE_COLORS = ['#6c63ff', '#e94560', '#10d48e', '#f5a623', '#4facfe'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    // dashboard ka data fetch karo - stats aur recent activity
    const loadDashboardData = async () => {
        try {
            const statsRes = await api.get('/dashboard/stats');
            console.log('dashboard stats:', statsRes.data); // checking data

            const recentRes = await api.get('/dashboard/recent');

            setStats(statsRes.data.stats);
            setRecentLogs(recentRes.data.recentLogs || []);
            setRecentAppointments(recentRes.data.recentAppointments || []);
        } catch (err) {
            console.error('Dashboard load nahi hua:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="layout">
                <Sidebar />
                <div className="main-content loading-center">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    // pie chart ke liye appointment status data
    const statusChartData = (stats?.statusCounts || []).map(s => ({
        name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
        value: s.count
    }));

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                {/* header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid var(--border-col)',
                    background: 'var(--sidebar-bg)',
                    position: 'sticky', top: 0, zIndex: 50
                }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>
                        📊 Admin <span style={{ color: 'var(--purple)' }}>Dashboard</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--txt-dim)', marginTop: 4 }}>
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </p>
                </div>

                <div style={{ padding: '28px 32px' }}>
                    {/* stats cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)', color: '#6c63ff', fontSize: 24 }}>
                                <MdGroups />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#6c63ff' }}>{stats?.totalVisitors || 0}</div>
                                <div className="stat-label">Total Visitors</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(16,212,142,0.15)', color: '#10d48e', fontSize: 24 }}>
                                <MdLogin />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#10d48e' }}>{stats?.todayCheckins || 0}</div>
                                <div className="stat-label">Today Check-ins</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(79,172,254,0.15)', color: '#4facfe', fontSize: 24 }}>
                                <MdAssignment />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#4facfe' }}>{stats?.todayAppointments || 0}</div>
                                <div className="stat-label">Today Appointments</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', fontSize: 24 }}>
                                <MdPendingActions />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#f5a623' }}>{stats?.pendingAppointments || 0}</div>
                                <div className="stat-label">Pending Approvals</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(233,69,96,0.15)', color: '#e94560', fontSize: 24 }}>
                                <MdBadge />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#e94560' }}>{stats?.activePassCount || 0}</div>
                                <div className="stat-label">Active Passes</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 24 }}>
                                <MdPeople />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value" style={{ color: '#a78bfa' }}>{stats?.totalUsers || 0}</div>
                                <div className="stat-label">Staff Users</div>
                            </div>
                        </div>
                    </div>

                    {/* charts */}
                    <div className="charts-grid">
                        <div className="card">
                            <div className="card-title">📈 Visitors Last 7 Days</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats?.last7Days || []}>
                                    <XAxis dataKey="date" tick={{ fill: '#9090b0', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a35', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e8e8f5' }}
                                    />
                                    <Bar dataKey="count" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Check-ins" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card">
                            <div className="card-title">🗂️ Appointment Status</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1a35', border: '1px solid #2a2a4a', borderRadius: 8 }} />
                                    <Legend wrapperStyle={{ fontSize: 12, color: '#9090b0' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* recent activity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* recent check-ins */}
                        <div className="card">
                            <div className="card-title">🚪 Recent Check-ins</div>
                            {recentLogs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🚶</div>
                                    <p>Koi check-in nahi hua abhi</p>
                                </div>
                            ) : (
                                recentLogs.slice(0, 6).map(log => (
                                    <div key={log._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-col)' }}>
                                        <div className="visitor-avatar-sm">
                                            {log.visitor?.photo
                                                ? <img src={`http://localhost:5000${log.visitor.photo}`} alt="" />
                                                : log.visitor?.name?.[0] || '?'
                                            }
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{log.visitor?.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--txt-faint)' }}>
                                                {log.location} • {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${log.type === 'check-in' ? 'green' : 'yellow'}`}>
                                            {log.type}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* recent appointments */}
                        <div className="card">
                            <div className="card-title">📅 Recent Appointments</div>
                            {recentAppointments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>Koi appointment nahi</p>
                                </div>
                            ) : (
                                recentAppointments.map(appt => (
                                    <div key={appt._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-col)' }}>
                                        <div className="visitor-avatar-sm">
                                            {appt.visitor?.name?.[0] || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{appt.visitor?.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--txt-faint)' }}>
                                                Host: {appt.host?.name} • {new Date(appt.scheduledDate).toLocaleDateString('en-IN')}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${
                                            appt.status === 'approved' ? 'green' :
                                            appt.status === 'pending' ? 'yellow' :
                                            appt.status === 'rejected' ? 'red' : 'blue'
                                        }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
