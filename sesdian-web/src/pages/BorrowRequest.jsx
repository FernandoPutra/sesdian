import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusConf = {
  available: { label:'✅ Tersedia',        bg:'#dcfce7', color:'#166534', canSelect:true  },
  borrowed:  { label:'🔄 Sedang Dipinjam', bg:'#dbeafe', color:'#1e40af', canSelect:false },
  reserved:  { label:'⏳ Sudah Dipesan',   bg:'#fef9c3', color:'#854d0e', canSelect:false },
  repair:    { label:'🔧 Maintenance',     bg:'#fee2e2', color:'#991b1b', canSelect:false },
}

function formatWaNumber(phone) {
  if (!phone) return null
  let num = phone.replace(/\D/g, '')
  if (num.startsWith('0')) num = '62' + num.slice(1)
  if (!num.startsWith('62')) num = '62' + num
  return num
}

export default function BorrowRequest() {
  const navigate      = useNavigate()
  const { user }      = useAuth()
  const [assets, setAssets]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [quantities, setQuantities]   = useState({})
  const [returnDue, setReturnDue]     = useState('')
  const [notes, setNotes]             = useState('')
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [search, setSearch]           = useState('')
  const [filterShow, setFilterShow]   = useState('all')
  const [adminPhones, setAdminPhones] = useState([])

  useEffect(() => {
    api.get('/admins')
      .then(r => setAdminPhones((r.data.data || r.data).filter(u => u.phone)))
      .catch(() => console.warn('Gagal fetch admin phones'))
  }, [])

  useEffect(() => {
    api.get('/assets')
      .then(r => setAssets(r.data.data || r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = assets.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      (a.location||'').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterShow === 'all'        ? true :
      filterShow === 'available'  ? a.status === 'available' :
      a.status !== 'available'
    return matchSearch && matchFilter
  })

  const toggle = (id, canSelect, maxStock) => {
    if (!canSelect) return
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id)
        setQuantities(q => { const n = {...q}; delete n[id]; return n })
        return next
      }
      setQuantities(q => ({ ...q, [id]: 1 }))
      return [...prev, id]
    })
  }

  const setQty = (id, val, maxStock) => {
    const n = Math.max(1, Math.min(Number(val) || 1, maxStock || 999))
    setQuantities(q => ({ ...q, [id]: n }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!selectedIds.length) { setError('Pilih minimal 1 aset.'); return }
    if (!returnDue) { setError('Tanggal kembali wajib diisi.'); return }
    setSaving(true)
    try {
      await api.post('/borrowings/batch', {
        asset_ids:  selectedIds,
        return_due: returnDue,
        notes,
      })

      const asetList = selectedIds.map(id => {
        const a   = assets.find(x => x.id === id)
        const qty = quantities[id] || 1
        return `  • ${a?.name} (Kode: ${a?.code}) — Jumlah: ${qty} unit`
      }).join('\n')

      const tglKembali = new Date(returnDue).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
      const tglAjukan  = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })

      const msg =
        `📋 *PERMOHONAN PEMINJAMAN ASET — SESDIAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Kepada Yth.\n` +
        `*Bapak/Ibu Administrator SESDIAN*\n\n` +
        `Dengan hormat,\n` +
        `Yang bertanda tangan di bawah ini :\n\n` +
        `👤 *Nama*    : ${user?.name || '-'}\n` +
        `🪪 *NIP*     : ${user?.nip  || '-'}\n` +
        `📱 *No. HP*  : ${user?.phone || '-'}\n\n` +
        `Mengajukan permohonan izin peminjaman aset sebagai berikut :\n\n` +
        `📦 *Daftar Aset yang Dipinjam :*\n${asetList}\n\n` +
        `📅 *Tanggal Pengajuan* : ${tglAjukan}\n` +
        `📅 *Tanggal Kembali*   : ${tglKembali}\n` +
        `${notes ? `📝 *Keperluan*          : ${notes}\n` : ''}` +
        `\nDemikian permohonan ini saya sampaikan. ` +
        `Atas perhatian dan persetujuan Bapak/Ibu, saya ucapkan terima kasih.\n\n` +
        `Hormat saya,\n` +
        `*${user?.name || '-'}*\n` +
        `NIP. ${user?.nip || '-'}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Pesan ini dikirim otomatis oleh Sistem SESDIAN_`

      if (adminPhones.length === 0) {
        setError('Tidak ada admin dengan nomor WhatsApp terdaftar.')
        setSaving(false)
        return
      }

      adminPhones.forEach((admin, index) => {
        const num = formatWaNumber(admin.phone)
        if (num) {
          setTimeout(() => {
            window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
          }, index * 600)
        }
      })

      navigate('/borrowings')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan peminjaman.')
    } finally {
      setSaving(false)
    }
  }

  const availCount   = assets.filter(a => a.status === 'available').length
  const unavailCount = assets.filter(a => a.status !== 'available').length

  return (
    <div>
      <div className="animate-fade-up" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/borrowings')} style={backBtn}>← Kembali</button>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800 }}>Ajukan Peminjaman</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>
            <span style={{ color:'#10b981', fontWeight:700 }}>{availCount} tersedia</span>
            {unavailCount > 0 && <> · <span style={{ color:'#94a3b8' }}>{unavailCount} tidak tersedia</span></>}
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.5rem', alignItems:'start' }}>

        {/* ── LEFT: Pilih Aset ── */}
        <div>
          <div style={{ background:'#fff', borderRadius:14, padding:'1rem', boxShadow:'var(--shadow)', marginBottom:'1rem', display:'flex', gap:10, flexWrap:'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Cari nama, kode, atau lokasi..."
              style={{ flex:1, minWidth:180, padding:'0.6rem 0.875rem', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.875rem', outline:'none' }} />
            {[['all','Semua'],['available','Tersedia'],['unavailable','Tidak Tersedia']].map(([v,l]) => (
              <button key={v} onClick={() => setFilterShow(v)} style={{
                padding:'0.6rem 0.875rem', borderRadius:8,
                border:'1px solid var(--border)',
                background: filterShow===v ? 'var(--primary)' : '#fff',
                color:       filterShow===v ? '#fff' : 'var(--text-muted)',
                cursor:'pointer', fontSize:'0.78rem', fontWeight:600, transition:'all 0.2s',
              }}>{l}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:90, borderRadius:12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:16, color:'var(--text-muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:8 }}>📭</div>
              <p style={{ fontWeight:600 }}>Tidak ada aset ditemukan</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filtered.map((a, i) => {
                const sc        = statusConf[a.status] || { label:a.status, bg:'#f1f5f9', color:'#475569', canSelect:false }
                const isSel     = selectedIds.includes(a.id)
                const canSelect = sc.canSelect
                const qty       = quantities[a.id] || 1
                const maxStock  = a.stock_available || 1

                return (
                  <div key={a.id} className={`animate-fade-up delay-${Math.min(i+1,5)}`}
                    style={{
                      background:  !canSelect ? '#f8faff' : isSel ? 'var(--primary-light)' : '#fff',
                      borderRadius:12, padding:'0.875rem 1.25rem',
                      border:`2px solid ${!canSelect ? '#e2e8f0' : isSel ? 'var(--primary)' : 'var(--border)'}`,
                      cursor:      canSelect ? 'pointer' : 'not-allowed',
                      display:'flex', alignItems:'center', gap:12,
                      transition:'all 0.18s',
                      boxShadow:   isSel ? '0 4px 12px rgba(99,102,241,0.15)' : 'var(--shadow)',
                      opacity:     canSelect ? 1 : 0.6,
                      position:'relative',
                    }}
                    onClick={() => toggle(a.id, canSelect, maxStock)}
                  >
                    <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', background: !canSelect ? '#e2e8f0' : isSel ? 'var(--primary)' : '#f1f5f9', transition:'all 0.2s' }}>
                      {!canSelect ? '🔒' : a.type === 'fixed' ? '🔧' : '🧴'}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.9rem', color: isSel ? 'var(--primary)' : !canSelect ? '#94a3b8' : 'var(--text)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {a.name}
                        {!canSelect && <span style={{ fontSize:'0.68rem', fontWeight:800, background:'#fee2e2', color:'#991b1b', padding:'0.1rem 0.5rem', borderRadius:20 }}>Tidak Dapat Dipinjam</span>}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                        <span style={{ fontFamily:'JetBrains Mono' }}>{a.code}</span>
                        {a.location && <> · 📍 {a.location}</>}
                        {a.stock_available > 0 && <> · <span style={{ color:'#10b981', fontWeight:600 }}>Stok Tersedia: {a.stock_available}</span></>}
                        {a.type === 'fixed' && <> · Fixed Asset</>}
                      </div>
                    </div>

                    <span style={{ background:sc.bg, color:sc.color, padding:'0.25rem 0.65rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700, flexShrink:0 }}>{sc.label}</span>

                    {isSel && (
                      <div onClick={e => e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, background:'#fff', border:'1.5px solid var(--primary)', borderRadius:10, padding:'0.25rem 0.5rem' }}>
                        <button onClick={() => setQty(a.id, qty-1, maxStock)} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--primary-light)', color:'var(--primary)', cursor:'pointer', fontWeight:800, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                        <input
                          type="number" min={1} max={maxStock} value={qty}
                          onChange={e => setQty(a.id, e.target.value, maxStock)}
                          style={{ width:40, textAlign:'center', border:'none', outline:'none', fontWeight:700, fontSize:'0.9rem', color:'var(--primary)', background:'transparent' }}
                        />
                        <button onClick={() => setQty(a.id, qty+1, maxStock)} style={{ width:24, height:24, borderRadius:6, border:'none', background:'var(--primary-light)', color:'var(--primary)', cursor:'pointer', fontWeight:800, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      </div>
                    )}

                    {canSelect && (
                      <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${isSel?'var(--primary)':'var(--border)'}`, background:isSel?'var(--primary)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.8rem', flexShrink:0 }}>
                        {isSel && '✓'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Form Detail ── */}
        <div style={{ background:'#fff', borderRadius:16, padding:'1.5rem', boxShadow:'var(--shadow)', position:'sticky', top:'5rem' }}>
          <h3 style={{ fontWeight:800, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
            📋 Detail Peminjaman
            {selectedIds.length > 0 && (
              <span style={{ background:'var(--primary)', color:'#fff', width:22, height:22, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700 }}>{selectedIds.length}</span>
            )}
          </h3>

          {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.75rem', borderRadius:10, marginBottom:'1rem', fontSize:'0.85rem', borderLeft:'4px solid #ef4444' }}>{error}</div>}

          {selectedIds.length > 0 && (
            <div style={{ background:'#f8faff', borderRadius:10, padding:'0.75rem', marginBottom:'1rem', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Aset & Jumlah yang Dipinjam</div>
              {selectedIds.map(id => {
                const a   = assets.find(x => x.id === id)
                const qty = quantities[id] || 1
                if (!a) return null
                return (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', borderBottom:'1px solid #e2e8f0' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.82rem', fontWeight:700 }}>{a.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>{a.code}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'0.2rem 0.4rem' }}>
                      <button onClick={() => setQty(a.id, qty-1, a.stock_available || 1)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--primary-light)', color:'var(--primary)', cursor:'pointer', fontWeight:800, fontSize:'0.85rem' }}>−</button>
                      <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--primary)', minWidth:20, textAlign:'center' }}>{qty}</span>
                      <button onClick={() => setQty(a.id, qty+1, a.stock_available || 1)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--primary-light)', color:'var(--primary)', cursor:'pointer', fontWeight:800, fontSize:'0.85rem' }}>+</button>
                    </div>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>unit</span>
                    <button onClick={() => toggle(id, true, 1)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.85rem', padding:'0 2px' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}

          {user && (
            <div style={{ background:'linear-gradient(135deg,#f8faff,#eff6ff)', borderRadius:10, padding:'0.75rem', marginBottom:'1rem', border:'1px solid #dbeafe' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--primary)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>👤 Data Peminjam</div>
              <div style={{ fontSize:'0.8rem', color:'var(--text)' }}>
                <div style={{ fontWeight:700 }}>{user.name}</div>
                <div style={{ color:'var(--text-muted)', fontFamily:'JetBrains Mono', fontSize:'0.75rem' }}>{user.nip}</div>
                {user.phone && <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>📱 {user.phone}</div>}
              </div>
            </div>
          )}

          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Tanggal Kembali *</label>
            <input type="date" value={returnDue}
              min={new Date(Date.now()+86400000).toISOString().split('T')[0]}
              onChange={e => setReturnDue(e.target.value)} style={inp}
              onFocus={e => e.target.style.borderColor='var(--primary)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'} />
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <label style={lb}>Keperluan / Catatan (opsional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Jelaskan keperluan peminjaman aset ini..."
              style={{ ...inp, height:80, resize:'vertical', fontFamily:'Plus Jakarta Sans,sans-serif' }} />
          </div>

          {selectedIds.length > 0 && returnDue && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'0.72rem', color:'#166534', fontWeight:700, marginBottom:4 }}>📱 Setelah diajukan</div>
              <div style={{ fontSize:'0.75rem', color:'#166534' }}>
                Permintaan akan tersimpan & WhatsApp Admin akan terbuka otomatis dengan format surat permohonan resmi.
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving || !selectedIds.length} style={{
            width:'100%', padding:'0.875rem',
            background: selectedIds.length ? 'linear-gradient(135deg,#10b981,#059669)' : '#e2e8f0',
            color:       selectedIds.length ? '#fff' : '#94a3b8',
            border:'none', borderRadius:12,
            cursor: (!saving && selectedIds.length) ? 'pointer' : 'not-allowed',
            fontWeight:700, fontSize:'0.9rem', transition:'all 0.2s',
            boxShadow: selectedIds.length ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
          }}>
            {saving ? '⏳ Mengajukan...'
              : selectedIds.length
              ? `✅ Ajukan & Kirim WA Admin (${selectedIds.length} aset)`
              : 'Pilih aset yang tersedia'}
          </button>

          {!selectedIds.length && (
            <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--text-muted)', marginTop:8 }}>
              Hanya aset <strong style={{ color:'#10b981' }}>✅ Tersedia</strong> yang dapat dipilih
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const lb      = { fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }
const inp     = { display:'block', width:'100%', padding:'0.65rem 0.875rem', borderRadius:10, border:'1.5px solid var(--border)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }
const backBtn = { background:'#f1f5f9', border:'none', borderRadius:8, padding:'0.5rem 0.75rem', cursor:'pointer', fontSize:'0.85rem', color:'#64748b', fontWeight:600 }