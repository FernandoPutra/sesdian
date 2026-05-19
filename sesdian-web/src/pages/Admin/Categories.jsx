import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const STORAGE_KEY = 'sesdian_categories'

const defaultCats = [
  { id:1, name:'Elektronik',  icon:'💻', color:'#6366f1' },
  { id:2, name:'Furnitur',    icon:'🪑', color:'#f59e0b' },
  { id:3, name:'Kendaraan',   icon:'🚗', color:'#10b981' },
  { id:4, name:'Peralatan',   icon:'🔧', color:'#3b82f6' },
  { id:5, name:'Dokumen',     icon:'📄', color:'#8b5cf6' },
  { id:6, name:'Lain-lain',   icon:'📦', color:'#64748b' },
]

export function getCategories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultCats
  } catch { return defaultCats }
}

function saveCategories(cats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

export default function Categories() {
  const { isAdmin } = useAuth()
  const [cats, setCats]         = useState(getCategories)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name:'', icon:'📦', color:'#6366f1' })
  const [editId, setEditId]     = useState(null)

  const persist = (updated) => { setCats(updated); saveCategories(updated) }

  const handleSave = () => {
    if (!form.name) return
    if (editId) persist(cats.map(c => c.id===editId ? {...c,...form} : c))
    else persist([...cats, { id: Date.now(), ...form }])
    setShowForm(false); setForm({ name:'', icon:'📦', color:'#6366f1' }); setEditId(null)
  }

  const openEdit = c => { setForm({ name:c.name, icon:c.icon, color:c.color }); setEditId(c.id); setShowForm(true) }
  const del = id => { if (confirm('Hapus kategori?')) persist(cats.filter(c => c.id!==id)) }

  return (
    <div>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:4 }}>🏷️ Kategori Aset</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{cats.length} kategori</p>
        </div>
        {isAdmin && (
          <button onClick={()=>{setShowForm(true);setEditId(null);setForm({name:'',icon:'📦',color:'#6366f1'})}} style={{ padding:'0.65rem 1.25rem', background:'linear-gradient(135deg,var(--primary),var(--purple))', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:'0.875rem', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>+ Tambah Kategori</button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'1rem' }}>
        {cats.map((c,i) => (
          <div key={c.id} className={`animate-fade-up delay-${Math.min(i+1,5)}`} style={{ background:'#fff', borderRadius:16, padding:'1.25rem', boxShadow:'var(--shadow)', border:`2px solid ${c.color}20`, transition:'transform 0.2s,box-shadow 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}25`}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow)'}}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'0.875rem' }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', border:`2px solid ${c.color}30` }}>{c.icon}</div>
              <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{c.name}</div>
            </div>
            {isAdmin && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>openEdit(c)} style={{ flex:1, padding:'0.4rem', background:`${c.color}15`, color:c.color, border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>✏️ Edit</button>
                <button onClick={()=>del(c.id)} style={{ flex:1, padding:'0.4rem', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>🗑️ Hapus</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && isAdmin && (
        <div className="animate-fade-in" style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div className="animate-bounce-in" style={{ background:'#fff', borderRadius:20, padding:'2rem', width:400, boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontWeight:800 }}>{editId?'✏️ Edit Kategori':'🏷️ Tambah Kategori'}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <label style={lb}>Nama Kategori *</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nama kategori" style={inp}
                onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <label style={lb}>Ikon (emoji)</label>
              <input value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} placeholder="📦" style={inp}
                onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={lb}>Warna</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {colors.map(col=>(
                  <div key={col} onClick={()=>setForm({...form,color:col})} style={{ width:32, height:32, borderRadius:8, background:col, cursor:'pointer', border:form.color===col?'3px solid #0f172a':'3px solid transparent', transition:'all 0.15s' }} />
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} style={{ flex:1, padding:'0.75rem', background:'linear-gradient(135deg,var(--primary),var(--purple))', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>Simpan</button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'0.75rem 1.25rem', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lb  = { fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }
const inp = { display:'block', width:'100%', padding:'0.7rem 1rem', borderRadius:10, border:'1.5px solid var(--border)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }