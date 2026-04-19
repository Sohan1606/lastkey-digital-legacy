import React from 'react';
import GamificationPanel from '../components/GamificationPanel';

const Achievements = () => {
  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ maxWidth: 1200 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="display" style={{ fontSize: 28, marginBottom: 8 }}>Achievements</h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)' }}>Track your digital legacy journey and earn badges</p>
        </div>
        <GamificationPanel />
      </div>
    </div>
  );
};

export default Achievements;
