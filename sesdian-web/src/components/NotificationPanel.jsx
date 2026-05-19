import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff/60)} menit lalu`
  if (diff < 86400)return `${Math.floor(diff/3600)} jam lalu`
  return `${Math.floor(diff/86400)} hari lalu`
}

function buildAdminNotifs(borrowings, assets) {
  const notifs = []
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // Pending
  borrowings.filter(b => b.status === 'pending').forEach(b => {
    notifs.push({
      id:      `pending-${b.id}`,
      type:    'pending',
      icon:    '🔔',
      color:   '#f59e0b',
      bg:      '#fffbeb',
      title:   'Peminjaman Menunggu Approval',
      desc:    `${b.user?.name} mengajukan "${b.asset?.name}" (x${b.quantity||1})`,
      time:    b.requested_at || b.created_at,
      link:    '/admin/approvals',
    })
  })

  // Jatuh tempo hari ini
  borrowings.filter(b => b.status === 'borrowed' || b.status === 'approved').forEach(b => {
    if (b.return_due === today) {
      notifs.push({
        id:    `due-today-${b.id}`,
        type:  'due',
        icon:  '⏰',
        color: '#ef4444',
        bg:    '#fff1f2',
        title: 'Jatuh Tempo HARI INI',
        desc:  `"${b.asset?.name}" dipinjam ${b.user?.name} harus dikembalikan hari ini`,
        time:  b.return_due,
        link:  '/borrowings',
      })
    } else if (b.return_due === tomorrow) {
      notifs.push({
        id:    `due-tomorrow-${b.id}`,
        type:  'due',
        icon:  '⏰',
        color: '#f59e0b',
        bg:    '#fffbeb',
        title: 'Jatuh Tempo Besok',
        desc:  `"${b.asset?.name}" dipinjam ${b.user?.name} jatuh tempo besok`,
        time:  b.return_due,
        link:  '/borrowings',
      })
    }
  })

  // Stok menipis < 20%
  assets.forEach(a => {
    const total = Number(a.stock) || 0
    const avail = Number(a.stock_available ?? a.stock) || 0
    if (total > 0 && avail / total < 0.2) {
      notifs.push({
        id:    `low-stock-${a.id}`,
        type:  'stock',
        icon:  '📦',
        color: '#8b5cf6',
        bg:    '#f5f3ff',
        title: 'Stok Aset Menipis',
        desc:  `"${a.name}" tersisa ${avail} dari ${total} unit (${Math.round(avail/total*100)}%)`,
        time:  a.updated_at,
        link:  '/assets',
      })
    }
  })

  // Baru dikembalikan (dalam 24 jam)
  borrowings.filter(b => b.status === 'returned' && b.returned_at).forEach(b => {
    const diffHours = (Date.now() - new Date(b.returned_at)) / 3600000
    if (diffHours <= 24) {
      notifs.push({
        id:    `returned-${b.id}`,
        type:  'returned',
        icon:  '✅',
        color: '#10b981',
        bg:    '#f0fdf4',
        title: 'Barang Dikembalikan',
        desc:  `"${b.asset?.name}" (x${b.quantity||1}) dikembalikan oleh ${b.user?.name}`,
        time:  b.returned_at,
        link:  '/borrowings',
      })
    }
  })

  // Sort: terbaru dulu
  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
}

function buildUserNotifs(borrowings) {
  const notifs = []
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  borrowings.forEach(b => {
    // Disetujui
    if (b.status === 'approved' && b.approved_at) {
      const diffHours = (Date.now() - new Date(b.approved_at)) / 3600000
      if (diffHours <= 48) {
        notifs.push({
          id:    `approved-${b.id}`,
          type:  'approved',
          icon:  '✅',
          color: '#10b981',
          bg:    '#f0fdf4',
          title: 'Pengajuan Disetujui',
          desc:  `"${b.asset?.name}" (x${b.quantity||1}) telah disetujui. Silakan ambil barang.`,
          time:  b.approved_at,
          link:  '/borrowings',
        })
      }
    }

    // Ditolak
    if (b.status === 'rejected') {
      const diffHours = (Date.now() - new Date(b.updated_at)) / 3600000
      if (diffHours <= 72) {
        notifs.push({
          id:    `rejected-${b.id}`,
          type:  'rejected',
          icon:  '❌',
          color: '#ef4444',
          bg:    '#fff1f2',
          title: 'Pengajuan Ditolak',
          desc:  `"${b.asset?.name}" ditolak${b.rejection_reason ? `: ${b.rejection_reason}` : ''}`,
          time:  b.updated_at,
          link:  '/borrowings',
        })
      }
    }

    // Jatuh tempo hari ini
    if ((b.status === 'borrowed' || b.status === 'approved') && b.return_due === today) {
      notifs.push({
        id:    `due-today-${b.id}`,
        type:  'due',
        icon:  '⏰',
        color: '#ef4444',
        bg:    '#fff1f2',
        title: 'Jatuh Tempo HARI INI',
        desc:  `"${b.asset?.name}" harus dikembalikan hari ini!`,
        time:  b.return_due,
        link:  '/borrowings',
      })
    }

    // Jatuh tempo besok
    if ((b.status === 'borrowed' || b.status === 'approved') && b.return_due === tomorrow) {
      notifs.push({
        id:    `due-tomorrow-${b.id}`,
        type:  'due',
        icon:  '⏰',
        color: '#f59e0b',
        bg:    '#fffbeb',
        title: 'Jatuh Tempo Besok',
        desc:  `"${b.asset?.name}" harus dikembalikan besok`,
        time:  b.return_due,
        link:  '/borrowings',
      })
    }

    // Dikembalikan (konfirmasi)
    if (b.status === 'returned' && b.returned_at) {
      const diffHours = (Date.now() - new Date(b.returned_at)) / 3600000
      if (diffHours <= 24) {
        notifs.push({
          id:    `returned-${b.id}`,
          type:  'returned',
          icon:  '✅',
          color: '#10b981',
          bg:    '#f0fdf4',
          title: 'Pengembalian Terkonfirmasi',
          desc:  `"${b.asset?.name}" telah berhasil dikembalikan. Terima kasih!`,
          time:  b.returned_at,
          link:  '/borrowings',
        })
      }
    }
  })

  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
}

export default function NotificationPanel() {
  const { isAdmin } = useAuth()
  const navigate    = useNavigate()
  const [open, setOpen]       = useState(false)
  const [notifs, setNotifs]   = useState([])
  const [read, setRead]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('sesdian_notif_read') || '[]') } catch { return [] }
  })
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const [bRes, aRes] = await Promise.all([
        api.get('/borrowings'),
        isAdmin ? api.get('/assets') : Promise.resolve({ data: [] }),
      ])
      const borrowings = bRes.data.data || bRes.data
      const assets     = aRes.data.data || aRes.data || []

      const built = isAdmin
        ? buildAdminNotifs(borrowings, assets)
        : buildUserNotifs(borrowings)

      setNotifs(built)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isAdmin])

  // Auto-refresh setiap 60 detik
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [isAdmin])

  // Tutup saat klik luar
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifs.filter(n => !read.includes(n.id)).length

  const markAllRead = () => {
    const ids = notifs.map(n => n.id)
    localStorage.setItem('sesdian_notif_read', JSON.stringify(ids))
    setRead(ids)
  }

  const handleClick = (notif) => {
    const newRead = [...new Set([...read, notif.id])]
    localStorage.setItem('sesdian_notif_read', JSON.stringify(newRead))
    setRead(newRead)
    setOpen(false)
    navigate(notif.link)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        style={{
          position:'relative', background: open ? '#eff6ff' : '#f8faff',
          border:'1px solid var(--border)', borderRadius:10,
          width:38, height:38, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.1rem', transition:'all 0.2s',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            background:'#ef4444', color:'#fff',
            borderRadius:'50%', width:18, height:18,
            fontSize:'0.65rem', fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid #fff',
            animation: 'pulse 2s infinite',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          width:360, maxHeight:520, overflowY:'auto',
          background:'#fff', borderRadius:16,
          boxShadow:'0 8px 40px rgba(0,0,0,0.15)',
          border:'1px solid var(--border)', zIndex:9999,
        }}>
          {/* Header */}
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.95rem' }}>Notifikasi</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>
                {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ fontSize:'0.72rem', color:'var(--primary)', background:'var(--primary-light)', border:'none', borderRadius:6, padding:'0.3rem 0.6rem', cursor:'pointer', fontWeight:600 }}>
                  Tandai semua dibaca
                </button>
              )}
              <button onClick={() => load()} style={{ fontSize:'0.85rem', color:'var(--text-muted)', background:'#f1f5f9', border:'none', borderRadius:6, padding:'0.3rem 0.5rem', cursor:'pointer' }}>
                🔄
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:60, borderRadius:10 }} />)}
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🎉</div>
              <div style={{ fontWeight:600, marginBottom:4 }}>Tidak ada notifikasi</div>
              <div style={{ fontSize:'0.78rem' }}>Semua berjalan dengan baik</div>
            </div>
          ) : (
            <div>
              {notifs.map(n => {
                const isRead = read.includes(n.id)
                return (
                  <div key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding:'0.875rem 1.25rem',
                      borderBottom:'1px solid #f1f5f9',
                      cursor:'pointer',
                      background: isRead ? '#fff' : n.bg,
                      transition:'background 0.15s',
                      display:'flex', gap:12, alignItems:'flex-start',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background = isRead ? '#fff' : n.bg}
                  >
                    {/* Icon */}
                    <div style={{
                      width:36, height:36, borderRadius:10, flexShrink:0,
                      background: isRead ? '#f1f5f9' : n.bg,
                      border:`1.5px solid ${isRead ? '#e2e8f0' : n.color}30`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1rem',
                    }}>{n.icon}</div>

                    {/* Text */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight: isRead ? 500 : 700, fontSize:'0.82rem', color: isRead ? 'var(--text-muted)' : 'var(--text)', marginBottom:3 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {n.desc}
                      </div>
                      <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:4 }}>
                        {timeAgo(n.time)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!isRead && (
                      <div style={{ width:8, height:8, borderRadius:'50%', background:n.color, flexShrink:0, marginTop:4 }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}