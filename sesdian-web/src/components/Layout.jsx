import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useState } from 'react'
import NotificationPanel from './NotificationPanel'

// Menu untuk USER biasa
const userMenus = [
  {
    section: 'UTAMA',
    items: [
      { to: '/dashboard',  icon: '⚡', label: 'Dashboard',     desc: 'Ringkasan & statistik' },
    ]
  },
  {
    section: 'ASET',
    items: [
      { to: '/assets',     icon: '📦', label: 'Data Aset',     desc: 'Lihat semua aset' },
      { to: '/categories', icon: '🏷️', label: 'Kategori Aset', desc: 'Jenis-jenis aset' },
      { to: '/rooms',      icon: '🏠', label: 'Ruangan',       desc: 'Daftar ruangan' },
    ]
  },
  {
    section: 'PEMINJAMAN',
    items: [
      { to: '/borrowings',         icon: '🔄', label: 'Daftar Pinjam', desc: 'Riwayat peminjaman' },
      { to: '/borrowings/request', icon: '📋', label: 'Ajukan Pinjam', desc: 'Request baru' },
    ]
  },
]

// Menu TAMBAHAN untuk ADMIN
const adminMenus = [
  {
    section: 'KELOLA ASET',
    items: [
      { to: '/assets',        icon: '📦', label: 'Data Aset',     desc: 'Lihat semua aset' },
      { to: '/assets/tambah', icon: '➕', label: 'Tambah Aset',   desc: 'Input aset baru' },
      { to: '/assets/qr',     icon: '🖨️', label: 'Cetak QR Code', desc: 'Print QR aset' },
      { to: '/categories',    icon: '🏷️', label: 'Kategori Aset', desc: 'Jenis-jenis aset' },
      { to: '/rooms',         icon: '🏠', label: 'Ruangan',       desc: 'Data ruangan' },
    ]
  },
  {
    section: 'PEMINJAMAN',
    items: [
      { to: '/borrowings',         icon: '🔄', label: 'Daftar Pinjam', desc: 'Riwayat peminjaman' },
      { to: '/borrowings/request', icon: '📋', label: 'Ajukan Pinjam', desc: 'Request baru' },
    ]
  },
  {
    section: 'ADMIN',
    items: [
      { to: '/admin/approvals', icon: '✅', label: 'Approval',    desc: 'Setujui permintaan' },
      { to: '/admin/users',     icon: '👥', label: 'Kelola User', desc: 'Manajemen pengguna' },
      { to: '/reports', icon: '📊', label: 'Laporan', desc: 'Export & monitoring' },
    ]
  },
]

const sectionColors = {
  'UTAMA':        { active: '#6366f1', shadow: 'rgba(99,102,241,0.35)' },
  'ASET':         { active: '#10b981', shadow: 'rgba(16,185,129,0.35)' },
  'KELOLA ASET':  { active: '#10b981', shadow: 'rgba(16,185,129,0.35)' },
  'PEMINJAMAN':   { active: '#f59e0b', shadow: 'rgba(245,158,11,0.35)' },
  'ADMIN':        { active: '#ef4444', shadow: 'rgba(239,68,68,0.35)'  },
}

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await api.post('/logout').catch(() => {})
    logout(); navigate('/login')
  }

  const avatar   = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const allMenus = [
    { section: 'UTAMA', items: [{ to:'/dashboard', icon:'⚡', label:'Dashboard', desc:'Ringkasan & statistik' }] },
    ...(isAdmin ? adminMenus : userMenus.slice(1)),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 68 : 256,
        background: '#0b1120',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden', flexShrink: 0,
        boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
      }}>

        {/* Logo */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 64 }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                SES<span style={{ color: '#6366f1' }}>DIAN</span>
              </div>
              <div style={{ fontSize: '0.55rem', color: '#334155', marginTop: 3, fontFamily: 'JetBrains Mono', letterSpacing: 2 }}>ASSET MANAGEMENT</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: '#1a2540', border: 'none', color: '#64748b',
            cursor: 'pointer', borderRadius: 8, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', flexShrink: 0, marginLeft: collapsed ? 'auto' : 0,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >{collapsed ? '›' : '‹'}</button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem' }}>
          {allMenus.map(({ section, items }) => {
            const sc = sectionColors[section] || { active: '#6366f1', shadow: 'rgba(99,102,241,0.35)' }
            return (
              <div key={section} style={{ marginBottom: '0.25rem' }}>
                {!collapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 0.5rem 0.25rem' }}>
                    <div style={{ flex: 1, height: 1, background: '#1a2540' }} />
                    <span style={{ fontSize: '0.55rem', color: '#334155', fontWeight: 800, letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{section}</span>
                    <div style={{ flex: 1, height: 1, background: '#1a2540' }} />
                  </div>
                )}
                {items.map((item) => {
                  const isActive = location.pathname === item.to ||
                    (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                  return (
                    <NavLink key={item.to} to={item.to} title={collapsed ? item.label : ''} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: collapsed ? '0.65rem' : '0.55rem 0.75rem',
                      borderRadius: 10, marginBottom: 2,
                      color: isActive ? '#fff' : '#64748b',
                      background: isActive ? sc.active : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.18s',
                      boxShadow: isActive ? `0 4px 12px ${sc.shadow}` : 'none',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                    }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1a2540'; e.currentTarget.style.color = '#e2e8f0' } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
                    >
                      <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                      {!collapsed && (
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', lineHeight: 1.2, color: 'inherit' }}>{item.label}</div>
                          <div style={{ fontSize: '0.62rem', color: isActive ? 'rgba(255,255,255,0.55)' : '#334155', whiteSpace: 'nowrap', marginTop: 1 }}>{item.desc}</div>
                        </div>
                      )}
                      {isActive && !collapsed && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* User */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #1a2540' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.6rem', borderRadius: 10,
            background: 'linear-gradient(135deg,#1a2540,#0f172a)',
            border: '1px solid #1e293b',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.75rem',
            }}>{avatar}</div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                  <div style={{ color: '#334155', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 1 }}>{user?.role}</div>
                </div>
                <button onClick={handleLogout} style={{
                  background: 'transparent', border: '1px solid #1e293b',
                  color: '#475569', cursor: 'pointer', fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem', borderRadius: 6, transition: 'all 0.2s', flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#475569' }}
                >Keluar</button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '0.7rem 1.75rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>🏠</span>
            {location.pathname.split('/').filter(Boolean).map((s, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
                <span style={{ color: i === arr.length-1 ? '#0f172a' : '#94a3b8', fontWeight: i === arr.length-1 ? 600 : 400, textTransform: 'capitalize' }}>{s}</span>
              </span>
            ))}
          </div>
       <div style={{ display:'flex', alignItems:'center', gap:10 }}>
  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 0 3px rgba(16,185,129,0.2)' }} />
    <span style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>Online</span>
  </div>
  <div style={{ width:1, height:14, background:'#e2e8f0' }} />
  <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
    {new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
  </span>
  <div style={{ width:1, height:14, background:'#e2e8f0' }} />
  <NotificationPanel />
</div>
        </div>
        <div style={{ padding: '1.75rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}