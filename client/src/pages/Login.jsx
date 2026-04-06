import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    setError('');
    const { email, password } = formData;
    login({ email, password }, {
      onSuccess: () => navigate('/dashboard'),
      onError: (err) => {
        console.error('Login error:', err);
        setError(err.response?.data?.message || 'Login failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-lg">Sign in to your LastKey account</p>
        </div>
        <AuthForm
          type="login"
          onSubmit={handleSubmit}
          buttonText="Sign In"
          loading={login.isPending}
          error={error}
        />
        <div className="text-center">
          <p className="text-md text-gray-600">
            Don't have an account? <Link to="/register" className="font-bold text-purple-600 hover:text-purple-700 transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
