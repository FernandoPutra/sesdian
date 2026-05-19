import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function UserManagement() {
  const { user: me } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const load = () => {
    setLoading(true)
    api.get('/users').then(r => setUsers(r.data.data || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const setRole = async (id, role) => {
    await api.put(`/users/${id}`, { role })
    load()
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.nip.includes(search) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const avatar = name => name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  const roleConf = {
    admin: { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', label: 'Admin' },
    user:  { bg: '#f1f5f9', color: '#475569', label: 'User' },
    guest: { bg: '#f8faff', color: '#94a3b8', label: 'Guest' },
  }

  return (
    <div>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Manajemen User</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{users.length} pengguna terdaftar</p>
        </div>
      </div>

      <div className="animate-fade-up delay-1" style={{ marginBottom: '1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Cari nama, NIP, atau email..."
          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div className="animate-fade-up delay-2" style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>👥</div>
              <p style={{ fontWeight: 600 }}>Tidak ada user ditemukan</p>
            </div>
          ) : filtered.map((u, i) => {
            const rc = roleConf[u.role] || roleConf.guest
            const isMe = u.id === me?.id
            return (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='#f8faff'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: u.role==='admin' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#e2e8f0,#cbd5e1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: u.role==='admin'?'#fff':'#475569', fontWeight: 800, fontSize: '0.85rem',
                }}>{avatar(u.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.name}
                    {isMe && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: 20, fontWeight: 700 }}>Anda</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono' }}>{u.nip}</span> · {u.email}
                  </div>
                </div>
                <span style={{ background: rc.bg, color: rc.color, padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{rc.label}</span>
                {!isMe && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {u.role !== 'admin'
                      ? <button onClick={() => setRole(u.id,'admin')} style={{ padding: '0.35rem 0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>→ Admin</button>
                      : <button onClick={() => setRole(u.id,'user')} style={{ padding: '0.35rem 0.8rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>→ User</button>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}