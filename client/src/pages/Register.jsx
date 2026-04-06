import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

const Register = () => {
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    setError('');
    const { name, email, password } = formData;
    register({ name, email, password }, {
      onSuccess: () => navigate('/dashboard'),
      onError: (err) => {
        console.error('Registration error:', err);
        setError(err.response?.data?.message || 'Registration failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 text-lg">Join LastKey today</p>
        </div>
        <AuthForm
          type="register"
          onSubmit={handleSubmit}
          buttonText="Create Account"
          loading={register.isPending}
          error={error}
        />
        <div className="text-center">
          <p className="text-md text-gray-600">
            Already have an account? <Link to="/login" className="font-bold text-purple-600 hover:text-purple-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
