const Home = () => {
  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      <div style={{ width: '100%', maxWidth: 1100 }}>
        <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto 48px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(2.4rem,5vw,3.5rem)', marginBottom: 14, background: 'linear-gradient(135deg,#4f9eff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            LastKey Digital Legacy
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 22 }}>
            Preserve your most cherished digital memories for generations to come. Your stories, photos, and wisdom — secured forever.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{ background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 12, padding: '14px 26px', fontSize: 14, fontWeight: 800, color: 'white', textDecoration: 'none', boxShadow: 'var(--glow-ion)' }}>
              Get Started
            </a>
            <a href="/login" style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '14px 26px', fontSize: 14, fontWeight: 700, color: 'var(--text-1)', textDecoration: 'none' }}>
              Login
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { title: 'Secure Vault', desc: 'End-to-end encryption for all your digital assets.', accent: 'rgba(0,229,160,0.20)' },
            { title: 'Time-Triggered Access', desc: 'Set release dates for your legacy content.', accent: 'rgba(79,158,255,0.20)' },
            { title: 'Generational Sharing', desc: 'Pass memories to family across generations.', accent: 'rgba(124,92,252,0.20)' },
          ].map(card => (
            <div key={card.title} style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 22, backdropFilter: 'blur(24px)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: card.accent, border: '1px solid rgba(255,255,255,0.10)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
