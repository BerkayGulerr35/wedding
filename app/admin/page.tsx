'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { AdminItem } from '@/lib/types';
import { StringLightSwag, EucalyptusSprig, Monogram, OliveBranch } from '@/components/BotanicalElements';

const FairyLightsBackground = dynamic(() => import('@/components/FairyLightsBackground'), { ssr: false });

const NIGHT_BG = {
  background: `
    radial-gradient(ellipse at 50% 110%, rgba(217,164,65,0.18), transparent 55%),
    radial-gradient(ellipse at 50% -10%, rgba(40,30,18,0.55), transparent 55%),
    linear-gradient(180deg, #2a1f14 0%, #3a2c1c 25%, #4a3a24 55%, #5e4a30 100%)
  `,
};

const GRAIN_OVERLAY = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.92 0 0 0 0 0.78 0 0 0 0.10 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
  opacity: 0.45,
  mixBlendMode: 'overlay' as const,
};

// The admin password lives only in the ADMIN_PASSWORD env var on the server.
// After a successful server-validated login we keep whatever the user typed in
// sessionStorage and send it on each API request.
const PW_KEY = 'admin_pw';

interface UploadWithSignedUrl extends AdminItem {
  /** Media URL on our own server (token-authenticated). */
  url: string;
  /** Filename used when downloading. */
  displayName: string;
}

type Filter = 'all' | 'photo' | 'video';

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [password, setPassword] = useState('');
  const [wrongPw, setWrongPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PW_KEY)) setAuthed(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, password);
        setAuthed(true);
      } else {
        setWrongPw(true);
        setPassword('');
        setTimeout(() => setWrongPw(false), 2500);
      }
    } catch {
      setWrongPw(true);
      setTimeout(() => setWrongPw(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PW_KEY);
    setAuthed(false);
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} password={password} setPassword={setPassword} wrongPw={wrongPw} loading={loading} />;
  return <Gallery onLogout={logout} />;
}

// ─── Login ───────────────────────────────────────────────
function LoginScreen({
  onLogin, password, setPassword, wrongPw, loading,
}: {
  onLogin: (e: React.FormEvent) => void;
  password: string;
  setPassword: (v: string) => void;
  wrongPw: boolean;
  loading: boolean;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={NIGHT_BG}>
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '42%', background: 'radial-gradient(ellipse at 15% 100%, #182214 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, #1f2a1a 0%, transparent 55%)' }} />
      <FairyLightsBackground density={0.5} intensity={0.7} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, ...GRAIN_OVERLAY }} />
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 6, opacity: 0.75 }}>
        <StringLightSwag />
      </div>

      <div className="relative fade-in text-center px-6" style={{ zIndex: 9, maxWidth: 400, width: '100%' }}>
        <Monogram size={64} />
        <div className="eyebrow mt-5 mb-2" style={{ color: '#e8c277', letterSpacing: '0.4em' }}>— ADMIN —</div>
        <h1 className="serif-it" style={{ fontSize: 34, color: '#fbeec8', lineHeight: 1.1, marginBottom: 6 }}>
          Anılar arşivi
        </h1>
        <p className="serif" style={{ fontSize: 14, color: '#d9c79a', fontStyle: 'italic', opacity: 0.8, marginBottom: 32 }}>
          gizem ve berkay'a özel
        </p>

        <form onSubmit={onLogin}>
          <div className="card-paper px-6 py-7">
            <div className="field mb-5">
              <label>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ letterSpacing: '0.3em' }}
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {wrongPw && (
              <div className="fade-in mb-4" style={{ textAlign: 'center', color: '#b06b4a', fontSize: 13, fontStyle: 'italic' }}>
                Bu anı yalnızca çift içindir.
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              Aç
            </button>
          </div>
        </form>

        <div style={{ marginTop: 28, color: '#8a7656', fontSize: 10, letterSpacing: '0.25em' }}>
          — KORUMAL ALAN —
        </div>
      </div>
    </div>
  );
}

