// SCREEN 3 — TEŞEKKÜR

const Screen3_Thanks = () => (
  <Atmosphere density={1.4} intensity={1.2}>
    {/* extra glowy lights */}
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 6, pointerEvents: 'none' }}>
      <StringLightSwag width={PHONE_W} />
    </div>
    <div style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 6, pointerEvents: 'none', opacity: 0.6 }}>
      <StringLightSwag width={PHONE_W * 0.85} style={{ display: 'block', margin: '0 auto' }} />
    </div>

    {/* Watercolor wash behind */}
    <div style={{ position: 'absolute', top: 200, left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}>
      <WatercolorBlob color="#d9a441" size={340} opacity={0.22} />
    </div>

    {/* Wax seal stamp */}
    <div style={{ position: 'absolute', top: 195, left: 0, right: 0, textAlign: 'center', zIndex: 8 }}>
      <div className="wax" style={{ margin: '0 auto', width: 72, height: 72, fontSize: 28 }}>
        G&amp;B
      </div>
    </div>

    {/* Eucalyptus garlands flanking */}
    <div style={{ position: 'absolute', top: 280, left: 10, zIndex: 7, transform: 'rotate(-25deg)' }}>
      <EucalyptusSprig size={120} />
    </div>
    <div style={{ position: 'absolute', top: 280, right: 10, zIndex: 7, transform: 'scaleX(-1) rotate(-25deg)' }}>
      <EucalyptusSprig size={120} />
    </div>

    {/* Main message */}
    <div style={{ position: 'absolute', top: 310, left: 0, right: 0, textAlign: 'center', zIndex: 9, padding: '0 32px' }}>
      <div className="eyebrow" style={{ color: '#e8c277', marginBottom: 18 }}>
        — TEŞEKKÜRLER —
      </div>
      <div className="serif-it" style={{
        fontSize: 38,
        lineHeight: 1.15,
        color: '#fbeec8',
        textShadow: '0 2px 20px rgba(217,164,65,0.4)',
        marginBottom: 16,
      }}>
        Bu güzel anı için<br/>sana minnettarız
      </div>
      <div className="serif" style={{ fontSize: 16, color: '#e8c277', fontStyle: 'italic', opacity: 0.9, lineHeight: 1.6 }}>
        Paylaştığın her kare<br/>bizim için çok kıymetli
      </div>
    </div>

    {/* Heart scribbles floating */}
    <div style={{ position: 'absolute', top: 530, left: 80, zIndex: 8, animation: 'float-up 4s ease-in-out infinite' }}>
      <HeartScribble size={28} color="#e8c277" />
    </div>
    <div style={{ position: 'absolute', top: 565, right: 70, zIndex: 8, animation: 'float-up 5s ease-in-out infinite 0.5s' }}>
      <HeartScribble size={20} color="#d9a441" />
    </div>
    <div style={{ position: 'absolute', top: 600, left: '50%', transform: 'translateX(-50%)', zIndex: 8, animation: 'float-up 6s ease-in-out infinite 1s' }}>
      <HeartScribble size={16} color="#b06b4a" />
    </div>

    {/* Counter */}
    <div style={{ position: 'absolute', bottom: 130, left: 0, right: 0, textAlign: 'center', zIndex: 9 }}>
      <div className="serif-it" style={{ color: '#d9c79a', fontSize: 15, fontStyle: 'italic', opacity: 0.85 }}>
        senin de katkınla
      </div>
      <div className="serif" style={{ fontSize: 56, color: '#fbeec8', lineHeight: 1, marginTop: 6, fontWeight: 300 }}>
        131
      </div>
      <div className="eyebrow" style={{ color: '#e8c277', marginTop: 4 }}>
        ANI PAYLAŞILDI
      </div>
    </div>

    {/* Actions */}
    <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, padding: '0 40px', zIndex: 9, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button className="btn btn-ghost" style={{ width: '100%', borderColor: 'rgba(232, 194, 119, 0.5)', color: '#fbeec8' }}>
        Yeni Anı Paylaş
      </button>
      <div style={{ textAlign: 'center', color: '#a89578', fontSize: 11, letterSpacing: '0.18em' }}>
        — Gizem &amp; Berkay —
      </div>
    </div>
  </Atmosphere>
);

window.Screen3_Thanks = Screen3_Thanks;
