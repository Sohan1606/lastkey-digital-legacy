import { useState } from 'react';

const AuthForm = ({ type, onSubmit, loading, error, buttonText }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      {type === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength="6"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : buttonText}
      </button>
    </form>
  );
};

export default AuthForm;