// ─── Gallery ─────────────────────────────────────────────
function Gallery({ onLogout }: { onLogout: () => void }) {
  const [uploads, setUploads]   = useState<UploadWithSignedUrl[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>('all');
  const [selected, setSelected] = useState<UploadWithSignedUrl | null>(null);

  useEffect(() => {
    fetchUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/list', {
        headers: { 'x-admin-password': sessionStorage.getItem(PW_KEY) ?? '' },
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) { setLoading(false); return; }

      const { token, uploads: items } = (await res.json()) as {
        token: string;
        uploads: AdminItem[];
      };

      const withUrls: UploadWithSignedUrl[] = items.map((u) => ({
        ...u,
        url: `/api/admin/file/${encodeURIComponent(u.storedName)}?t=${token}`,
        displayName: u.storedName,
      }));

      setUploads(withUrls);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (upload: UploadWithSignedUrl) => {
    const a = document.createElement('a');
    a.href = `${upload.url}&download=1`;
    a.download = upload.displayName;
    a.click();
  };

  const filtered = uploads.filter(u => {
    if (filter === 'photo') return u.isImage;
    if (filter === 'video') return !u.isImage;
    return true;
  });

  const photoCount = uploads.filter(u => u.isImage).length;
  const videoCount = uploads.filter(u => !u.isImage).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f1e8 0%, #ede5d2 100%)', position: 'relative' }}>
      {/* Paper grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.25 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        opacity: 0.5,
        mixBlendMode: 'multiply',
      }} />

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px 24px 12px',
        borderBottom: '1px solid rgba(122,100,70,0.15)',
        background: 'rgba(245,241,232,0.95)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ color: '#8a7656' }}>— ARŞİV —</div>
              <div className="serif-it" style={{ fontSize: 28, color: '#3a3022', lineHeight: 1.1, marginTop: 2 }}>
                Gizem &amp; Berkay
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div className="serif" style={{ fontSize: 30, color: '#4f6e54', lineHeight: 1, fontWeight: 300 }}>
                  {uploads.length}
                </div>
                <div style={{ fontSize: 9, color: '#8a7656', letterSpacing: '0.15em' }}>DOSYA</div>
              </div>
              <button onClick={onLogout} className="btn btn-ghost" style={{ fontSize: 10, padding: '10px 14px' }}>
                Çıkış
              </button>
            </div>
          </div>

          {/* Filter chips + bulk download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
              {(['all','photo','video'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="btn"
                  style={{
                    padding: '5px 14px',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    background: filter === f ? '#4f6e54' : 'transparent',
                    color: filter === f ? '#f5f1e8' : '#5a4a35',
                    border: filter === f ? 'none' : '1px solid rgba(122,100,70,0.3)',
                  }}
                >
                  {f === 'all' && `Tümü · ${uploads.length}`}
                  {f === 'photo' && `Foto · ${photoCount}`}
                  {f === 'video' && `Video · ${videoCount}`}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 60px', position: 'relative', zIndex: 2 }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div className="serif-it" style={{ color: '#8a7656', fontSize: 18, fontStyle: 'italic' }}>
              Anılar yükleniyor...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div className="serif-it" style={{ color: '#8a7656', fontSize: 20, fontStyle: 'italic' }}>
              Henüz hiç anı paylaşılmamış
            </div>
          </div>
        ) : (
          <>
            {/* Decorative olive branch */}
            <div style={{ textAlign: 'center', marginBottom: 24, opacity: 0.6 }}>
              <OliveBranch size={240} />
            </div>

            <div className="gallery-grid">
              {filtered.map(u => (
                <GalleryItem
                  key={u.storedName}
                  upload={u}
                  onOpen={() => setSelected(u)}
                  onDownload={() => downloadFile(u)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <Lightbox
          upload={selected}
          onClose={() => setSelected(null)}
          onDownload={() => downloadFile(selected)}
        />
      )}
    </div>
  );
}

// ─── Gallery item ─────────────────────────────────────────
function GalleryItem({
  upload, onOpen, onDownload,
}: {
  upload: UploadWithSignedUrl;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const date = new Date(upload.createdAt);
  const timeAgo = formatTimeAgo(date);

  return (
    <div className="gallery-item" onClick={onOpen}>
      {/* Media preview */}
      {upload.url && upload.isImage ? (
        <img
          src={upload.url}
          alt={upload.name || 'Anı'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      ) : upload.url && !upload.isImage ? (
        <video
          src={upload.url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted
          preload="metadata"
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#c8a878,#8a6a44)' }}>
          <div className="serif-it" style={{ color: 'rgba(255,248,225,0.6)', fontSize: 12 }}>yükleniyor...</div>
        </div>
      )}

      {/* Video badge */}
      {!upload.isImage && (
        <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '2px 6px', background: 'rgba(0,0,0,0.55)', color: '#f5e8c4', borderRadius: 3, letterSpacing: '0.1em' }}>
          VIDEO
        </div>
      )}

      {/* Overlay info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6))' }}>
        <div className="serif-it" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.1, color: '#fbeec8' }}>
          {upload.name || 'Anonim'}
        </div>
        <div style={{ fontSize: 9, opacity: 0.8, letterSpacing: '0.08em', color: '#e8c277', marginTop: 2 }}>{timeAgo}</div>
      </div>

      {/* Download button */}
      <button
        onClick={e => { e.stopPropagation(); onDownload(); }}
        style={{
          position: 'absolute', top: 6, left: 6,
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', color: '#fbeec8',
          display: 'grid', placeItems: 'center', fontSize: 14,
          border: 'none', cursor: 'pointer',
        }}
        title="İndir"
      >
        ↓
      </button>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────
function Lightbox({
  upload, onClose, onDownload,
}: {
  upload: UploadWithSignedUrl;
  onClose: () => void;
  onDownload: () => void;
}) {
  const date = new Date(upload.createdAt);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,14,8,0.92)', backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: 800, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Media */}
        <div style={{ borderRadius: 6, overflow: 'hidden', background: '#1a1208', maxHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {upload.url && upload.isImage ? (
            <img src={upload.url} alt="" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }} />
          ) : upload.url ? (
            <video src={upload.url} controls style={{ maxWidth: '100%', maxHeight: '60vh' }} />
          ) : null}
        </div>

        {/* Info card */}
        <div style={{ background: 'rgba(245,241,232,0.95)', borderRadius: 4, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div className="serif-it" style={{ fontSize: 20, color: '#3a3022', fontStyle: 'italic', marginBottom: 6 }}>
              {upload.name || 'Anonim'}
            </div>
            <div style={{ fontSize: 10, color: '#8a7656', marginTop: 8, letterSpacing: '0.12em' }}>
              {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 11 }} onClick={onDownload}>
              ↓ İndir
            </button>
            <button className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: 11 }} onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────
function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} dk`;
  if (hours < 24) return `${hours} sa`;
  return `${days} gün`;
}
