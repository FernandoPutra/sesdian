import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useInactivity } from './hooks/useInactivity'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import Assets         from './pages/Assets'
import AssetAdd       from './pages/AssetAdd'
import AssetQR        from './pages/AssetQR'
import Borrowings     from './pages/Borrowings'
import BorrowRequest  from './pages/BorrowRequest'
import ApprovalQueue  from './pages/Admin/ApprovalQueue'
import UserManagement from './pages/Admin/UserManagement'
import Rooms          from './pages/Admin/Rooms'
import Categories     from './pages/Admin/Categories'
import QRView         from './pages/QRView'
import Layout         from './components/Layout'
import Reports from './pages/Reports'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}
function AdminRoute({ children }) {
  const { token, isAdmin } = useAuth()
  if (!token) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/dashboard" />
  return children
}
function AppRoutes() {
  useInactivity()
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login"    element={!token ? <Login />    : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/qr/:code" element={<QRView />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard"          element={<Dashboard />} />

        {/* Aset — user bisa lihat, admin bisa CRUD */}
        <Route path="assets"             element={<Assets />} />
        <Route path="assets/tambah"      element={<AdminRoute><AssetAdd /></AdminRoute>} />
        <Route path="assets/qr"          element={<AdminRoute><AssetQR /></AdminRoute>} />

        {/* Rooms & Categories — semua bisa lihat (read-only untuk user) */}
        <Route path="rooms"              element={<Rooms />} />
        <Route path="categories"         element={<Categories />} />
        <Route path="/qr-room/:location" element={<QRView />} />

        {/* Peminjaman */}
        <Route path="borrowings"         element={<Borrowings />} />
        <Route path="borrowings/request" element={<BorrowRequest />} />

        {/* Admin only */}
        <Route path="admin/approvals"    element={<AdminRoute><ApprovalQueue /></AdminRoute>} />
        <Route path="admin/users"        element={<AdminRoute><UserManagement /></AdminRoute>} />

        {/* tambahkan di dalam Route layout */}
<Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />

      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}
export default function App() { return <AppRoutes /> }