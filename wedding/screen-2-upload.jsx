// SCREEN 2 — UPLOAD (drag & drop, preview, progress)

const Screen2_Upload = () => {
  const [files] = React.useState([
    { name: "IMG_4521.jpg", size: "4.2 MB", progress: 100, type: "image", thumb: 0 },
    { name: "IMG_4522.jpg", size: "3.8 MB", progress: 100, type: "image", thumb: 1 },
    { name: "VIDEO_0089.mov", size: "28.4 MB", progress: 64, type: "video", thumb: 2 },
    { name: "IMG_4530.jpg", size: "5.1 MB", progress: 22, type: "image", thumb: 3 },
  ]);

  return (
    <Atmosphere density={0.7} intensity={0.85} showLights={true}>
      {/* small swag */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, pointerEvents: 'none', opacity: 0.85 }}>
        <StringLightSwag width={PHONE_W} />
      </div>

      <div className="mock-scroll" style={{
        position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto',
        paddingTop: 80, paddingBottom: 30,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '0 40px', marginBottom: 18 }}>
          <Monogram size={54} />
          <div className="serif-it" style={{ fontSize: 32, color: '#fbeec8', marginTop: 4, lineHeight: 1.1 }}>
            Anılarını paylaş
          </div>
          <div className="serif" style={{ fontSize: 14, color: '#e8c277', fontStyle: 'italic', marginTop: 6, opacity: 0.85 }}>
            kalbimize bir parça bırak
          </div>
        </div>

        <PaperCard style={{ marginBottom: 14 }}>
          {/* Optional name + note */}
          <div className="field" style={{ marginBottom: 16 }}>
            <label>İsmin <span style={{ textTransform: 'none', letterSpacing: 0, color: '#a89578', fontStyle: 'italic' }}>· isteğe bağlı</span></label>
            <input type="text" placeholder="Sevgili dostumuz..." defaultValue="Elif" />
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Bir kaç söz <span style={{ textTransform: 'none', letterSpacing: 0, color: '#a89578', fontStyle: 'italic' }}>· isteğe bağlı</span></label>
            <textarea placeholder="Bu anı sizinle paylaşmak istedim..." defaultValue="Bu güzel günde sizlerle olmak büyük mutluluk. Sonsuza dek mutlu olun ❤" />
          </div>
        </PaperCard>

        <PaperCard style={{ marginBottom: 14 }}>
          {/* Dropzone */}
          <div className="dropzone">
            <div style={{ marginBottom: 10 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="20" cy="20" r="18" fill="none" stroke="#6b8f71" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <path d="M 20 11 L 20 25 M 14 18 L 20 12 L 26 18" stroke="#4f6e54" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <path d="M 12 28 L 28 28" stroke="#4f6e54" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="serif" style={{ fontSize: 18, color: '#3a3022', fontStyle: 'italic' }}>
              Fotoğraf veya video sürükle
            </div>
            <div style={{ fontSize: 11, color: '#8a7656', marginTop: 4, letterSpacing: '0.05em' }}>
              veya <span style={{ color: '#4f6e54', borderBottom: '1px dotted #4f6e54', cursor: 'pointer' }}>cihazından seç</span>
            </div>
            <div style={{ fontSize: 10, color: '#a89578', marginTop: 12, fontStyle: 'italic' }}>
              orijinal kalitede yüklenir · sınır yok
            </div>
          </div>

          {/* File list */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} className="upload-chip">
                <div className={`upload-thumb ph-${f.thumb}`}>
                  {f.type === 'video' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <div style={{
                        width: 0, height: 0, borderLeft: '8px solid #fff',
                        borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                        marginLeft: 2,
                      }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div className="serif" style={{ fontSize: 14, color: '#3a3022', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#8a7656', flexShrink: 0 }}>{f.size}</div>
                  </div>
                  <div className="progress-track" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: `${f.progress}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#8a7656', letterSpacing: '0.1em' }}>
                    <span>{f.progress === 100 ? '✓ YÜKLENDİ' : `%${f.progress} · YÜKLENİYOR`}</span>
                    {f.progress < 100 && <span>orijinal kalite</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PaperCard>

        {/* Submit */}
        <div style={{ padding: '6px 32px 0' }}>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Anılarımı Gönder
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, color: '#d9c79a', fontSize: 11, letterSpacing: '0.12em', opacity: 0.7 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d9c79a' }} />
              4 dosya · 41.5 MB toplam
            </span>
          </div>
        </div>
      </div>
    </Atmosphere>
  );
};

window.Screen2_Upload = Screen2_Upload;
