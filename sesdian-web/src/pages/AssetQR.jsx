import { useEffect, useState } from 'react'
import api from '../api/axios'
import QRCode from 'qrcode'

export default function AssetQR() {
  const [assets, setAssets]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    api.get('/assets').then(r => setAssets(r.data.data || r.data)).finally(() => setLoading(false))
  }, [])

  // Group by location
  const rooms = [...new Set(assets.map(a => a.location || 'Tanpa Lokasi'))]

  const toggle = (location) => setSelected(prev =>
    prev.includes(location) ? prev.filter(x => x !== location) : [...prev, location]
  )
  const selectAll = () => setSelected(rooms)
  const clearAll  = () => setSelected([])

  const handlePrint = async () => {
    const selectedRooms = rooms.filter(r => selected.includes(r))
    const qrDataUrls = await Promise.all(
      selectedRooms.map(room => {
        const url = `${window.location.origin}/qr-room/${encodeURIComponent(room)}`
        return QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark:'#0f172a', light:'#ffffff' } })
          .then(dataUrl => ({ room, dataUrl, assets: assets.filter(a => (a.location || 'Tanpa Lokasi') === room) }))
      })
    )

    const html = `
      <html><head><title>QR Ruangan SESDIAN</title>
      <style>
        body { font-family: sans-serif; margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; padding: 16px; }
        .card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
        .card img { width: 140px; height: 140px; }
        h3 { margin: 8px 0 4px; font-size: 0.95rem; }
        .sub { font-size: 0.72rem; color: #64748b; margin-top: 4px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <div class="grid">
        ${qrDataUrls.map(({ room, dataUrl, assets }) => `
          <div class="card">
            <img src="${dataUrl}" />
            <h3>📍 ${room}</h3>
            <div class="sub">${assets.length} aset terdaftar</div>
            <div class="sub">${assets.map(a => a.name).join(', ')}</div>
          </div>
        `).join('')}
      </div>
      </body></html>
    `
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:4 }}>🖨️ Cetak QR Code</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Pilih aset untuk dicetak label QR-nya</p>
      </div>

      <div className="animate-fade-up delay-1" style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={selectAll} style={{ padding:'0.5rem 1rem', background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>Pilih Semua</button>
        <button onClick={clearAll} style={{ padding:'0.5rem 1rem', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>Hapus Pilihan</button>
        <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{selected.length} aset dipilih</span>
        <button onClick={handlePrint} disabled={!selected.length} style={{
          marginLeft:'auto', padding:'0.6rem 1.25rem',
          background: selected.length ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
          color: selected.length ? '#fff' : '#94a3b8',
          border:'none', borderRadius:10, cursor:selected.length?'pointer':'not-allowed',
          fontWeight:700, fontSize:'0.875rem', transition:'all 0.2s',
        }}>🖨️ Print QR ({selected.length})</button>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:140 }} />)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
          {rooms.map((room, i) => {
            const isSelected = selected.includes(room)
            const roomAssets = assets.filter(a => (a.location || 'Tanpa Lokasi') === room)
            return (
              <div key={room} className={`animate-fade-up delay-${Math.min(i+1,5)}`}
                onClick={() => toggle(room)}
                style={{
                  background: isSelected ? 'var(--primary-light)' : '#fff',
                  borderRadius:14, padding:'1.25rem',
                  border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  cursor:'pointer', transition:'all 0.2s',
                  boxShadow: isSelected ? '0 4px 16px rgba(99,102,241,0.2)' : 'var(--shadow)',
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ width:40, height:40, background:'#f1f5f9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
                    🏠
                  </div>
                  <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${isSelected?'var(--primary)':'var(--border)'}`, background:isSelected?'var(--primary)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', color:'#fff' }}>
                    {isSelected && '✓'}
                  </div>
                </div>
                <div style={{ fontWeight:700, fontSize:'0.875rem', marginBottom:2 }}>📍 {room}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{roomAssets.length} aset terdaftar</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:4 }}>{roomAssets.map(a=>a.name).join(', ')}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}