import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

export default function AssetQRLabel({ asset }) {
  const canvasRef = useRef()
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!asset) return
    const url = `${window.location.origin}/qr/${asset.code}`
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark:'#0f172a', light:'#ffffff' } })
      .then(setDataUrl)
  }, [asset])

  const handlePrint = () => {
    const html = `
      <html><head><title>QR - ${asset.name}</title>
      <style>
        * { margin:0;padding:0;box-sizing:border-box; }
        body { font-family: sans-serif; display:flex; justify-content:center; padding:16px; }
        .label { border:2px solid #0f172a; border-radius:12px; padding:16px; width:220px; text-align:center; }
        .label img { width:160px; height:160px; }
        .name { font-size:13px; font-weight:700; margin:8px 0 4px; }
        .code { font-size:10px; color:#64748b; font-family:monospace; background:#f1f5f9; padding:2px 8px; border-radius:4px; display:inline-block; }
        .cat { font-size:10px; color:#94a3b8; margin-top:4px; }
        @media print { body { padding:0; } }
      </style></head>
      <body>
        <div class="label">
          <img src="${dataUrl}" />
          <div class="name">${asset.name}</div>
          <div class="code">${asset.code}</div>
          ${asset.category ? `<div class="cat">${asset.category}</div>` : ''}
          ${asset.location ? `<div class="cat">📍 ${asset.location}</div>` : ''}
        </div>
      </body></html>
    `
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  return (
    <div style={{ textAlign:'center' }}>
      {/* Preview Label */}
      <div style={{ border:'2px solid #0f172a', borderRadius:12, padding:'1rem', display:'inline-block', marginBottom:'1rem', background:'#fff' }}>
        {dataUrl ? (
          <img src={dataUrl} alt="QR" style={{ width:160, height:160 }} />
        ) : (
          <div style={{ width:160, height:160, background:'#f1f5f9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.8rem' }}>Generating...</div>
        )}
        <div style={{ fontWeight:700, fontSize:'0.875rem', marginTop:8 }}>{asset.name}</div>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.72rem', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:4 }}>{asset.code}</div>
        {asset.category && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:4 }}>{asset.category}</div>}
        {asset.location && <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>📍 {asset.location}</div>}
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        <button onClick={handlePrint} disabled={!dataUrl} style={{
          padding:'0.65rem 1.5rem', background:'linear-gradient(135deg,#0f172a,#1e293b)',
          color:'#fff', border:'none', borderRadius:10, cursor:dataUrl?'pointer':'not-allowed',
          fontWeight:700, fontSize:'0.875rem',
        }}>🖨️ Print Label</button>
      </div>
    </div>
  )
}