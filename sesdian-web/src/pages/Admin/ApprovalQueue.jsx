import { useEffect, useState, useRef } from 'react'
import api from '../../api/axios'
import jsPDF from 'jspdf'

function formatWaNumber(phone) {
  if (!phone) return null
  let num = phone.replace(/\D/g, '')
  if (num.startsWith('0')) num = '62' + num.slice(1)
  if (!num.startsWith('62')) num = '62' + num
  return num
}

function generateSuratPDF(borrowing, admin) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now  = new Date()
  const tgl  = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const pageW = 210
  const ml    = 25
  const mr    = 25
  const cw    = pageW - ml - mr

  // ── HEADER ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('SURAT IZIN PEMAKAIAN BARANG / ASET', pageW / 2, 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Sistem Pengelolaan Aset — SESDIAN', pageW / 2, 28, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(ml, 32, pageW - mr, 32)
  doc.setLineWidth(0.2)
  doc.line(ml, 33.5, pageW - mr, 33.5)

  let y = 42

  // ── Pembuka ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Yang bertanda tangan di bawah ini :', ml, y)
  y += 8

  const fieldLeft = (label, value) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, ml + 4, y)
    doc.text(':', ml + 35, y)
    doc.setFont('helvetica', 'bold')
    doc.text(value || '-', ml + 40, y)
    doc.setFont('helvetica', 'normal')
    y += 7
  }

  fieldLeft('Nama',    admin?.name || 'Administrator SESDIAN')
  fieldLeft('NIP',     admin?.nip  || '—')
  fieldLeft('Jabatan', 'Penanggung Jawab Aset / Kendaraan Dinas')

  y += 3
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Selaku penanggung jawab barang/aset dinas.', ml, y)
  y += 7
  doc.text('Memberi izin kepada :', ml, y)
  y += 8

  fieldLeft('Nama',    borrowing.user?.name)
  fieldLeft('NIP',     borrowing.user?.nip)
  fieldLeft('No. HP',  borrowing.user?.phone)

  y += 3
  doc.setFontSize(11)
  doc.text('Untuk menggunakan / meminjam aset operasional berikut :', ml, y)
  y += 10

  // ── Detail Aset ──
  const detailField = (label, value) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, ml + 4, y)
    doc.text(':', ml + 50, y)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value || '-'), ml + 55, y)
    doc.setFont('helvetica', 'normal')

    // Garis isian
    doc.setLineWidth(0.15)
    doc.line(ml + 55, y + 1, pageW - mr, y + 1)
    y += 8
  }

  detailField('Nama Barang / Aset',   borrowing.asset?.name)
  detailField('Kode Aset',            borrowing.asset?.code)
  detailField('Merek / Brand',        borrowing.asset?.brand)
  detailField('Kategori',             borrowing.asset?.category)
  detailField('Ruangan / Lokasi',     borrowing.asset?.location)
  detailField('Kondisi Saat Dipinjam', borrowing.asset?.condition === 'baik' ? 'Baik' : borrowing.asset?.condition === 'rusak_ringan' ? 'Rusak Ringan' : 'Rusak Berat')
  detailField('Keperluan / Catatan',  borrowing.notes)
  detailField('Tanggal Pengajuan',    borrowing.requested_at ? new Date(borrowing.requested_at).toLocaleDateString('id-ID') : '-')
  detailField('Tanggal Pemakaian',    borrowing.requested_at ? new Date(borrowing.requested_at).toLocaleDateString('id-ID') : '-')
  detailField('s/d (Tanggal Kembali)',borrowing.return_due)
  detailField('Nomor Surat',          `SESDIAN/${now.getFullYear()}/${String(borrowing.id).padStart(4,'0')}`)

  y += 4

  // ── Ketentuan ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const ketentuan =
    'Dengan ketentuan pemakai bertanggung jawab terhadap resiko kehilangan, serta kerusakan ' +
    'yang terjadi selama dalam pemakaian dan menanggung biaya operasional. Wajib mengembalikan ' +
    'setelah pemakaian dalam keadaan baik dan bersih. Kerusakan yang terjadi akibat kelalaian ' +
    'pemakai menjadi tanggung jawab pemakai sepenuhnya.'
  const lines = doc.splitTextToSize(ketentuan, cw)
  doc.text(lines, ml, y)
  y += lines.length * 5 + 8

  // ── Tanda Tangan ──
  doc.setFontSize(11)
  doc.text(`Bandar Lampung, ${tgl}`, pageW - mr - 60, y, { align: 'right' })
  y += 6

  // Kolom kiri
  doc.text('Penanggung Jawab', ml, y)
  doc.text('Pemakai,', pageW - mr - 30, y)
  y += 5
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text('(Kepala Bagian / Admin SESDIAN)', ml, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  y += 30

  // Tanda tangan kiri (admin)
  doc.text('(', ml, y)
  doc.text(')', ml + 55, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(admin?.name || '', ml + 4, y - 4, { maxWidth: 50 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setLineWidth(0.3)
  doc.line(ml + 3, y, ml + 54, y)
  doc.text('NIP. ' + (admin?.nip || '—'), ml, y + 5)

  // Tanda tangan kanan (peminjam)
  const rx = pageW - mr - 60
  doc.text('(', rx, y)
  doc.text(')', rx + 55, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(borrowing.user?.name || '', rx + 4, y - 4, { maxWidth: 50 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.line(rx + 3, y, rx + 54, y)
  doc.text('NIP. ' + (borrowing.user?.nip || ''), rx, y + 5)

  // ── Footer ──
  y += 18
  doc.setLineWidth(0.3)
  doc.line(ml, y, pageW - mr, y)
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Dokumen ini diterbitkan secara otomatis oleh Sistem SESDIAN — Asset Management System', pageW / 2, y + 5, { align: 'center' })
  doc.text(`Dicetak pada: ${now.toLocaleString('id-ID')}`, pageW / 2, y + 9, { align: 'center' })

  return doc
}

export default function ApprovalQueue() {
  const [list, setList]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [acting, setActing]           = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason]           = useState('')
  const [approveModal, setApproveModal] = useState(null)
  const [pdfUrl, setPdfUrl]           = useState(null)
  const [admin, setAdmin]             = useState(null)
  const iframeRef                     = useRef()

  const load = () => {
    setLoading(true)
    api.get('/borrowings').then(r => {
      setList((r.data.data || r.data).filter(b => b.status === 'pending'))
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Ambil data admin yang sedang login
    api.get('/me').then(r => {
      setAdmin(r.data.data || r.data)
    }).catch(() => {})
  }, [])

  // Buka preview PDF approve
  const openApprovePreview = (b) => {
    const doc  = generateSuratPDF(b, admin)
    const url  = doc.output('bloburl')
    setPdfUrl(url)
    setApproveModal(b)
  }

  // Konfirmasi setuju → kirim API → buka WA
  const confirmApprove = async () => {
    if (!approveModal) return
    setActing(`${approveModal.id}-approve`)
    try {
      await api.post(`/borrowings/${approveModal.id}/approve`)

      // Download PDF
      const doc = generateSuratPDF(approveModal, admin)
      doc.save(`Surat_Izin_${approveModal.asset?.name}_${approveModal.user?.name}.pdf`)

      // Buka WA
      const msg =
        `✅ *SESDIAN — Peminjaman Disetujui*\n\n` +
        `Halo *${approveModal.user?.name}*,\n\n` +
        `Permohonan izin pemakaian aset Anda telah *DISETUJUI*.\n\n` +
        `📦 *${approveModal.asset?.name}*\n` +
        `🔖 Kode: ${approveModal.asset?.code}\n` +
        `📅 Tanggal Kembali: *${approveModal.return_due}*\n\n` +
        `Surat Izin Pemakaian telah dikirimkan. Silakan ambil barang ke petugas.\n\n` +
        `_Terima kasih — SESDIAN Asset Management_`

      const num = formatWaNumber(approveModal.user?.phone)
      if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')

    } catch (err) {
      alert('Gagal menyetujui: ' + (err.response?.data?.message || err.message))
    } finally {
      setActing(null)
      setApproveModal(null)
      setPdfUrl(null)
      load()
    }
  }

  // Reject
  const openReject   = (b) => { setRejectModal(b); setReason('') }
  const handleReject = async () => {
    if (!reason.trim()) return
    setActing(`${rejectModal.id}-reject`)
    try {
      await api.post(`/borrowings/${rejectModal.id}/reject`, { rejection_reason: reason })
      const msg =
        `❌ *SESDIAN — Peminjaman Ditolak*\n\n` +
        `Halo *${rejectModal.user?.name}*,\n\n` +
        `Mohon maaf, permohonan izin pemakaian aset:\n` +
        `📦 *${rejectModal.asset?.name}*\n\n` +
        `*DITOLAK* dengan alasan:\n📝 ${reason}\n\n` +
        `Silakan hubungi admin untuk informasi lebih lanjut.\n\n` +
        `_SESDIAN Asset Management_`
      const num = formatWaNumber(rejectModal.user?.phone)
      if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
    } catch (err) {
      alert('Gagal menolak: ' + (err.response?.data?.message || err.message))
    } finally {
      setRejectModal(null); setReason(''); setActing(null); load()
    }
  }

  return (
    <div>
      <div className="animate-fade-up" style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>✅ Antrian Approval</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{list.length} permintaan menunggu persetujuan</p>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:16 }} />)}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign:'center', padding:'6rem 0', background:'#fff', borderRadius:20, boxShadow:'var(--shadow)' }}>
          <div style={{ fontSize:'4rem', marginBottom:16 }}>🎉</div>
          <h3 style={{ fontWeight:700, marginBottom:8 }}>Semua sudah ditangani!</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Tidak ada permintaan yang menunggu.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {list.map((b, i) => (
            <div key={b.id} className={`animate-fade-up delay-${Math.min(i+1,5)}`} style={{ background:'#fff', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'var(--shadow)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap', transition:'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}
            >
              <div style={{ width:52, height:52, borderRadius:14, flexShrink:0, background:'linear-gradient(135deg,#fef9c3,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>⏳</div>

              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:3, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  {b.asset?.name}
                  {b.asset?.ownership && (
                    <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'0.15rem 0.45rem', borderRadius:20, background:b.asset.ownership==='BMN'?'#dbeafe':'#fef9c3', color:b.asset.ownership==='BMN'?'#1e40af':'#854d0e' }}>{b.asset.ownership}</span>
                  )}
                </div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:2 }}>
                  👤 <strong>{b.user?.name}</strong> · <span style={{ fontFamily:'JetBrains Mono' }}>{b.user?.nip}</span>
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', gap:14, flexWrap:'wrap' }}>
                  <span>📅 Kembali: <strong style={{ fontFamily:'JetBrains Mono' }}>{b.return_due}</strong></span>
                  {b.user?.phone && <span>📱 {b.user.phone}</span>}
                  {b.notes && <span>📝 {b.notes}</span>}
                </div>
              </div>

              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => openApprovePreview(b)} disabled={acting===`${b.id}-approve`} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'0.6rem 1.1rem',
                  background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff',
                  border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
                  boxShadow:'0 2px 8px rgba(16,185,129,0.35)', transition:'transform 0.15s',
                  opacity: acting===`${b.id}-approve` ? 0.6 : 1,
                }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                >✅ Setuju + WA</button>

                <button onClick={() => openReject(b)} disabled={acting===`${b.id}-reject`} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'0.6rem 1.1rem',
                  background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff',
                  border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
                  boxShadow:'0 2px 8px rgba(239,68,68,0.35)', transition:'transform 0.15s',
                  opacity: acting===`${b.id}-reject` ? 0.6 : 1,
                }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                >❌ Tolak + WA</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── APPROVE MODAL: Preview PDF Surat Izin ── */}
      {approveModal && (
        <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'1rem' }}>
          <div className="animate-bounce-in" style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:820, maxHeight:'95vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.4)', overflow:'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:'20px 20px 0 0' }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', marginBottom:2 }}>📄 Preview Surat Izin Pemakaian</h2>
                <p style={{ color:'#94a3b8', fontSize:'0.78rem' }}>Periksa dokumen sebelum menyetujui dan mengirim ke peminjam</p>
              </div>
              <button onClick={() => { setApproveModal(null); setPdfUrl(null) }} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', fontSize:'1rem' }}>✕</button>
            </div>

            {/* Info peminjaman */}
            <div style={{ padding:'0.875rem 1.5rem', background:'#f8faff', borderBottom:'1px solid var(--border)', display:'flex', gap:'2rem', flexWrap:'wrap' }}>
              {[
                ['Peminjam', approveModal.user?.name],
                ['NIP',      approveModal.user?.nip],
                ['Aset',     approveModal.asset?.name],
                ['Kembali',  approveModal.return_due],
                ['No. HP',   approveModal.user?.phone],
              ].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{l}</div>
                  <div style={{ fontSize:'0.875rem', fontWeight:600, marginTop:2 }}>{v||'-'}</div>
                </div>
              ))}
            </div>

            {/* PDF Iframe */}
            <div style={{ flex:1, overflow:'hidden', minHeight:400 }}>
              {pdfUrl ? (
                <iframe ref={iframeRef} src={pdfUrl} style={{ width:'100%', height:'100%', minHeight:400, border:'none' }} title="Surat Izin" />
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400, color:'var(--text-muted)' }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'3rem', marginBottom:8 }}>⏳</div>
                    <p>Memuat dokumen...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer actions */}
            <div style={{ padding:'1.25rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center', background:'#fafafa' }}>
              <div style={{ flex:1, fontSize:'0.78rem', color:'var(--text-muted)' }}>
                📱 Setelah klik <strong>Setujui & Kirim</strong>, PDF akan otomatis diunduh dan WhatsApp akan terbuka untuk dikirim ke <strong>{approveModal.user?.name}</strong>
              </div>
              <button onClick={() => {
                const doc = generateSuratPDF(approveModal, admin)
                doc.save(`Surat_Izin_${approveModal.asset?.name}.pdf`)
              }} style={{ padding:'0.65rem 1.1rem', background:'#1e293b', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                📥 Download PDF
              </button>
              <button onClick={confirmApprove} disabled={acting===`${approveModal.id}-approve`} style={{
                padding:'0.75rem 1.5rem',
                background:'linear-gradient(135deg,#10b981,#059669)',
                color:'#fff', border:'none', borderRadius:12, cursor:'pointer',
                fontWeight:700, fontSize:'0.9rem',
                boxShadow:'0 4px 16px rgba(16,185,129,0.35)',
                opacity: acting===`${approveModal.id}-approve` ? 0.6 : 1,
                display:'flex', alignItems:'center', gap:8,
              }}>
                {acting===`${approveModal.id}-approve` ? '⏳ Memproses...' : '✅ Setujui & Kirim WA'}
              </button>
              <button onClick={() => { setApproveModal(null); setPdfUrl(null) }} style={{ padding:'0.75rem 1.25rem', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:12, cursor:'pointer', fontWeight:600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
          <div className="animate-bounce-in" style={{ background:'#fff', borderRadius:20, padding:'2rem', width:500, boxShadow:'0 24px 64px rgba(0,0,0,0.35)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontWeight:800, color:'#ef4444', fontSize:'1.15rem' }}>❌ Tolak Peminjaman</h2>
              <button onClick={() => setRejectModal(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:'0.9rem' }}>✕</button>
            </div>

            <div style={{ background:'#f8faff', borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1.25rem', border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>{rejectModal.asset?.name}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                👤 {rejectModal.user?.name} · 📱 {rejectModal.user?.phone || 'No HP tidak tersedia'}
              </div>
            </div>

            <div style={{ marginBottom:'1.25rem' }}>
              <label style={lb}>Alasan Penolakan * <span style={{ color:'#ef4444' }}>(wajib)</span></label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Contoh: Aset sedang dalam perbaikan / tidak tersedia pada tanggal yang diminta..."
                style={{ display:'block', width:'100%', padding:'0.75rem 1rem', borderRadius:10, border:`1.5px solid ${reason?'var(--border)':'#ef4444'}`, fontSize:'0.875rem', outline:'none', boxSizing:'border-box', height:100, resize:'vertical', fontFamily:'Plus Jakarta Sans,sans-serif', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='var(--primary)'}
                onBlur={e  => e.target.style.borderColor=reason?'var(--border)':'#ef4444'} />
            </div>

            {reason.trim() && (
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'0.875rem', marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#c2410c', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>📱 Preview Pesan WA</div>
                <div style={{ fontSize:'0.78rem', color:'#0f172a', lineHeight:1.7, fontFamily:'monospace', whiteSpace:'pre-wrap' }}>
{`❌ SESDIAN — Peminjaman Ditolak

Halo ${rejectModal.user?.name},

Permintaan izin pemakaian:
📦 ${rejectModal.asset?.name}

DITOLAK dengan alasan:
📝 ${reason}

Hubungi admin untuk info lebih lanjut.
— SESDIAN Asset Management`}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleReject} disabled={!reason.trim()||acting===`${rejectModal.id}-reject`} style={{
                flex:1, padding:'0.8rem',
                background:'linear-gradient(135deg,#ef4444,#dc2626)',
                color:'#fff', border:'none', borderRadius:12,
                cursor: reason.trim() ? 'pointer' : 'not-allowed',
                fontWeight:700, opacity:(!reason.trim()||acting)?0.6:1,
              }}>❌ Tolak & Buka WA</button>
              <button onClick={() => setRejectModal(null)} style={{ padding:'0.8rem 1.25rem', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:12, cursor:'pointer', fontWeight:600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lb = { fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }