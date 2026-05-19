import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getRooms } from './Admin/Rooms'
import { getCategories } from './Admin/Categories'

function compressImage(file, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const ratio  = Math.min(maxWidth / img.width, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1996 }, (_, i) => currentYear - i)

export default function AssetAdd() {
  const navigate   = useNavigate()
  const fileRef    = useRef()
  const [rooms, setRooms]         = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm]           = useState({
    code:'', name:'', type:'fixed', status:'available',
    description:'', stock:1, location:'', category:'',
    brand:'', acquisition_year: currentYear,
    condition:'baik', ownership:'BMN',
  })
  const [photo, setPhoto]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [compressing, setCompressing] = useState(false)
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [stockInput, setStockInput] = useState('1')

  useEffect(() => {
    setRooms(getRooms())
    setCategories(getCategories())
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCompressing(true)
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPreview(URL.createObjectURL(compressed))
    setCompressing(false)
  }

  const handleSubmit = async () => {
    setError(''); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      await api.post('/assets', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      navigate('/assets')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {}).flat().join(' | ') ||
        'Gagal menyimpan.'
      )
    } finally { setSaving(false) }
  }

  const handleStockChange = (e) => {
    const raw = e.target.value
    setStockInput(raw)
    const val = parseInt(raw, 10)
    if (!isNaN(val) && val >= 1) set('stock', val)
  }

  return (
    <div>
      <div className="animate-fade-up" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/assets')} style={backBtn}>← Kembali</button>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800 }}>Tambah Aset Baru</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Input data aset ke sistem</p>
        </div>
      </div>

      <div className="animate-fade-up delay-1" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.5rem', alignItems:'start' }}>

        {/* LEFT */}
        <div style={card}>
          {error && <div style={errBox}>{error}</div>}

          {/* Jenis Aset BMN/Non-BMN */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={lb}>Jenis Aset *</label>
            <div style={{ display:'flex', gap:12 }}>
              {['BMN','Non-BMN'].map(v => (
                <label key={v} style={{
                  flex:1, display:'flex', alignItems:'center', gap:10, padding:'0.75rem 1rem',
                  border:`2px solid ${form.ownership===v ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius:10, cursor:'pointer',
                  background: form.ownership===v ? 'var(--primary-light)' : '#fafafa',
                  transition:'all 0.2s',
                }}>
                  <input type="radio" name="ownership" value={v} checked={form.ownership===v} onChange={e=>set('ownership',e.target.value)} style={{ accentColor:'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color: form.ownership===v ? 'var(--primary)' : 'var(--text)' }}>{v}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{v==='BMN' ? 'Barang Milik Negara' : 'Barang Non-Negara'}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Kode Aset */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Kode Aset *</label>
            <input value={form.code} onChange={e=>set('code',e.target.value)} placeholder="Kode unik aset" style={inp}
              onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>

          {/* Nama Aset */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Nama Aset *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nama aset" style={inp}
              onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>

          {/* Brand */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Merk / Brand</label>
            <input value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="Merk atau brand" style={inp}
              onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>

          {/* Tahun Perolehan */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Tahun Perolehan</label>
            <select value={form.acquisition_year} onChange={e=>set('acquisition_year',e.target.value)} style={sel}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Kategori */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Kategori</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={sel}>
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Ruangan */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Ruangan *</label>
            <select value={form.location} onChange={e=>set('location',e.target.value)} style={sel}>
              <option value="">-- Pilih Ruangan --</option>
              {rooms.map(r => <option key={r.id} value={r.name}>{r.name} ({r.code})</option>)}
            </select>
            {rooms.length===0 && <p style={{ color:'#f59e0b', fontSize:'0.72rem', marginTop:4 }}>⚠️ Tambahkan ruangan dulu di menu Ruangan</p>}
          </div>

          {/* Jumlah Barang — merged dropdown + manual input */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Jumlah Barang *</label>
            <div style={{ position:'relative' }}>
              <input
                type="number"
                min="1"
                value={stockInput}
                onChange={handleStockChange}
                placeholder="Ketik jumlah..."
                style={{
                  ...inp,
                  paddingRight:'3rem',
                  MozAppearance:'textfield',
                }}
                onFocus={e=>e.target.style.borderColor='var(--primary)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
              <div style={{ position:'absolute', right:0, top:0, bottom:0, display:'flex', flexDirection:'column', borderLeft:'1.5px solid var(--border)', borderRadius:'0 10px 10px 0', overflow:'hidden' }}>
                <button
                  type="button"
                  onClick={() => { const v = (form.stock||0)+1; setStockInput(String(v)); set('stock',v) }}
                  style={{ flex:1, padding:'0 10px', background:'#f8fafc', border:'none', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1, borderBottom:'0.75px solid var(--border)' }}
                >▲</button>
                <button
                  type="button"
                  onClick={() => { const v = Math.max(1,(form.stock||1)-1); setStockInput(String(v)); set('stock',v) }}
                  style={{ flex:1, padding:'0 10px', background:'#f8fafc', border:'none', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1 }}
                >▼</button>
              </div>
            </div>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>
              Ketik langsung atau gunakan tombol ▲▼ untuk mengubah jumlah.
            </p>
          </div>

          {/* Kondisi Aset */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Kondisi Aset</label>
            <div style={{ display:'flex', gap:10 }}>
              {[['baik','✅ Baik','#10b981'],['rusak_ringan','⚠️ Rusak Ringan','#f59e0b'],['rusak_berat','❌ Rusak Berat','#ef4444']].map(([v,l,c])=>(
                <label key={v} style={{
                  flex:1, display:'flex', alignItems:'center', gap:8, padding:'0.6rem 0.75rem',
                  border:`2px solid ${form.condition===v?c:'var(--border)'}`,
                  borderRadius:10, cursor:'pointer',
                  background: form.condition===v ? `${c}15` : '#fafafa',
                  transition:'all 0.2s',
                }}>
                  <input type="radio" name="condition" value={v} checked={form.condition===v} onChange={e=>set('condition',e.target.value)} style={{ accentColor:c }} />
                  <span style={{ fontSize:'0.8rem', fontWeight:600, color:form.condition===v?c:'var(--text-muted)' }}>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={lb}>Deskripsi</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Deskripsi aset (opsional)"
              style={{ ...inp, height:80, resize:'vertical' }} />
          </div>

          <div style={{ display:'flex', gap:10, paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
            <button onClick={handleSubmit} disabled={saving||compressing} style={{
              flex:1, padding:'0.8rem',
              background:'linear-gradient(135deg,var(--primary),var(--purple))',
              color:'#fff', border:'none', borderRadius:12,
              cursor:(saving||compressing)?'not-allowed':'pointer',
              fontWeight:700, opacity:(saving||compressing)?0.7:1,
              boxShadow:'0 4px 12px rgba(99,102,241,0.3)', fontSize:'0.9rem',
            }}>{saving?'⏳ Menyimpan...':'💾 Simpan Aset'}</button>
            <button onClick={()=>navigate('/assets')} style={{ padding:'0.8rem 1.5rem', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:12, cursor:'pointer', fontWeight:600 }}>Batal</button>
          </div>
        </div>

        {/* RIGHT: Upload Foto */}
        <div>
          <div style={card}>
            <label style={lb}>Foto Aset</label>
            <div onClick={()=>fileRef.current.click()} style={{
              border:`2px dashed ${preview?'var(--primary)':'var(--border)'}`,
              borderRadius:12, padding:'1rem', textAlign:'center', cursor:'pointer',
              background: preview?'var(--primary-light)':'#fafafa',
              transition:'all 0.2s', minHeight:200,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              {preview ? (
                <>
                  <img src={preview} alt="preview" style={{ maxWidth:'100%', maxHeight:200, borderRadius:10, objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }} />
                  <div style={{ fontSize:'0.72rem', color:'var(--primary)', fontWeight:600 }}>
                    {compressing ? '⏳ Mengompres...' : `✅ ${photo?.name} · ${(photo?.size/1024).toFixed(0)} KB`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'3rem' }}>{compressing?'⏳':'📷'}</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:500 }}>
                    {compressing ? 'Mengompres gambar...' : 'Klik untuk upload foto'}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Otomatis dikompres · JPG/PNG/WEBP</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
            {preview && (
              <button onClick={()=>{setPhoto(null);setPreview(null);fileRef.current.value=''}} style={{ marginTop:8, background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>✕ Hapus foto</button>
            )}
          </div>

          {/* Info */}
          <div style={{ ...card, marginTop:'1rem', background:'linear-gradient(135deg,#f8faff,#eff6ff)', border:'1px solid #dbeafe' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--primary)', marginBottom:8 }}>ℹ️ QR Code</div>
            <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1.6 }}>
              QR Code akan otomatis dibuat saat aset disimpan, dan dapat dicetak dari menu <strong>Cetak QR Code</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const lb      = { fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }
const inp     = { display:'block', width:'100%', padding:'0.65rem 0.875rem', borderRadius:10, border:'1.5px solid var(--border)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s', fontFamily:'Plus Jakarta Sans,sans-serif', background:'#fff' }
const sel     = { ...inp, cursor:'pointer' }
const card    = { background:'#fff', borderRadius:16, padding:'1.5rem', boxShadow:'var(--shadow)' }
const backBtn = { background:'#f1f5f9', border:'none', borderRadius:8, padding:'0.5rem 0.75rem', cursor:'pointer', fontSize:'0.85rem', color:'#64748b', fontWeight:600 }
const errBox  = { background:'#fee2e2', color:'#991b1b', padding:'0.75rem 1rem', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.85rem', borderLeft:'4px solid #ef4444' }