import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'

const statusConf = {
  available: { label:'✅ Tersedia',        bg:'#dcfce7', color:'#166534' },
  borrowed:  { label:'🔄 Dipinjam',        bg:'#dbeafe', color:'#1e40af' },
  reserved:  { label:'⏳ Dipesan',         bg:'#fef9c3', color:'#854d0e' },
  repair:    { label:'🔧 Maintenance',     bg:'#fee2e2', color:'#991b1b' },
}

export default function QRView() {
  const { code, location } = useParams()
  const [asset, setAsset]   = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (location) {
      // Mode ruangan
      api.get(`/assets/qr-room/${encodeURIComponent(location)}`)
        .then(r => setAssets(r.data.data || r.data))
        .catch(() => setError('Ruangan tidak ditemukan.'))
        .finally(() => setLoading(false))
    } else {
      // Mode aset tunggal (lama)
      api.get(`/assets/qr/${code}`)
        .then(r => setAsset(r.data))
        .catch(() => setError('Aset tidak ditemukan.'))
        .finally(() => setLoading(false))
    }
  }, [code, location])

  if (loading) return <p style={{ padding:'2rem' }}>Loading...</p>
  if (error)   return <p style={{ padding:'2rem', color:'red' }}>{error}</p>

  // Mode ruangan
  if (location) return (
    <div style={{ maxWidth:500, margin:'2rem auto', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'2rem', marginBottom:8 }}>📍</div>
        <h2 style={{ fontSize:'1.3rem', fontWeight:800 }}>{decodeURIComponent(location)}</h2>
        <p style={{ color:'#64748b', fontSize:'0.85rem' }}>{assets.length} aset terdaftar di ruangan ini</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {assets.map(a => {
          const sc = statusConf[a.status] || { label:a.status, bg:'#f1f5f9', color:'#475569' }
          return (
            <div key={a.id} style={{ background:'#fff', borderRadius:12, padding:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, background:'#f1f5f9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
                {a.type==='fixed'?'🔧':'🧴'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{a.name}</div>
                <div style={{ fontSize:'0.72rem', color:'#64748b', fontFamily:'monospace' }}>{a.code}</div>
                {a.type==='consumable' && <div style={{ fontSize:'0.72rem', color:'#10b981', fontWeight:600 }}>Stok: {a.stock_available}/{a.stock}</div>}
              </div>
              <span style={{ background:sc.bg, color:sc.color, padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700, flexShrink:0 }}>{sc.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Mode aset tunggal (lama)
  return (
    <div style={{ maxWidth:400, margin:'4rem auto', padding:'2rem', background:'#fff', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom:'1rem' }}>{asset.name}</h2>
      <p><strong>Kode:</strong> {asset.code}</p>
      <p><strong>Tipe:</strong> {asset.type}</p>
      <p><strong>Status:</strong> {asset.status}</p>
      <p><strong>Lokasi:</strong> {asset.location || '-'}</p>
      {asset.description && <p><strong>Deskripsi:</strong> {asset.description}</p>}
    </div>
  )
}