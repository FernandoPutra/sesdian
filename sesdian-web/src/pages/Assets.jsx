import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import AssetQRLabel from '../components/AssetQRLabel'

const conditionConf = {
  baik:         { label:'Baik',         bg:'#dcfce7', color:'#166534' },
  rusak_ringan: { label:'Rusak Ringan', bg:'#fef9c3', color:'#854d0e' },
  rusak_berat:  { label:'Rusak Berat',  bg:'#fee2e2', color:'#991b1b' },
}

const statusConf = {
  available: { label:'✅ Tersedia',        bg:'#dcfce7', color:'#166534' },
  borrowed:  { label:'🔄 Sedang Dipinjam', bg:'#dbeafe', color:'#1e40af' },
  reserved:  { label:'⏳ Dipesan',         bg:'#fef9c3', color:'#854d0e' },
  repair:    { label:'🔧 Maintenance',     bg:'#fee2e2', color:'#991b1b' },
}

export default function Assets() {
  const { isAdmin } = useAuth()
  const navigate    = useNavigate()
  const [assets, setAssets]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [ownership, setOwnership]   = useState('all')
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [qrAsset, setQrAsset]       = useState(null)
  const [detail, setDetail]         = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (ownership !== 'all') params.ownership = ownership
    if (filterStatus !== 'all') params.status = filterStatus
    if (search) params.search = search
    api.get('/assets', { params })
      .then(r => setAssets(r.data.data || r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [ownership, filterStatus])

  const handleDelete = async (id) => {
    if (!confirm('Hapus aset ini?')) return
    await api.delete(`/assets/${id}`).catch(() => {})
    load()
  }

  // Total stok info
  const totalStok     = assets.reduce((s, a) => s + (Number(a.stock) || 0), 0)
  const totalDipinjam = assets.reduce((s, a) => s + (Number(a.stock_borrowed) || 0), 0)
  const totalTersedia = assets.reduce((s, a) => s + (Number(a.stock_available) || 0), 0)

  const stats = [
    { label:'Total Aset',    value: assets.length,                 color:'#6366f1', bg:'#eff6ff' },
    { label:'Total Stok',    value: totalStok,                     color:'#0ea5e9', bg:'#f0f9ff' },
    { label:'Stok Tersedia', value: totalTersedia,                 color:'#10b981', bg:'#f0fdf4' },
    { label:'Stok Dipinjam', value: totalDipinjam,                 color:'#f59e0b', bg:'#fffbeb' },
    { label:'Maintenance',   value: assets.filter(a=>a.status==='repair').length, color:'#ef4444', bg:'#fff1f2' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>Manajemen Aset</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{assets.length} aset · {totalStok} total unit stok</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/assets/tambah')} style={btnPrimary}>+ Tambah Aset</button>
        )}
      </div>

      {/* BMN Toggle */}
      <div className="animate-fade-up delay-1" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'inline-flex', background:'#0f172a', borderRadius:14, padding:4, gap:2 }}>
          {[['all','🔍 Semua'],['BMN','🏛️ BMN'],['Non-BMN','📦 Non-BMN']].map(([v,l]) => (
            <button key={v} onClick={() => setOwnership(v)} style={{
              padding:'0.55rem 1.1rem', borderRadius:10, border:'none', cursor:'pointer',
              fontWeight:700, fontSize:'0.82rem', transition:'all 0.2s',
              background: ownership===v
                ? v==='BMN' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : v==='Non-BMN' ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                  : 'linear-gradient(135deg,#10b981,#059669)'
                : 'transparent',
              color: ownership===v ? '#fff' : '#64748b',
              boxShadow: ownership===v ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="animate-fade-up delay-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'0.875rem 1rem', borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="animate-fade-up delay-3" style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key==='Enter' && load()}
          placeholder="🔍  Cari nama atau kode aset..."
          style={{ flex:1, minWidth:200, padding:'0.65rem 1rem', borderRadius:10, border:'1px solid var(--border)', fontSize:'0.875rem', outline:'none', background:'#fff' }} />
        <button onClick={load} style={{ padding:'0.65rem 1rem', background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>Cari</button>
        {['all','available','borrowed','repair'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding:'0.65rem 0.875rem', borderRadius:10, border:'1px solid var(--border)',
            background:filterStatus===s?'var(--primary)':'#fff',
            color:filterStatus===s?'#fff':'var(--text-muted)',
            cursor:'pointer', fontSize:'0.78rem', fontWeight:600, transition:'all 0.2s',
          }}>{s==='all'?'Semua':statusConf[s]?.label.replace(/[^\w\s]/g,'')||s}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:260 }} />)}
        </div>
      ) : assets.length===0 ? (
        <div style={{ textAlign:'center', padding:'5rem 0', background:'#fff', borderRadius:16, boxShadow:'var(--shadow)' }}>
          <div style={{ fontSize:'4rem', marginBottom:12 }}>📭</div>
          <p style={{ fontWeight:600 }}>Tidak ada aset ditemukan</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {assets.map((a, i) => {
            const sc  = statusConf[a.status]    || { label:a.status,    bg:'#f1f5f9', color:'#475569' }
            const cc  = conditionConf[a.condition] || { label:'-',      bg:'#f1f5f9', color:'#475569' }
            const pct = a.stock > 0 ? Math.round((a.stock_available / a.stock) * 100) : 0

            return (
              <div key={a.id} className={`animate-fade-up delay-${Math.min(i+1,5)}`}
                onClick={() => setDetail(a)}
                style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)', border:'1px solid var(--border)', transition:'transform 0.2s,box-shadow 0.2s', cursor:'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow)' }}
              >
                {/* Foto / placeholder */}
                {a.photo ? (
                  <div style={{ height:130, overflow:'hidden' }}>
                    <img src={a.photo} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ) : (
                  <div style={{ height:80, background:a.type==='fixed'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'linear-gradient(135deg,#f59e0b,#ef4444)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem' }}>
                    {a.type==='fixed'?'🔧':'🧴'}
                  </div>
                )}

                <div style={{ padding:'1rem' }}>
                  {/* BMN + status */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'0.15rem 0.5rem', borderRadius:20, background:a.ownership==='BMN'?'#dbeafe':'#fef9c3', color:a.ownership==='BMN'?'#1e40af':'#854d0e' }}>{a.ownership||'BMN'}</span>
                    <span style={{ background:sc.bg, color:sc.color, padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700 }}>{sc.label}</span>
                  </div>

                  <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:2 }}>{a.code}</div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:6 }}>{a.name}</div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                    {a.category && <span style={chip}>🏷️ {a.category}</span>}
                    {a.brand    && <span style={chip}>🏭 {a.brand}</span>}
                    {a.location && <span style={chip}>📍 {a.location}</span>}
                  </div>

                  {/* STOK BAR */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)' }}>STOK</span>
                      <span style={{ fontSize:'0.75rem', fontWeight:700 }}>
                        <span style={{ color:'#10b981' }}>{a.stock_available ?? a.stock}</span>
                        <span style={{ color:'var(--text-muted)' }}> / {a.stock} unit</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height:6, borderRadius:999, background:'#e2e8f0', overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:999,
                        width:`${pct}%`,
                        background: pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444',
                        transition:'width 0.5s ease',
                      }} />
                    </div>
                    {a.stock_borrowed > 0 && (
                      <div style={{ fontSize:'0.68rem', color:'#f59e0b', marginTop:3, fontWeight:600 }}>
                        🔄 {a.stock_borrowed} sedang dipinjam
                      </div>
                    )}
                  </div>

                  <span style={{ background:cc.bg, color:cc.color, padding:'0.15rem 0.5rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700 }}>{cc.label}</span>

                  {isAdmin && (
                    <div onClick={e => e.stopPropagation()} style={{ display:'flex', gap:6, marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid var(--border)' }}>
                      <button onClick={() => setQrAsset(a)} style={{ flex:1, padding:'0.4rem', background:'#f0fdf4', color:'#166534', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>🖨️ QR</button>
                      <button onClick={() => navigate('/assets/tambah', { state:{ edit:a } })} style={{ flex:1, padding:'0.4rem', background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(a.id)} style={{ flex:1, padding:'0.4rem', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="animate-fade-in" onClick={() => setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'1rem' }}>
          <div className="animate-bounce-in" onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>

            {detail.photo ? (
              <div style={{ height:220, overflow:'hidden', borderRadius:'20px 20px 0 0' }}>
                <img src={detail.photo} alt={detail.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            ) : (
              <div style={{ height:100, background:detail.type==='fixed'?'linear-gradient(135deg,#6366f1,#8b5cf6)':'linear-gradient(135deg,#f59e0b,#ef4444)', borderRadius:'20px 20px 0 0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>
                {detail.type==='fixed'?'🔧':'🧴'}
              </div>
            )}

            <div style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                <div>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:4 }}>{detail.code}</div>
                  <h2 style={{ fontWeight:800, fontSize:'1.25rem', marginBottom:4 }}>{detail.name}</h2>
                  {detail.brand && <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>🏭 {detail.brand}</div>}
                </div>
                <button onClick={() => setDetail(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:'1rem', flexShrink:0 }}>✕</button>
              </div>

              {/* Status ketersediaan */}
              {(() => {
                const isAvail = (detail.stock_available ?? detail.stock) > 0 && detail.status !== 'repair'
                return (
                  <div style={{ background:isAvail?'#f0fdf4':'#fff1f2', border:`2px solid ${isAvail?'#10b981':'#ef4444'}`, borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:'1.75rem' }}>{isAvail?'✅':detail.status==='borrowed'?'🔄':detail.status==='reserved'?'⏳':'🔧'}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'0.95rem', color:isAvail?'#166534':'#991b1b' }}>
                        {isAvail ? 'Tersedia untuk Dipinjam' : detail.status==='borrowed'?'Sedang Dipinjam':detail.status==='reserved'?'Sudah Dipesan':'Sedang Maintenance'}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                        {isAvail ? `Stok tersedia: ${detail.stock_available ?? detail.stock} unit` : 'Aset tidak dapat dipinjam saat ini'}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Stok detail */}
              <div style={{ background:'#f8faff', borderRadius:12, padding:'1rem', marginBottom:'1rem', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Informasi Stok</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                  {[
                    ['Total Stok', detail.stock, '#6366f1'],
                    ['Tersedia',   detail.stock_available ?? detail.stock, '#10b981'],
                    ['Dipinjam',   detail.stock_borrowed ?? 0, '#f59e0b'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign:'center', background:'#fff', borderRadius:8, padding:'0.6rem', border:`2px solid ${c}20` }}>
                      <div style={{ fontSize:'1.25rem', fontWeight:800, color:c }}>{v}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                {detail.stock > 0 && (() => {
                  const pct = Math.round(((detail.stock_available ?? detail.stock) / detail.stock) * 100)
                  return (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4 }}>
                        <span>Ketersediaan stok</span>
                        <span style={{ fontWeight:700 }}>{pct}%</span>
                      </div>
                      <div style={{ height:8, borderRadius:999, background:'#e2e8f0' }}>
                        <div style={{ height:'100%', borderRadius:999, width:`${pct}%`, background:pct>50?'#10b981':pct>20?'#f59e0b':'#ef4444', transition:'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>
                {[
                  ['Jenis Aset',  detail.ownership||'BMN'],
                  ['Tipe',        detail.type==='fixed'?'Fixed Asset':'Consumable'],
                  ['Kategori',    detail.category||'-'],
                  ['Ruangan',     detail.location||'-'],
                  ['Tahun',       detail.acquisition_year||'-'],
                  ['Kondisi',     conditionConf[detail.condition]?.label||'-'],
                ].map(([l,v]) => (
                  <div key={l} style={{ background:'#f8faff', borderRadius:10, padding:'0.75rem' }}>
                    <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{v}</div>
                  </div>
                ))}
              </div>

              {detail.description && (
                <div style={{ background:'#f8faff', borderRadius:10, padding:'0.875rem', marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Deskripsi</div>
                  <p style={{ fontSize:'0.875rem', lineHeight:1.6 }}>{detail.description}</p>
                </div>
              )}

              <div style={{ display:'flex', gap:10, paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
                {(detail.stock_available ?? detail.stock) > 0 && detail.status !== 'repair' && (
                  <button onClick={() => { setDetail(null); navigate('/borrowings/request') }} style={{ flex:1, padding:'0.75rem', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontWeight:700 }}>
                    📋 Ajukan Pinjam
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button onClick={() => { setDetail(null); setQrAsset(detail) }} style={{ flex:1, padding:'0.75rem', background:'linear-gradient(135deg,#0f172a,#1e293b)', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', fontWeight:700 }}>🖨️ QR</button>
                    <button onClick={() => { setDetail(null); navigate('/assets/tambah', { state:{ edit:detail } }) }} style={{ padding:'0.75rem 1.25rem', background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:12, cursor:'pointer', fontWeight:700 }}>✏️</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrAsset && (
        <div className="animate-fade-in" onClick={() => setQrAsset(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, backdropFilter:'blur(4px)' }}>
          <div className="animate-bounce-in" onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, padding:'1.5rem', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', minWidth:300 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
              <h3 style={{ fontWeight:800 }}>🖨️ QR Code Aset</h3>
              <button onClick={() => setQrAsset(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer' }}>✕</button>
            </div>
            <AssetQRLabel asset={qrAsset} />
          </div>
        </div>
      )}
    </div>
  )
}

const btnPrimary = { padding:'0.65rem 1.25rem', background:'linear-gradient(135deg,var(--primary),var(--purple))', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.875rem', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }
const chip       = { background:'#f1f5f9', padding:'0.1rem 0.5rem', borderRadius:6, fontSize:'0.72rem', color:'var(--text-muted)' }