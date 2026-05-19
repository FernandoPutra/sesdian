import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function CountUp({ end, duration = 1200 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!end) { setCount(0); return }
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [end])
  return <>{count}</>
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]         = useState(null)
  const [recentBorrowings, setRecent] = useState([])
  const [loading, setLoading]     = useState(true)
  const [assetReport, setAssetReport] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/assets'),
      api.get('/borrowings'),
      api.get('/reports/assets'),
    ]).then(([a, b, r]) => {
      const assets     = a.data.data || a.data
      const borrowings = b.data.data || b.data
      const report     = r.data

      setAssetReport(report)
      setStats({
        assets:        assets.length,
        available:     assets.filter(x => x.status === 'available').length,
        borrowed:      assets.filter(x => x.status === 'borrowed' || x.status === 'reserved').length,
        pending:       borrowings.filter(x => x.status === 'pending').length,
        totalStock:    report.total_stock    || 0,
        stockAvail:    report.stock_available || 0,
        stockBorrowed: report.stock_borrowed  || 0,
        returned:      borrowings.filter(x => x.status === 'returned').length,
      })
      setRecent(borrowings.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusColor = (s) => ({
    pending:  ['#fef9c3','#92400e'], approved: ['#dbeafe','#1e40af'],
    borrowed: ['#ede9fe','#5b21b6'], returned: ['#dcfce7','#166534'],
    rejected: ['#fee2e2','#991b1b'],
  }[s] || ['#f1f5f9','#475569'])

  const topCards = stats ? [
    { label:'Total Aset',    value:stats.assets,        icon:'📦', grad:'linear-gradient(135deg,#6366f1,#8b5cf6)', link:'/assets' },
    { label:'Total Stok',    value:stats.totalStock,    icon:'🗄️', grad:'linear-gradient(135deg,#0ea5e9,#6366f1)', link:'/assets' },
    { label:'Stok Tersedia', value:stats.stockAvail,    icon:'✅', grad:'linear-gradient(135deg,#10b981,#059669)', link:'/assets' },
    { label:'Stok Dipinjam', value:stats.stockBorrowed, icon:'🔄', grad:'linear-gradient(135deg,#f59e0b,#d97706)', link:'/borrowings' },
    { label:'Pending',       value:stats.pending,       icon:'⏳', grad:'linear-gradient(135deg,#ef4444,#dc2626)', link:'/admin/approvals' },
  ] : []

  return (
    <div>
      {/* Hero */}
      <div className="animate-fade-up" style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#312e81 100%)', borderRadius:20, padding:'2rem 2.5rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(99,102,241,0.15)' }} />
        <div style={{ position:'absolute', bottom:-60, right:80, width:150, height:150, borderRadius:'50%', background:'rgba(139,92,246,0.1)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:'0.72rem', color:'#6366f1', fontWeight:700, letterSpacing:2, marginBottom:8, fontFamily:'JetBrains Mono' }}>
            {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase()}
          </div>
          <h1 style={{ color:'#fff', fontSize:'1.75rem', fontWeight:800, marginBottom:6 }}>
            Selamat datang, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'#94a3b8', fontSize:'0.9rem' }}>
            {isAdmin ? 'Anda login sebagai Administrator. Kelola semua aset dan peminjaman.' : 'Pantau dan ajukan peminjaman aset dengan mudah.'}
          </p>
        </div>
      </div>

      {/* Top stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {loading ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:110, borderRadius:16 }} />) :
          topCards.map((c, i) => (
            <div key={c.label} className={`animate-fade-up delay-${i+1}`}
              onClick={() => navigate(c.link)}
              style={{ background:c.grad, borderRadius:16, padding:'1.25rem', cursor:'pointer', transition:'transform 0.2s,box-shadow 0.2s', boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div style={{ fontSize:'1.75rem', marginBottom:10 }}>{c.icon}</div>
              <div style={{ fontSize:'2rem', fontWeight:800, color:'#fff', lineHeight:1 }}>
                <CountUp end={c.value} />
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.82rem', marginTop:6, fontWeight:500 }}>{c.label}</div>
            </div>
          ))
        }
      </div>

      {/* Stok monitoring bar */}
      {!loading && stats && (
        <div className="animate-fade-up delay-5" style={{ background:'#fff', borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem', boxShadow:'var(--shadow)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700 }}>📊 Monitor Stok Aset</h2>
            <button onClick={() => navigate('/assets')} style={{ fontSize:'0.8rem', color:'var(--primary)', background:'var(--primary-light)', border:'none', borderRadius:8, padding:'0.35rem 0.75rem', cursor:'pointer', fontWeight:600 }}>Lihat Detail →</button>
          </div>

          {/* Bar stok keseluruhan */}
          {stats.totalStock > 0 && (() => {
            const availPct   = Math.round((stats.stockAvail    / stats.totalStock) * 100)
            const borrowPct  = Math.round((stats.stockBorrowed / stats.totalStock) * 100)
            return (
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Total {stats.totalStock} unit stok</span>
                  <div style={{ display:'flex', gap:12, fontSize:'0.78rem' }}>
                    <span style={{ color:'#10b981', fontWeight:600 }}>● Tersedia {availPct}%</span>
                    <span style={{ color:'#f59e0b', fontWeight:600 }}>● Dipinjam {borrowPct}%</span>
                  </div>
                </div>
                <div style={{ height:16, borderRadius:999, background:'#e2e8f0', overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${availPct}%`, background:'linear-gradient(90deg,#10b981,#059669)', transition:'width 0.8s ease' }} />
                  <div style={{ width:`${borrowPct}%`, background:'linear-gradient(90deg,#f59e0b,#d97706)', transition:'width 0.8s ease' }} />
                </div>
              </div>
            )
          })()}

          {/* Per-aset stok (top 6) */}
          {assetReport?.assets && (() => {
            const topAssets = [...(assetReport.assets.slice?.(0,6) || [])].sort((a,b) => b.stock - a.stock)
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {topAssets.map(a => {
                  const pct      = a.stock > 0 ? Math.round(((a.stock_available ?? a.stock) / a.stock) * 100) : 0
                  const barColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444'
                  return (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:130, flexShrink:0 }}>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</div>
                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{a.code}</div>
                      </div>
                      <div style={{ flex:1, height:8, borderRadius:999, background:'#e2e8f0', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:999, width:`${pct}%`, background:barColor, transition:'width 0.5s' }} />
                      </div>
                      <div style={{ width:90, textAlign:'right', fontSize:'0.75rem', flexShrink:0 }}>
                        <span style={{ fontWeight:700, color:barColor }}>{a.stock_available ?? a.stock}</span>
                        <span style={{ color:'var(--text-muted)' }}> / {a.stock}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* Recent borrowings */}
      <div className="animate-fade-up delay-5" style={{ background:'#fff', borderRadius:16, padding:'1.5rem', boxShadow:'var(--shadow)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700 }}>Peminjaman Terbaru</h2>
          <button onClick={() => navigate('/borrowings')} style={{ fontSize:'0.8rem', color:'var(--primary)', background:'var(--primary-light)', border:'none', borderRadius:8, padding:'0.35rem 0.75rem', cursor:'pointer', fontWeight:600 }}>Lihat Semua →</button>
        </div>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:52 }} />)}
          </div>
        ) : recentBorrowings.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:8 }}>📋</div>
            <p>Belum ada peminjaman</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Aset','Jumlah','Peminjam','Status','Jatuh Tempo'].map(h => (
                <th key={h} style={{ padding:'0.6rem 0.75rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recentBorrowings.map(b => {
                const [bg, color] = statusColor(b.status)
                return (
                  <tr key={b.id}
                    onMouseEnter={e => e.currentTarget.style.background='#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    style={{ transition:'background 0.15s' }}
                  >
                    <td style={{ padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderBottom:'1px solid var(--border)' }}>{b.asset?.name||'-'}</td>
                    <td style={{ padding:'0.75rem', fontSize:'0.875rem', fontWeight:700, color:'var(--primary)', borderBottom:'1px solid var(--border)' }}>{b.quantity||1} unit</td>
                    <td style={{ padding:'0.75rem', fontSize:'0.875rem', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{b.user?.name||'-'}</td>
                    <td style={{ padding:'0.75rem', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ background:bg, color, padding:'0.2rem 0.65rem', borderRadius:20, fontSize:'0.75rem', fontWeight:600 }}>{b.status}</span>
                    </td>
                    <td style={{ padding:'0.75rem', fontSize:'0.85rem', color:'var(--text-muted)', borderBottom:'1px solid var(--border)', fontFamily:'JetBrains Mono' }}>{b.return_due}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}