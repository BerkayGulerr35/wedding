// SCREEN 4 — ADMIN LOGIN
// SCREEN 5 — ADMIN GALLERY (combined here for brevity)

const Screen4_AdminLogin = () => {
  const [val, setVal] = React.useState("••••••••••••");
  return (
    <Atmosphere density={0.5} intensity={0.7}>
      <div style={{ position: 'absolute', top: 16, left: 0, right: 0, zIndex: 6, pointerEvents: 'none', opacity: 0.7 }}>
        <StringLightSwag width={PHONE_W} />
      </div>

      {/* Tiny ornament */}
      <div style={{ position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', zIndex: 8 }}>
        <Monogram size={64} />
      </div>

      <div style={{ position: 'absolute', top: 305, left: 0, right: 0, textAlign: 'center', zIndex: 9, padding: '0 30px' }}>
        <div className="eyebrow" style={{ color: '#e8c277', marginBottom: 8 }}>— ADMIN —</div>
        <div className="serif-it" style={{ fontSize: 34, color: '#fbeec8', lineHeight: 1.1 }}>
          Anılar arşivi
        </div>
        <div className="serif" style={{ fontSize: 14, color: '#d9c79a', fontStyle: 'italic', marginTop: 8, opacity: 0.8 }}>
          gizem ve berkay'a özel
        </div>
      </div>

      <div style={{ position: 'absolute', top: 430, left: 0, right: 0, padding: '0 32px', zIndex: 9 }}>
        <PaperCard style={{ margin: 0, padding: '24px 22px' }}>
          <div className="field">
            <label>Şifre</label>
            <input type="password" value={val} onChange={(e) => setVal(e.target.value)} style={{ letterSpacing: '0.3em' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }}>
            Aç
          </button>
        </PaperCard>
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', zIndex: 9, color: '#a89578', fontSize: 10, letterSpacing: '0.2em' }}>
        — KORUMALI ALAN —
      </div>
    </Atmosphere>
  );
};

const Screen5_AdminGallery = () => {
  const items = [
    { name: "Elif", type: "image", thumb: 0, time: "2 sa" },
    { name: "Mehmet", type: "video", thumb: 1, time: "3 sa" },
    { name: "Anonim", type: "image", thumb: 2, time: "5 sa" },
    { name: "Ayşe", type: "image", thumb: 3, time: "5 sa" },
    { name: "Can", type: "image", thumb: 4, time: "1g" },
    { name: "Zeynep", type: "video", thumb: 5, time: "1g" },
    { name: "Anonim", type: "image", thumb: 1, time: "2g" },
    { name: "Burak", type: "image", thumb: 2, time: "2g" },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #f5f1e8 0%, #ede5d2 100%)',
    }}>
      {/* paper grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.25 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        opacity: 0.5,
        mixBlendMode: 'multiply',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
        padding: '52px 22px 14px',
        borderBottom: '1px solid rgba(122,100,70,0.15)',
        background: 'linear-gradient(180deg, rgba(245,241,232,0.95), rgba(245,241,232,0.85))',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: '#8a7656' }}>— ARŞİV —</div>
            <div className="serif-it" style={{ fontSize: 26, color: '#3a3022', lineHeight: 1.1, marginTop: 2 }}>
              Anılarımız
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif" style={{ fontSize: 28, color: '#4f6e54', lineHeight: 1, fontWeight: 300 }}>131</div>
            <div style={{ fontSize: 9, color: '#8a7656', letterSpacing: '0.15em', marginTop: 2 }}>DOSYA</div>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, fontSize: 11 }}>
          <span style={{ padding: '5px 12px', borderRadius: 999, background: '#4f6e54', color: '#f5f1e8', letterSpacing: '0.1em' }}>Tümü · 131</span>
          <span style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(122,100,70,0.3)', color: '#5a4a35', letterSpacing: '0.1em' }}>Foto · 98</span>
          <span style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(122,100,70,0.3)', color: '#5a4a35', letterSpacing: '0.1em' }}>Video · 33</span>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        position: 'absolute', top: 158, left: 0, right: 0, zIndex: 5,
        padding: '10px 22px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(122,100,70,0.1)',
      }}>
        <div className="serif-it" style={{ fontSize: 14, color: '#5a4a35', fontStyle: 'italic' }}>
          en yeniler önce
        </div>
        <button className="btn" style={{
          padding: '8px 14px', fontSize: 10, letterSpacing: '0.18em',
          background: '#3a3022', color: '#f5d68a', borderRadius: '999px',
          gap: 6,
        }}>
          ⬇ TÜMÜNÜ İNDİR (.zip)
        </button>
      </div>

      {/* Grid */}
      <div className="mock-scroll" style={{
        position: 'absolute', top: 208, bottom: 0, left: 0, right: 0,
        overflowY: 'auto', padding: '14px 14px 30px', zIndex: 4,
      }}>
        {/* Date header */}
        <div className="serif-it" style={{ fontSize: 13, color: '#8a7656', marginBottom: 8, padding: '0 4px', fontStyle: 'italic' }}>
          25 Nisan 2026 · bugün
        </div>
        <div className="gallery-grid">
          {items.map((it, i) => (
            <div key={i} className={`gallery-item ph-${it.thumb}`}>
              {/* fake content texture */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 30% 30%, rgba(255,240,200,0.3), transparent 60%)',
              }} />
              {it.type === 'video' && (
                <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '2px 6px', background: 'rgba(0,0,0,0.5)', color: '#f5e8c4', borderRadius: 3, letterSpacing: '0.1em' }}>
                  VIDEO
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 8px 6px',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.55))',
                color: '#fbeec8',
              }}>
                <div className="serif-it" style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.1 }}>
                  {it.name}
                </div>
                <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: '0.08em' }}>{it.time}</div>
              </div>
              {/* download */}
              <div style={{
                position: 'absolute', top: 6, left: 6,
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)', color: '#fbeec8',
                display: 'grid', placeItems: 'center', fontSize: 12,
              }}>↓</div>
            </div>
          ))}
        </div>

        {/* expanded card with note */}
        <div style={{
          marginTop: 16, padding: 14,
          background: 'rgba(255,250,238,0.7)',
          border: '1px solid rgba(122,100,70,0.2)',
          borderRadius: 4,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="gallery-item ph-2" style={{ width: 80, height: 80, aspectRatio: 'auto', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="serif-it" style={{ fontSize: 16, color: '#3a3022', fontStyle: 'italic' }}>Elif</div>
                <div style={{ fontSize: 9, color: '#8a7656', letterSpacing: '0.1em' }}>2 SA · 4.2 MB</div>
              </div>
              <div className="serif" style={{ fontSize: 13, color: '#5a4a35', fontStyle: 'italic', lineHeight: 1.45, marginTop: 4 }}>
                "Bu güzel günde sizlerle olmak büyük mutluluk. Sonsuza dek mutlu olun ❤"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Screen4_AdminLogin = Screen4_AdminLogin;
window.Screen5_AdminGallery = Screen5_AdminGallery;
