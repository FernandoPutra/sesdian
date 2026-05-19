import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const NIP_REGEX = /^\d{18}$/

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name:'', nip:'', email:'', password:'', password_confirmation:'', phone:'' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi.'
    if (!NIP_REGEX.test(form.nip)) e.nip = 'NIP harus tepat 18 digit angka.'
    if (!form.email) e.email = 'Email wajib diisi.'
    if (form.password.length < 8) e.password = 'Password minimal 8 karakter.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Password tidak cocok.'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await api.post('/register', form)
      navigate('/login', { state: { message: 'Registrasi berhasil! Silakan login.' } })
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: err.response?.data?.message || 'Registrasi gagal.' })
    } finally { setLoading(false) }
  }

  const fields = [
    { f:'name', p:'Nama Lengkap', t:'text', icon:'👤' },
    { f:'nip',  p:'NIP (18 digit)', t:'text', icon:'🪪' },
    { f:'email',p:'Email', t:'email', icon:'📧' },
    { f:'phone',p:'No. HP (WhatsApp)', t:'text', icon:'📱' },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f172a,#1e293b,#312e81)', padding: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.08)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📦</div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>Buat Akun SESDIAN</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>Isi data diri Anda untuk mendaftar</p>
        </div>

        {errors.general && <div style={alertRed}>❌ {errors.general}</div>}

        {fields.map(({ f, p, t, icon }) => (
          <div key={f} style={{ marginBottom: '0.875rem' }}>
            <label style={lb}>{p}</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>{icon}</span>
              <input type={t} value={form[f]} onChange={e => setForm({...form,[f]:e.target.value})}
                placeholder={p} style={{ ...inpDark, paddingLeft: '2.5rem' }}
                onFocus={e => e.target.style.borderColor='#6366f1'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            </div>
            {errors[f] && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>⚠️ {errors[f]}</p>}
            {f === 'nip' && form.nip && !NIP_REGEX.test(form.nip) && (
              <p style={{ color: '#fbbf24', fontSize: '0.72rem', marginTop: 4 }}>
                {form.nip.length}/18 digit
              </p>
            )}
          </div>
        ))}

        <div style={{ marginBottom: '0.875rem' }}>
          <label style={lb}>Password</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔒</span>
            <input type={showPass?'text':'password'} value={form.password}
              onChange={e => setForm({...form,password:e.target.value})}
              placeholder="Min. 8 karakter" style={{ ...inpDark, paddingLeft: '2.5rem', paddingRight: '3rem' }}
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              {showPass?'🙈':'👁️'}
            </button>
          </div>
          {errors.password && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>⚠️ {errors.password}</p>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={lb}>Konfirmasi Password</label>
          <input type="password" value={form.password_confirmation}
            onChange={e => setForm({...form,password_confirmation:e.target.value})}
            placeholder="Ulangi password" style={inpDark}
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
          {errors.password_confirmation && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 4 }}>⚠️ {errors.password_confirmation}</p>}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '0.875rem',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', border: 'none', borderRadius: 12, cursor: loading?'not-allowed':'pointer',
          fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          transition: 'transform 0.2s', opacity: loading ? 0.7 : 1,
        }}>{loading ? 'Mendaftarkan...' : 'Daftar Sekarang →'}</button>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
          Sudah punya akun? <a href="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Masuk di sini</a>
        </p>
      </div>
    </div>
  )
}

const inpDark = { display: 'block', width: '100%', padding: '0.7rem 1rem', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'Plus Jakarta Sans, sans-serif' }
const lb      = { fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const alertRed= { background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.3)' }