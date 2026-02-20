import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard, MdPeople, MdAssignment, MdQrCodeScanner,
    MdHistory, MdBarChart, MdPersonAdd, MdBadge,
    MdLogout, MdGroups, MdAdminPanelSettings
} from 'react-icons/md';

const navConfig = {
    admin: [
        {
            section: 'Overview', items: [
                { to: '/admin/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
                { to: '/admin/reports', icon: <MdBarChart />, label: 'Reports & Analytics' }
            ]
        },
        {
            section: 'Management', items: [
                { to: '/admin/users', icon: <MdAdminPanelSettings />, label: 'User Management' },
                { to: '/admin/visitors', icon: <MdGroups />, label: 'Visitors' },
                { to: '/admin/appointments', icon: <MdAssignment />, label: 'Appointments' },
                { to: '/admin/passes', icon: <MdBadge />, label: 'Passes' }
            ]
        },
        {
            section: 'Security', items: [
                { to: '/security/checkin', icon: <MdQrCodeScanner />, label: 'Check In/Out' },
                { to: '/security/logs', icon: <MdHistory />, label: 'Check Logs' }
            ]
        }
    ],
    security: [
        {
            section: 'Security Desk', items: [
                { to: '/security/checkin', icon: <MdQrCodeScanner />, label: 'Scan & Check In' },
                { to: '/security/logs', icon: <MdHistory />, label: 'Activity Logs' }
            ]
        }
    ],
    employee: [
        {
            section: 'My Work', items: [
                { to: '/employee/appointments', icon: <MdAssignment />, label: 'My Appointments' },
                { to: '/employee/invite', icon: <MdPersonAdd />, label: 'Invite Visitor' }
            ]
        }
    ],
    visitor: [
        {
            section: 'My Visit', items: [
                { to: '/visitor/pass', icon: <MdBadge />, label: 'My Pass' }
            ]
        }
    ]
};

const roleColors = {
    admin: 'var(--accent-secondary)',
    security: 'var(--accent-orange)',
    employee: 'var(--accent-blue)',
    visitor: 'var(--accent-green)'
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sections = navConfig[user?.role] || [];
    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🏢</div>
                <div>
                    <div className="logo-text">Visit<span>Pass</span></div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>MANAGEMENT SYSTEM</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {sections.map(({ section, items }) => (
                    <div key={section}>
                        <div className="nav-section-title">{section}</div>
                        {items.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-chip" onClick={handleLogout} title="Click to logout">
                    <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${roleColors[user?.role] || 'var(--accent-primary)'}, var(--accent-primary))` }}>
                        {initials}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role" style={{ color: roleColors[user?.role] }}>{user?.role}</div>
                    </div>
                    <MdLogout style={{ color: 'var(--text-muted)', fontSize: '18px', marginLeft: 'auto' }} />
                </div>
            </div>
        </aside>
    );
}
