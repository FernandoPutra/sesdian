import { useEffect, useState } from 'react'
import api from '../api/axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const months = Array.from({length:12},(_,i)=>({
  value: String(i+1).padStart(2,'0'),
  label: new Date(2000,i).toLocaleDateString('id-ID',{month:'long'}),
}))

const conditionLabel = { baik:'Baik', rusak_ringan:'Rusak Ringan', rusak_berat:'Rusak Berat' }
const statusLabel    = { pending:'Pending', approved:'Disetujui', borrowed:'Dipinjam', returned:'Dikembalikan', rejected:'Ditolak' }

export default function Reports() {
  const [year, setYear]     = useState(new Date().getFullYear())
  const [month, setMonth]   = useState(String(new Date().getMonth()+1).padStart(2,'0'))
  const [ownership, setOwnership] = useState('all')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  const yearList = Array.from({length:10},(_,i)=>new Date().getFullYear()-i)

  const load = async () => {
    setLoading(true)
    try {
      const monthParam = `${year}-${month}`
      const [bRes, aRes] = await Promise.all([
        api.get('/reports/borrowings', { params: { month: monthParam } }),
        api.get('/reports/assets', { params: ownership!=='all' ? { ownership } : {} }),
      ])
      setData({ borrowings: bRes.data, assets: aRes.data })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year, month, ownership])

  const exportExcel = () => {
    if (!data) return
    const transactions = (data.borrowings.data || []).map(b => ({
      'Nama Peminjam':   b.user?.name || '-',
      'NIP':             b.user?.nip  || '-',
      'Nama Barang':     b.asset?.name || '-',
      'Kode Aset':       b.asset?.code || '-',
      'Kategori':        b.asset?.category || '-',
      'Jenis (BMN)':     b.asset?.ownership || '-',
      'Kondisi Awal':    conditionLabel[b.condition_before] || '-',
      'Kondisi Akhir':   conditionLabel[b.condition_after]  || '-',
      'Tgl Pengajuan':   b.requested_at ? new Date(b.requested_at).toLocaleDateString('id-ID') : '-',
      'Tgl Kembali':     b.return_due || '-',
      'Tgl Dikembalikan':b.returned_at ? new Date(b.returned_at).toLocaleDateString('id-ID') : '-',
      'Status':          statusLabel[b.status] || b.status,
      'Alasan Tolak':    b.rejection_reason || '-',
    }))

    const summary = [
      { 'Statistik': 'Total Transaksi',    'Nilai': data.borrowings.total_transactions },
      { 'Statistik': 'Total Pending',      'Nilai': data.borrowings.total_pending },
      { 'Statistik': 'Total Disetujui',    'Nilai': data.borrowings.total_approved },
      { 'Statistik': 'Total Dikembalikan', 'Nilai': data.borrowings.total_returned },
      { 'Statistik': 'Total Ditolak',      'Nilai': data.borrowings.total_rejected },
      { 'Statistik': '---',                'Nilai': '---' },
      { 'Statistik': 'Total Aset',         'Nilai': data.assets.total },
      { 'Statistik': 'Aset BMN',           'Nilai': data.assets.bmn },
      { 'Statistik': 'Aset Non-BMN',       'Nilai': data.assets.non_bmn },
      { 'Statistik': 'Aset Tersedia',      'Nilai': data.assets.available },
      { 'Statistik': 'Aset Dipinjam',      'Nilai': data.assets.borrowed },
      { 'Statistik': 'Aset Maintenance',   'Nilai': data.assets.repair },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Transaksi')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary),      'Ringkasan')

    const buf = XLSX.write(wb, { bookType:'xlsx', type:'array' })
    saveAs(new Blob([buf], { type:'application/octet-stream' }), `Laporan_SESDIAN_${year}-${month}.xlsx`)
  }

  const exportPDF = () => {
    if (!data) return
    const rows = (data.borrowings.data || []).map(b => `
      <tr>
        <td>${b.user?.name||'-'}</td>
        <td>${b.asset?.name||'-'} <span style="font-size:10px;color:#64748b">${b.asset?.ownership||''}</span></td>
        <td>${b.requested_at ? new Date(b.requested_at).toLocaleDateString('id-ID') : '-'}</td>
        <td>${b.return_due||'-'}</td>
        <td>${conditionLabel[b.condition_before]||'-'} → ${conditionLabel[b.condition_after]||'-'}</td>
        <td style="color:${b.status==='returned'?'#166534':b.status==='rejected'?'#991b1b':'#1e40af'};font-weight:600">
          ${statusLabel[b.status]||b.status}
        </td>
      </tr>
    `).join('')

    const html = `
      <html><head><title>Laporan SESDIAN ${months.find(m=>m.value===month)?.label} ${year}</title>
      <style>
        body { font-family: sans-serif; margin: 24px; font-size: 12px; color: #0f172a; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .sub { color: #64748b; margin-bottom: 20px; font-size: 11px; }
        .stats { display: grid; grid-template-columns: repeat(6,1fr); gap: 8px; margin-bottom: 20px; }
        .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
        .stat-val { font-size: 20px; font-weight: 800; color: #6366f1; }
        .stat-lbl { font-size: 10px; color: #64748b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0f172a; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
        tr:nth-child(even) td { background: #f8faff; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>
        <h1>📋 Laporan SESDIAN</h1>
        <div class="sub">Periode: ${months.find(m=>m.value===month)?.label} ${year} · Dicetak: ${new Date().toLocaleDateString('id-ID')}</div>
        <div class="stats">
          <div class="stat"><div class="stat-val">${data.borrowings.total_transactions}</div><div class="stat-lbl">Total Transaksi</div></div>
          <div class="stat"><div class="stat-val">${data.borrowings.total_returned}</div><div class="stat-lbl">Dikembalikan</div></div>
          <div class="stat"><div class="stat-val">${data.borrowings.total_rejected}</div><div class="stat-lbl">Ditolak</div></div>
          <div class="stat"><div class="stat-val">${data.assets.total}</div><div class="stat-lbl">Total Aset</div></div>
          <div class="stat"><div class="stat-val">${data.assets.available}</div><div class="stat-lbl">Tersedia</div></div>
          <div class="stat"><div class="stat-val">${data.assets.borrowed}</div><div class="stat-lbl">Dipinjam</div></div>
        </div>
        <table>
          <thead><tr><th>Peminjam</th><th>Barang</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Kondisi</th><th>Status</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="6" style="text-align:center;color:#94a3b8">Tidak ada data</td></tr>'}</tbody>
        </table>
      </body></html>
    `
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const b = data?.borrowings
  const a = data?.assets

  return (
    <div>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>📊 Laporan & Monitoring</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Data periodik aset dan peminjaman</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportExcel} disabled={!data||loading} style={{ padding:'0.65rem 1.1rem', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.85rem', boxShadow:'0 4px 12px rgba(16,185,129,0.3)' }}>📥 Export Excel</button>
          <button onClick={exportPDF} disabled={!data||loading} style={{ padding:'0.65rem 1.1rem', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.85rem', boxShadow:'0 4px 12px rgba(239,68,68,0.3)' }}>🖨️ Print PDF</button>
        </div>
      </div>

      {/* Filter */}
      <div className="animate-fade-up delay-1" style={{ background:'#fff', borderRadius:16, padding:'1.25rem', boxShadow:'var(--shadow)', marginBottom:'1.25rem', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div>
          <label style={lb}>Tahun</label>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} style={sel}>
            {yearList.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={lb}>Bulan</label>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={sel}>
            {months.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lb}>Jenis Aset</label>
          <select value={ownership} onChange={e=>setOwnership(e.target.value)} style={sel}>
            <option value="all">Semua</option>
            <option value="BMN">BMN</option>
            <option value="Non-BMN">Non-BMN</option>
          </select>
        </div>
        <button onClick={load} style={{ alignSelf:'flex-end', padding:'0.65rem 1.25rem', background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>🔄 Muat Ulang</button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
          {[1,2,3,4,5,6].map(i=><div key={i} className="skeleton" style={{ height:90, borderRadius:12 }}/>)}
        </div>
      ) : b && a && (
        <>
          <div className="animate-fade-up delay-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
            {[
              { label:'Total Transaksi', value:b.total_transactions, grad:'linear-gradient(135deg,#6366f1,#8b5cf6)' },
              { label:'Dikembalikan',    value:b.total_returned,     grad:'linear-gradient(135deg,#10b981,#059669)' },
              { label:'Pending',         value:b.total_pending,      grad:'linear-gradient(135deg,#f59e0b,#d97706)' },
              { label:'Ditolak',         value:b.total_rejected,     grad:'linear-gradient(135deg,#ef4444,#dc2626)' },
              { label:'Aset Tersedia',   value:a.available,          grad:'linear-gradient(135deg,#3b82f6,#6366f1)' },
              { label:'Aset Dipinjam',   value:a.borrowed,           grad:'linear-gradient(135deg,#8b5cf6,#6366f1)' },
            ].map(s=>(
              <div key={s.label} style={{ background:s.grad, borderRadius:14, padding:'1.25rem', color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
                <div style={{ fontSize:'2rem', fontWeight:800 }}>{s.value}</div>
                <div style={{ fontSize:'0.8rem', opacity:0.8, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="animate-fade-up delay-3" style={{ background:'#fff', borderRadius:16, boxShadow:'var(--shadow)', overflow:'hidden' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontWeight:700 }}>Detail Transaksi — {months.find(m=>m.value===month)?.label} {year}</h3>
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{(b.data||[]).length} transaksi</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
                <thead style={{ background:'#f8faff' }}>
                  <tr>{['Peminjam','Barang (BMN)','Tgl Pinjam','Tgl Kembali','Kondisi Sebelum → Sesudah','Status'].map(h=>(
                    <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(b.data||[]).length===0 ? (
                    <tr><td colSpan={6} style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>Tidak ada data pada periode ini</td></tr>
                  ) : (b.data||[]).map(row=>{
                    const color = { returned:'#166534', rejected:'#991b1b', pending:'#854d0e', approved:'#1e40af', borrowed:'#5b21b6' }[row.status]||'#475569'
                    return (
                      <tr key={row.id} style={{ borderTop:'1px solid var(--border)', transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f8faff'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'0.75rem 1rem', fontSize:'0.85rem', fontWeight:600 }}>{row.user?.name||'-'}<div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>{row.user?.nip}</div></td>
                        <td style={{ padding:'0.75rem 1rem', fontSize:'0.85rem' }}>
                          {row.asset?.name||'-'}
                          {row.asset?.ownership && <span style={{ marginLeft:6, fontSize:'0.65rem', fontWeight:800, background:row.asset.ownership==='BMN'?'#dbeafe':'#fef9c3', color:row.asset.ownership==='BMN'?'#1e40af':'#854d0e', padding:'0.1rem 0.4rem', borderRadius:20 }}>{row.asset.ownership}</span>}
                        </td>
                        <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>{row.requested_at ? new Date(row.requested_at).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>{row.return_due||'-'}</td>
                        <td style={{ padding:'0.75rem 1rem', fontSize:'0.8rem' }}>
                          <span style={{ color:condColor(row.condition_before) }}>{conditionLabel[row.condition_before]||'-'}</span>
                          {row.condition_after && <> → <span style={{ color:condColor(row.condition_after) }}>{conditionLabel[row.condition_after]}</span></>}
                        </td>
                        <td style={{ padding:'0.75rem 1rem' }}>
                          <span style={{ background:`${color}15`, color, padding:'0.2rem 0.65rem', borderRadius:20, fontSize:'0.75rem', fontWeight:700 }}>{statusLabel[row.status]||row.status}</span>
                          {row.rejection_reason && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:2 }}>↳ {row.rejection_reason}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const condColor = c => ({ baik:'#166534', rusak_ringan:'#854d0e', rusak_berat:'#991b1b' }[c]||'#475569')
const lb  = { fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }
const sel = { padding:'0.6rem 0.875rem', borderRadius:8, border:'1.5px solid var(--border)', fontSize:'0.875rem', outline:'none', background:'#fff', cursor:'pointer' }