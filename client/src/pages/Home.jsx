import React from 'react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-pulse">
          LastKey Digital Legacy
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
          Preserve your most cherished digital memories for generations to come. 
          Your stories, photos, and wisdom – secured forever.
        </p>
        <div className="space-x-4">
          <a href="/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            Get Started
          </a>
          <a href="/login" className="border-2 border-purple-200 bg-white text-purple-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-50 transition-all duration-300">
            Login
          </a>
        </div>
      </div>
      <div className="mt-20 w-full max-w-6xl grid md:grid-cols-3 gap-8">
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Secure Vault</h3>
          <p className="text-gray-600">End-to-end encryption for all your digital assets.</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Time-Triggered Access</h3>
          <p className="text-gray-600">Set release dates for your legacy content.</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Generational Sharing</h3>
          <p className="text-gray-600">Pass memories to family across generations.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
