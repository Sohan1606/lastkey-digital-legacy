import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthForm = ({ type, onSubmit, loading, error, buttonText }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {type === 'register' && (
        <div>
          <label>Full Name</label>
          <input name="name" type="text" required placeholder="Your full name" value={formData.name} onChange={handleChange} />
        </div>
      )}
      <div>
        <label>Email Address</label>
        <input name="email" type="email" required placeholder="you@example.com" value={formData.email} onChange={handleChange} />
      </div>
      <div>
        <label>Password</label>
        <div style={{ position: 'relative' }}>
          <input name="password" type={showPass ? 'text' : 'password'} required minLength="6"
            placeholder="At least 6 characters" value={formData.password} onChange={handleChange}
            style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      {error && (
        <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
        style={{ marginTop: 4, opacity: loading ? 0.65 : 1, width: '100%' }}>
        {loading ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : buttonText}
      </button>
    </form>
  );
};

export default AuthForm;
