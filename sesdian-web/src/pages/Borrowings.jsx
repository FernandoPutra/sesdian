import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Borrowings() {
  const { isAdmin } = useAuth()
  const [list, setList]           = useState([])
  const [assets, setAssets]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [returnDue, setReturnDue] = useState('')
  const [notes, setNotes]         = useState('')
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/borrowings'), api.get('/assets')]).then(([b, a]) => {
      setList(b.data.data || b.data)
      setAssets((a.data.data || a.data).filter(x => x.status === 'available'))
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = list.filter(b => {
    const matchSearch = b.asset?.name?.toLowerCase().includes(search.toLowerCase()) || b.user?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const toggleId = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleRequest = async () => {
    setError('')
    if (!selectedIds.length) { setError('Pilih minimal 1 aset.'); return }
    if (!returnDue) { setError('Tanggal kembali wajib diisi.'); return }
    setSaving(true)
    try {
      await api.post('/borrowings/batch', { asset_ids: selectedIds, return_due: returnDue, notes })
      setShowForm(false); setSelectedIds([]); setReturnDue(''); setNotes(''); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan peminjaman.')
    } finally { setSaving(false) }
  }

  const handleCheckin = async id => {
    if (!confirm('Konfirmasi pengembalian aset ini?')) return
    await api.post(`/borrowings/${id}/checkin`).catch(() => {})
    load()
  }

  const statusConf = {
    pending:  { label: 'Pending',   bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
    approved: { label: 'Disetujui', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
    borrowed: { label: 'Dipinjam',  bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
    returned: { label: 'Kembali',   bg: '#dcfce7', color: '#166534', dot: '#10b981' },
    rejected: { label: 'Ditolak',   bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  }

  const stats = {
    pending:  list.filter(x => x.status==='pending').length,
    approved: list.filter(x => x.status==='approved').length,
    borrowed: list.filter(x => x.status==='borrowed').length,
    returned: list.filter(x => x.status==='returned').length,
  }

  return (
    <div>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Peminjaman Aset</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{list.length} total transaksi</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }} style={{
          padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg,#10b981,#059669)',
          color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
        >+ Ajukan Pinjam</button>
      </div>

      {/* Mini stats */}
      <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {Object.entries(stats).map(([k, v]) => {
          const sc = statusConf[k]
          return (
            <div key={k} onClick={() => setFilterStatus(filterStatus===k?'all':k)} style={{
              background: filterStatus===k ? sc.bg : '#fff', borderRadius: 12, padding: '1rem',
              border: `1.5px solid ${filterStatus===k ? sc.dot : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: sc.color }}>{v}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sc.label}</div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: '1rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Cari aset atau peminjam..."
          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
      </div>

      {/* Table */}
      <div className="animate-fade-up delay-3" style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>🔄</div>
            <p style={{ fontWeight: 600 }}>Tidak ada data peminjaman</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8faff' }}>
              <tr>{['Aset','Peminjam','Status','Jatuh Tempo','Tgl Pengajuan', isAdmin&&'Aksi'].filter(Boolean).map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const sc = statusConf[b.status] || { label: b.status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
                const overdue = b.status === 'borrowed' && new Date(b.return_due) < new Date()
                return (
                  <tr key={b.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                      {b.asset?.name || '-'}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{b.asset?.code}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{b.user?.name || '-'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: sc.bg, color: sc.color, padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontFamily: 'JetBrains Mono', color: overdue ? '#ef4444' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400 }}>
                      {b.return_due} {overdue && '⚠️'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(b.created_at).toLocaleDateString('id-ID')}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {b.status === 'approved' && (
                          <button onClick={() => handleCheckin(b.id)} style={{ padding: '0.35rem 0.8rem', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                            Check-in
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div className="animate-bounce-in" style={{ background: '#fff', borderRadius: 20, padding: '2rem', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>🔄 Ajukan Peminjaman</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Pilih aset yang ingin dipinjam</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem', borderLeft: '4px solid #ef4444' }}>{error}</div>}

            <label style={lb}>Pilih Aset {selectedIds.length > 0 && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>({selectedIds.length} dipilih)</span>}</label>
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem', maxHeight: 220, overflowY: 'auto' }}>
              {assets.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  📭 Tidak ada aset tersedia saat ini
                </div>
              ) : assets.map((a, i) => (
                <label key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem',
                  cursor: 'pointer', borderBottom: i < assets.length-1 ? '1px solid var(--border)' : 'none',
                  background: selectedIds.includes(a.id) ? 'var(--primary-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleId(a.id)}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{a.code} · {a.location || 'No location'}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 700 }}>Tersedia</span>
                </label>
              ))}
            </div>

            <label style={lb}>Tanggal Kembali *</label>
            <input type="date" value={returnDue} min={new Date(Date.now()+86400000).toISOString().split('T')[0]}
              onChange={e => setReturnDue(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />

            <label style={lb}>Catatan (opsional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Keperluan peminjaman..."
              style={{ width: '100%', padding: '0.65rem 0.875rem', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', height: 80, resize: 'vertical', marginBottom: '1.25rem', fontFamily: 'inherit' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRequest} disabled={saving} style={{
                flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', border: 'none', borderRadius: 10, cursor: saving?'not-allowed':'pointer',
                fontWeight: 700, opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Mengajukan...' : `Ajukan ${selectedIds.length ? `(${selectedIds.length} aset)` : ''}`}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.75rem 1.25rem', background: '#f1f5f9', color: 'var(--text-muted)', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lb = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }