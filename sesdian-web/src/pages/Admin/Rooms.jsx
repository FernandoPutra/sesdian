import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const STORAGE_KEY = 'sesdian_rooms'

const defaultRooms = [
  { id:1, name:'Ruang Kepala',     code:'RK-01', penanggung_jawab:'—' },
  { id:2, name:'Ruang Tata Usaha', code:'TU-01', penanggung_jawab:'—' },
  { id:3, name:'Ruang Rapat',      code:'RR-01', penanggung_jawab:'—' },
  { id:4, name:'Ruang Pelayanan',  code:'RP-01', penanggung_jawab:'—' },
  { id:5, name:'Gudang',           code:'GD-01', penanggung_jawab:'—' },
  { id:6, name:'Laboratorium',     code:'LB-01', penanggung_jawab:'—' },
]

export function getRooms() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultRooms
  } catch { return defaultRooms }
}

export function saveRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}

export default function Rooms() {
  const { isAdmin } = useAuth()
  const [rooms, setRooms]       = useState(getRooms)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name:'', code:'', penanggung_jawab:'' })
  const [editId, setEditId]     = useState(null)

  const persist = (updated) => { setRooms(updated); saveRooms(updated) }

  const handleSave = () => {
    if (!form.name || !form.code) return
    if (editId) persist(rooms.map(r => r.id===editId ? {...r,...form} : r))
    else persist([...rooms, { id: Date.now(), name:form.name, code:form.code, penanggung_jawab:form.penanggung_jawab||'—' }])
    setShowForm(false); setForm({ name:'',code:'',penanggung_jawab:'' }); setEditId(null)
  }

  const openEdit = r => { setForm({ name:r.name, code:r.code, penanggung_jawab:r.penanggung_jawab||'' }); setEditId(r.id); setShowForm(true) }
  const del = id => { if (confirm('Hapus ruangan ini?')) persist(rooms.filter(r => r.id!==id)) }

  return (
    <div>
      <div className="animate-fade-up" style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem',fontWeight:800,marginBottom:4 }}>🏠 Ruangan</h1>
          <p style={{ color:'var(--text-muted)',fontSize:'0.875rem' }}>{rooms.length} ruangan terdaftar</p>
        </div>
        {isAdmin && (
          <button onClick={()=>{setShowForm(true);setEditId(null);setForm({name:'',code:'',penanggung_jawab:''})}} style={{ padding:'0.65rem 1.25rem',background:'linear-gradient(135deg,var(--primary),var(--purple))',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:'0.875rem',boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>+ Tambah Ruangan</button>
        )}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'1rem' }}>
        {rooms.map((r,i) => (
          <div key={r.id} className={`animate-fade-up delay-${Math.min(i+1,5)}`} style={{ background:'#fff',borderRadius:16,padding:'1.25rem',boxShadow:'var(--shadow)',border:'1px solid var(--border)',transition:'transform 0.2s,box-shadow 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow)'}}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:'0.75rem' }}>
              <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem' }}>🏠</div>
              <div>
                <div style={{ fontWeight:700,fontSize:'0.95rem' }}>{r.name}</div>
                <div style={{ fontFamily:'JetBrains Mono',fontSize:'0.7rem',color:'var(--text-muted)' }}>{r.code}</div>
              </div>
            </div>
            <div style={{ fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.75rem' }}>
              👤 Penanggung Jawab: <strong style={{ color:'#0f172a' }}>{r.penanggung_jawab || '—'}</strong>
            </div>
            {isAdmin && (
              <div style={{ display:'flex',gap:8,paddingTop:'0.75rem',borderTop:'1px solid var(--border)' }}>
                <button onClick={()=>openEdit(r)} style={{ flex:1,padding:'0.4rem',background:'var(--primary-light)',color:'var(--primary)',border:'none',borderRadius:8,cursor:'pointer',fontSize:'0.8rem',fontWeight:600 }}>✏️ Edit</button>
                <button onClick={()=>del(r.id)} style={{ flex:1,padding:'0.4rem',background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:8,cursor:'pointer',fontSize:'0.8rem',fontWeight:600 }}>🗑️ Hapus</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && isAdmin && (
        <div className="animate-fade-in" style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}>
          <div className="animate-bounce-in" style={{ background:'#fff',borderRadius:20,padding:'2rem',width:420,boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem' }}>
              <h2 style={{ fontWeight:800 }}>{editId?'✏️ Edit Ruangan':'🏠 Tambah Ruangan'}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:'#f1f5f9',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:'0.9rem' }}>✕</button>
            </div>
            {[
              ['name',             'Nama Ruangan *',      'text'],
              ['code',             'Kode Ruangan *',      'text'],
              ['penanggung_jawab', 'Penanggung Jawab',    'text'],
            ].map(([f,p,t])=>(
              <div key={f} style={{ marginBottom:'0.875rem' }}>
                <label style={lb}>{p}</label>
                <input type={t} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} placeholder={p} style={inp}
                  onFocus={e=>e.target.style.borderColor='var(--primary)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'} />
              </div>
            ))}
            <div style={{ display:'flex',gap:10,marginTop:'1.25rem' }}>
              <button onClick={handleSave} style={{ flex:1,padding:'0.75rem',background:'linear-gradient(135deg,var(--primary),var(--purple))',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700 }}>Simpan</button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'0.75rem 1.25rem',background:'#f1f5f9',color:'#64748b',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600 }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lb  = { fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:0.5 }
const inp = { display:'block',width:'100%',padding:'0.7rem 1rem',borderRadius:10,border:'1.5px solid var(--border)',fontSize:'0.875rem',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s' }