import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthForm = ({ type, onSubmit, loading, error, buttonText }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type === 'register' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
          <input 
            name="name" 
            type="text" 
            required 
            placeholder="Your full name" 
            value={formData.name} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
        <input 
          name="email" 
          type="email" 
          required 
          placeholder="you@example.com" 
          value={formData.email} 
          onChange={handleChange}
          className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <div className="relative">
          <input 
            name="password" 
            type={showPass ? 'text' : 'password'} 
            required 
            minLength="6"
            placeholder="At least 6 characters" 
            value={formData.password} 
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
          />
          <button 
            type="button" 
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        {/* Password Strength Indicator - Only for Register */}
        {type === 'register' && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} 
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    passwordStrength >= i 
                      ? strengthColors[passwordStrength]
                      : 'bg-slate-700'
                  }`} 
                />
              ))}
            </div>
            {formData.password && (
              <p className="text-xs text-slate-500">
                {strengthLabels[passwordStrength]} password
              </p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
};

export default AuthForm;
