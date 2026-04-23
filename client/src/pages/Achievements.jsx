import React from 'react';
import GamificationPanel from '../components/GamificationPanel';
import DashboardLayout from '../components/DashboardLayout';

const Achievements = () => {
  return (
    <DashboardLayout>
      <div className="page spatial-bg" style={{ background: 'var(--bg-base)' }}>
        <div className="stars" />
        <div className="container" style={{ maxWidth: 1200, background: 'var(--bg-base)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32, background: 'var(--bg-base)' }}>
            <h1 className="display" style={{ fontSize: 28, marginBottom: 8, color: 'var(--text-primary)' }}>Achievements</h1>
            <p style={{ fontSize: 16, background: 'var(--bg-card)', color: 'var(--text-2)' }}>Track your digital legacy journey and earn badges</p>
          </div>
          <GamificationPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Achievements;
