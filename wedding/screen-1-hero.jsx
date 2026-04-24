/* ============================================================
   Tüm ekranlar — 5 mockup
   1. Hero / QR Landing
   2. Upload (drag & drop, preview, progress)
   3. Teşekkür
   4. Admin Login
   5. Admin Galeri
   ============================================================ */

const PHONE_W = 390;
const PHONE_H = 844;

// ---------- Shared atmosphere wrapper ----------
const Atmosphere = ({ children, density = 1, intensity = 1, showLights = true }) => (
  <div style={{
    position: 'absolute', inset: 0,
    background: `
      radial-gradient(ellipse at 50% 110%, rgba(217,164,65,0.18), transparent 55%),
      radial-gradient(ellipse at 50% -10%, rgba(40,30,18,0.55), transparent 55%),
      linear-gradient(180deg, #2a1f14 0%, #3a2c1c 25%, #4a3a24 55%, #5e4a30 100%)
    `,
    overflow: 'hidden',
  }}>
    {/* far hill silhouette */}
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: '38%',
      height: '120px',
      background: 'radial-gradient(ellipse at 30% 100%, #1a2418 0%, transparent 65%), radial-gradient(ellipse at 75% 100%, #1f2a1a 0%, transparent 60%)',
      opacity: 0.85,
    }} />
    {/* mid trees */}
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%',
      background: `
        radial-gradient(ellipse at 10% 100%, #182214 0%, transparent 50%),
        radial-gradient(ellipse at 35% 100%, #1c2618 0%, transparent 55%),
        radial-gradient(ellipse at 60% 100%, #182214 0%, transparent 50%),
        radial-gradient(ellipse at 88% 100%, #1f2a1a 0%, transparent 55%)
      `,
    }} />
    {showLights && window.FairyLightsScene && <FairyLightsScene density={density} intensity={intensity} />}
    {/* paper grain on top */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.92 0 0 0 0 0.78 0 0 0 0.10 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
      opacity: 0.5,
      mixBlendMode: 'overlay',
    }} />
    {children}
  </div>
);

// ---------- Decorative paper card (the main UI surface) ----------
const PaperCard = ({ children, style }) => (
  <div className="card-paper" style={{
    position: 'relative',
    zIndex: 10,
    padding: '28px 26px',
    margin: '0 18px',
    ...style,
  }}>
    {/* corner sprigs */}
    <div style={{ position: 'absolute', top: -14, left: -10, transform: 'rotate(-15deg)', zIndex: 2 }}>
      <EucalyptusSprig size={70} />
    </div>
    <div style={{ position: 'absolute', bottom: -18, right: -12, transform: 'rotate(165deg)', zIndex: 2 }}>
      <EucalyptusSprig size={60} />
    </div>
    <div style={{ position: 'relative', zIndex: 3 }}>{children}</div>
  </div>
);

// ============================================================
// SCREEN 1 — HERO / QR LANDING
// ============================================================
const Screen1_Hero = () => {
  const [days, setDays] = React.useState(82);
  React.useEffect(() => {
    const target = new Date('2026-07-19T19:00:00');
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
      setDays(diff);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <Atmosphere density={1.2} intensity={1.1}>
      {/* String light swag at top — overlay SVG over WebGL for crisp foreground */}
      <div style={{ position: 'absolute', top: 28, left: 0, right: 0, zIndex: 6, pointerEvents: 'none' }}>
        <StringLightSwag width={PHONE_W} />
      </div>

      {/* Top eyebrow */}
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, textAlign: 'center', zIndex: 7 }}>
        <div className="eyebrow" style={{ color: '#e8c277', letterSpacing: '0.4em' }}>
          16 · 19 TEMMUZ 2026
        </div>
      </div>

      {/* Watercolor blob behind names */}
      <div style={{ position: 'absolute', top: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}>
        <WatercolorBlob color="#6b8f71" size={300} opacity={0.18} />
      </div>

      {/* Names */}
      <div style={{ position: 'absolute', top: 175, left: 0, right: 0, textAlign: 'center', zIndex: 8 }}>
        <div className="serif-it" style={{
          fontSize: 78,
          lineHeight: 0.95,
          color: '#fbeec8',
          textShadow: '0 2px 20px rgba(217,164,65,0.4), 0 0 60px rgba(245,214,138,0.3)',
        }}>
          Gizem
        </div>
        <div className="serif-it" style={{
          fontSize: 36,
          color: '#e8c277',
          margin: '6px 0',
          fontStyle: 'italic',
          opacity: 0.95,
        }}>
          &amp;
        </div>
        <div className="serif-it" style={{
          fontSize: 78,
          lineHeight: 0.95,
          color: '#fbeec8',
          textShadow: '0 2px 20px rgba(217,164,65,0.4), 0 0 60px rgba(245,214,138,0.3)',
        }}>
          Berkay
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ position: 'absolute', top: 410, left: 0, right: 0, textAlign: 'center', zIndex: 8, padding: '0 40px' }}>
        <div className="serif" style={{ color: '#f5e8c4', fontSize: 18, lineHeight: 1.6, fontStyle: 'italic', opacity: 0.92 }}>
          Bizimle bu güzel günü <br/> paylaşmaya hoş geldin
        </div>
      </div>

      {/* Countdown card */}
      <div style={{ position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center', zIndex: 8, padding: '0 50px' }}>
        <div style={{
          background: 'rgba(245, 237, 217, 0.08)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(232, 194, 119, 0.25)',
          borderRadius: '4px',
          padding: '16px 18px',
        }}>
          <div className="eyebrow" style={{ color: '#e8c277', marginBottom: 8 }}>NİKAHA</div>
          <div className="serif" style={{ fontSize: 44, color: '#fbeec8', lineHeight: 1, fontWeight: 300 }}>
            {days} <span style={{ fontSize: 18, fontStyle: 'italic', color: '#e8c277' }}>gün</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11, color: '#d9c79a', letterSpacing: '0.18em' }}>
            <span>KINA · 16 TEM</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>NİKAH · 19 TEM</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center', zIndex: 8, padding: '0 40px' }}>
        <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(180deg, #d9a441, #b88030)', color: '#2a1f12' }}>
          Anılarını Paylaş
          <span style={{ fontSize: 16 }}>→</span>
        </button>
        <div className="serif-it" style={{ color: '#d9c79a', fontSize: 14, marginTop: 16, opacity: 0.75, fontStyle: 'italic' }}>
          fotoğraf · video · birkaç güzel söz
        </div>
      </div>

      {/* Stats pill */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(40,30,18,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(232, 194, 119, 0.2)',
          borderRadius: '999px',
          padding: '6px 14px',
          color: '#e8c277',
          fontSize: 11,
          letterSpacing: '0.15em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7aa07a', boxShadow: '0 0 8px #7aa07a' }} />
          127 ANI PAYLAŞILDI
        </div>
      </div>
    </Atmosphere>
  );
};

window.Screen1_Hero = Screen1_Hero;
