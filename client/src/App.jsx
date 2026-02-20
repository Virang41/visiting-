import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import InviteVisitor from './pages/employee/InviteVisitor';
import MyAppointments from './pages/employee/MyAppointments';
import CheckIn from './pages/security/CheckIn';
import CheckLog from './pages/security/CheckLog';
import PreRegister from './pages/visitor/PreRegister';
import MyPass from './pages/visitor/MyPass';
import VisitorList from './pages/shared/VisitorList';
import AppointmentList from './pages/shared/AppointmentList';
import PassList from './pages/shared/PassList';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDefaultPath(user.role)} replace />;
  return children;
};

const getDefaultPath = (role) => {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'security': return '/security/checkin';
    case 'employee': return '/employee/appointments';
    case 'visitor': return '/visitor/pass';
    default: return '/login';
  }
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(user.role)} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pre-register" element={<PreRegister />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/visitors" element={<ProtectedRoute roles={['admin']}><VisitorList /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute roles={['admin']}><AppointmentList /></ProtectedRoute>} />
        <Route path="/admin/passes" element={<ProtectedRoute roles={['admin']}><PassList /></ProtectedRoute>} />

        {/* Security Routes */}
        <Route path="/security/checkin" element={<ProtectedRoute roles={['security', 'admin']}><CheckIn /></ProtectedRoute>} />
        <Route path="/security/logs" element={<ProtectedRoute roles={['security', 'admin']}><CheckLog /></ProtectedRoute>} />

        {/* Employee Routes */}
        <Route path="/employee/invite" element={<ProtectedRoute roles={['employee', 'admin']}><InviteVisitor /></ProtectedRoute>} />
        <Route path="/employee/appointments" element={<ProtectedRoute roles={['employee', 'admin']}><MyAppointments /></ProtectedRoute>} />

        {/* Visitor Routes */}
        <Route path="/visitor/pass" element={<ProtectedRoute roles={['visitor']}><MyPass /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
