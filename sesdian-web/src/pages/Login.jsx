import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [form, setForm]       = useState({ nip: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const reason = location.state?.reason
  const msg    = location.state?.message

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      const res = await api.post('/login', form)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'NIP atau password salah.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* BG decoration */}
      {[['-10%','20%',400,'rgba(99,102,241,0.15)'],['-5%','60%',300,'rgba(139,92,246,0.1)'],['70%','10%',500,'rgba(59,130,246,0.08)'],['80%','70%',250,'rgba(99,102,241,0.12)']].map(([l,t,s,bg],i) => (
        <div key={i} style={{ position: 'absolute', left: l, top: t, width: s, height: s, borderRadius: '50%', background: bg, pointerEvents: 'none' }} />
      ))}

      {/* Left panel */}
      <div className="animate-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>SES<span style={{ color: '#6366f1' }}>DIAN</span></div>
              <div style={{ color: '#475569', fontSize: '0.65rem', fontFamily: 'JetBrains Mono', letterSpacing: 2 }}>ASSET MANAGEMENT</div>
            </div>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Kelola Aset<br /><span style={{ color: '#6366f1' }}>Lebih Cerdas.</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7 }}>
            Sistem manajemen peminjaman aset terintegrasi dengan notifikasi WhatsApp otomatis dan audit trail lengkap.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
            {[['🔒','Aman'],['⚡','Real-time'],['📱','WhatsApp']].map(([icon,label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{icon}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div className="animate-fade-up delay-2" style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: '2.5rem', width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Masuk</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Gunakan NIP dan password Anda</p>

          {reason==='inactivity' && <div style={alertYellow}>⚠️ Sesi berakhir karena tidak aktif selama 30 menit.</div>}
          {msg && <div style={alertGreen}>✅ {msg}</div>}
          {error && <div style={alertRed}>❌ {error}</div>}

          <div style={{ marginBottom: '1rem' }}>
            <label style={lbWhite}>NIP</label>
            <input value={form.nip} onChange={e => setForm({...form,nip:e.target.value})}
              placeholder="18 digit NIP Anda"
              style={inpDark}
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbWhite}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass?'text':'password'} value={form.password}
                onChange={e => setForm({...form,password:e.target.value})}
                onKeyDown={e => e.key==='Enter' && handleSubmit()}
                placeholder="Password"
                style={{ ...inpDark, paddingRight: '3rem' }}
                onFocus={e => e.target.style.borderColor='#6366f1'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '0.875rem',
            background: loading ? '#4338ca' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 12, cursor: loading?'not-allowed':'pointer',
            fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
          >{loading ? 'Memverifikasi...' : 'Masuk →'}</button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
            Belum punya akun? <a href="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Daftar di sini</a>
          </p>
        </div>
      </div>
    </div>
  )
}

const inpDark    = { display: 'block', width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'Plus Jakarta Sans, sans-serif' }
const lbWhite    = { fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const alertYellow= { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(245,158,11,0.3)' }
const alertGreen = { background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.3)' }
const alertRed   = { background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.3)' }