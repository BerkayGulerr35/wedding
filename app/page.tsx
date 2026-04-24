'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  StringLightSwag,
  EucalyptusSprig,
  WatercolorBlob,
  Monogram,
  HeartScribble,
} from '@/components/BotanicalElements';
import { supabase } from '@/lib/supabase';

const FairyLightsBackground = dynamic(() => import('@/components/FairyLightsBackground'), { ssr: false });

interface FileItem {
  file: File;
  id: string;
  preview: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

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

export default function Home() {
  const [screen, setScreen] = useState<'upload' | 'thanks'>('upload');
  const [name, setName]     = useState('');
  const [note, setNote]     = useState('');
  const [files, setFiles]   = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  }, [addFiles]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) addFiles(selected);
    e.target.value = '';
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleSubmit = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    setIsSubmitting(true);
    let successCount = 0;

    for (const item of pendingFiles) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

      const ext  = item.file.name.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Animate progress
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === item.id && f.progress < 88) {
            return { ...f, progress: Math.min(88, f.progress + Math.random() * 18) };
          }
          return f;
        }));
      }, 350);

      const { data, error } = await supabase.storage
        .from('wedding-uploads')
        .upload(path, item.file, { cacheControl: '3600', upsert: false });

      clearInterval(interval);

      if (error || !data) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', progress: 0 } : f));
        continue;
      }

      await supabase.from('uploads').insert({
        name:     name.trim() || null,
        note:     note.trim() || null,
        file_url: data.path,
      });

      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100 } : f));
      successCount++;
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      setUploadedCount(successCount);
      await new Promise(r => setTimeout(r, 700));
      setScreen('thanks');
    }
  };

  const resetForm = () => {
    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setName('');
    setNote('');
    setScreen('upload');
  };

  const totalBytes = files.reduce((s, f) => s + f.file.size, 0);
  const pendingFiles = files.filter(f => f.status === 'pending');
  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');

  if (screen === 'thanks') {
    return <ThanksScreen count={uploadedCount} onReset={resetForm} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={NIGHT_BG}>
      {/* Forest silhouette */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
        height: '42%',
        background: `
          radial-gradient(ellipse at 10% 100%, #182214 0%, transparent 50%),
          radial-gradient(ellipse at 35% 100%, #1c2618 0%, transparent 55%),
          radial-gradient(ellipse at 62% 100%, #182214 0%, transparent 50%),
          radial-gradient(ellipse at 88% 100%, #1f2a1a 0%, transparent 55%)
        `,
      }} />

      {/* Far hills */}
      <div className="absolute inset-x-0 pointer-events-none" style={{
        bottom: '38%', height: '110px',
        background: `
          radial-gradient(ellipse at 30% 100%, #1a2418 0%, transparent 65%),
          radial-gradient(ellipse at 75% 100%, #1f2a1a 0%, transparent 60%)
        `,
        opacity: 0.85,
      }} />

      {/* Three.js fairy lights */}
      <FairyLightsBackground density={1.2} intensity={1.1} />

      {/* Paper grain */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, ...GRAIN_OVERLAY }} />

      {/* String light swag */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 6 }}>
        <StringLightSwag />
      </div>

      {/* Scrollable content */}
      <div className="relative min-h-screen flex flex-col items-center px-4 pt-24 pb-16" style={{ zIndex: 10 }}>

        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <Monogram size={58} />
          <h1 className="serif-it mt-4" style={{ fontSize: 52, lineHeight: 0.92, color: '#fbeec8', textShadow: '0 2px 20px rgba(217,164,65,0.4), 0 0 60px rgba(245,214,138,0.25)' }}>
            Gizem<br/>
            <span style={{ fontSize: 28, color: '#e8c277', fontStyle: 'italic' }}>&amp;</span><br/>
            Berkay
          </h1>
          <p className="mt-3 serif" style={{ fontSize: 17, color: '#e8c277', fontStyle: 'italic', opacity: 0.9 }}>
            Bizimle bu anıları paylaş ❤️
          </p>
          <p className="mt-1 eyebrow" style={{ color: '#d9b870', letterSpacing: '0.3em' }}>
            16 · 19 TEMMUZ 2026
          </p>
        </div>

        {/* Main card */}
        <div className="w-full max-w-md card-paper px-7 py-8 relative" style={{ animationDelay: '0.1s' }}>
          {/* Botanical corners */}
          <div className="absolute -top-3 -left-2 pointer-events-none" style={{ transform: 'rotate(-15deg)', zIndex: 2 }}>
            <EucalyptusSprig size={65} />
          </div>
          <div className="absolute -bottom-5 -right-3 pointer-events-none" style={{ transform: 'rotate(165deg)', zIndex: 2 }}>
            <EucalyptusSprig size={55} />
          </div>

          <div className="relative" style={{ zIndex: 3 }}>
            {/* Name */}
            <div className="field mb-4">
              <label>
                İsmin{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, color: '#a89578', fontStyle: 'italic' }}>
                  · isteğe bağlı
                </span>
              </label>
              <input
                type="text"
                placeholder="Sevgili dostumuz..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Note */}
            <div className="field mb-6">
              <label>
                Bir kaç söz{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, color: '#a89578', fontStyle: 'italic' }}>
                  · isteğe bağlı
                </span>
              </label>
              <textarea
                placeholder="Bu anı sizinle paylaşmak istedim..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Dropzone */}
            <div
              className={`dropzone${isDragOver ? ' is-active' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="42" height="42" viewBox="0 0 42 42" style={{ display: 'block', margin: '0 auto 10px' }}>
                <circle cx="21" cy="21" r="19" fill="none" stroke="#6b8f71" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                <path d="M 21 11 L 21 27 M 15 19 L 21 13 L 27 19" stroke="#4f6e54" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 13 30 L 29 30" stroke="#4f6e54" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="serif" style={{ fontSize: 17, color: '#3a3022', fontStyle: 'italic' }}>
                Fotoğraf veya video sürükle
              </div>
              <div style={{ fontSize: 11, color: '#8a7656', marginTop: 5, letterSpacing: '0.04em' }}>
                veya{' '}
                <span style={{ color: '#4f6e54', borderBottom: '1px dotted #4f6e54' }}>
                  cihazından seç
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#a89578', marginTop: 10, fontStyle: 'italic' }}>
                orijinal kalitede yüklenir · fotoğraf &amp; video · sınır yok
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {files.map(item => (
                  <FileChip key={item.id} item={item} onRemove={removeFile} />
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn btn-primary mt-6"
              style={{
                width: '100%',
                opacity: (pendingFiles.length === 0 && !allDone) || isSubmitting ? 0.5 : 1,
              }}
              onClick={handleSubmit}
              disabled={(pendingFiles.length === 0 && !allDone) || isSubmitting}
            >
              {isSubmitting ? 'Yükleniyor...' : 'Anılarımı Gönder'}
            </button>

            {files.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 10, color: '#8a7656', fontSize: 11, letterSpacing: '0.1em' }}>
                {files.length} dosya{' · '}
                {(totalBytes / 1024 / 1024).toFixed(1)} MB toplam
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── File chip ────────────────────────────────────────────
function FileChip({ item, onRemove }: { item: FileItem; onRemove: (id: string) => void }) {
  const isVideo = item.file.type.startsWith('video/');

  return (
    <div className="upload-chip fade-in">
      <div className="upload-thumb">
        {item.preview ? (
          <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#6b8f71,#3d5440)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fbeec8" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        )}
        {isVideo && item.preview && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ width: 0, height: 0, borderLeft: '8px solid #fff', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: 2 }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
          <div className="serif" style={{ fontSize: 13, color: '#3a3022', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.file.name}
          </div>
          <div style={{ fontSize: 10, color: '#8a7656', flexShrink: 0 }}>
            {(item.file.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>

        <div className="progress-track" style={{ marginTop: 6 }}>
          <div className="progress-fill" style={{ width: `${item.progress}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 9, color: '#8a7656', letterSpacing: '0.1em' }}>
          {item.status === 'done'      && <span style={{ color: '#4f6e54' }}>✓ YÜKLENDİ</span>}
          {item.status === 'uploading' && <span>%{Math.round(item.progress)} · YÜKLENİYOR</span>}
          {item.status === 'error'     && <span style={{ color: '#b06b4a' }}>× HATA — TEKRAR DENEYİN</span>}
          {item.status === 'pending'   && <span>BEKLIYOR</span>}
          {item.status !== 'done' && item.status !== 'uploading' && (
            <button
              onClick={() => onRemove(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a89578', fontSize: 13, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Thank you screen ────────────────────────────────────
function ThanksScreen({ count, onReset }: { count: number; onReset: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={NIGHT_BG}>
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '42%', background: 'radial-gradient(ellipse at 20% 100%, #182214 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, #1f2a1a 0%, transparent 55%)' }} />
      <FairyLightsBackground density={1.4} intensity={1.2} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, ...GRAIN_OVERLAY }} />
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 6 }}>
        <StringLightSwag />
      </div>
      <div className="absolute top-6 left-0 right-0 pointer-events-none" style={{ zIndex: 6, opacity: 0.5 }}>
        <StringLightSwag />
      </div>

      {/* Watercolor wash */}
      <div className="absolute pointer-events-none" style={{ top: '25%', left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}>
        <WatercolorBlob color="#d9a441" size={360} opacity={0.22} />
      </div>

      {/* Botanical sides */}
      <div className="absolute pointer-events-none" style={{ top: '32%', left: 10, zIndex: 7, transform: 'rotate(-25deg)' }}>
        <EucalyptusSprig size={110} />
      </div>
      <div className="absolute pointer-events-none" style={{ top: '32%', right: 10, zIndex: 7, transform: 'scaleX(-1) rotate(-25deg)' }}>
        <EucalyptusSprig size={110} />
      </div>

      <div className="relative text-center px-8" style={{ zIndex: 9, maxWidth: 420 }}>
        {/* Wax seal */}
        <div className="wax fade-in-scale" style={{ margin: '0 auto 24px' }}>G&amp;B</div>

        <div className="eyebrow fade-in" style={{ color: '#e8c277', marginBottom: 18, animationDelay: '0.1s' }}>
          — TEŞEKKÜRLER —
        </div>

        <h2 className="serif-it fade-in" style={{
          fontSize: 40, lineHeight: 1.15, color: '#fbeec8',
          textShadow: '0 2px 20px rgba(217,164,65,0.4)',
          marginBottom: 16, animationDelay: '0.15s',
        }}>
          Bu güzel anı için<br/>sana minnettarız
        </h2>

        <p className="serif fade-in" style={{ fontSize: 16, color: '#e8c277', fontStyle: 'italic', lineHeight: 1.65, opacity: 0.9, animationDelay: '0.2s' }}>
          Paylaştığın her kare<br/>bizim için çok kıymetli
        </p>

        {/* Floating hearts */}
        <div style={{ position: 'relative', height: 60, marginTop: 8 }}>
          <div style={{ position: 'absolute', left: '20%', top: 10, animation: 'float-up 4s ease-in-out infinite' }}>
            <HeartScribble size={28} color="#e8c277" />
          </div>
          <div style={{ position: 'absolute', right: '20%', top: 20, animation: 'float-up 5s ease-in-out infinite 0.5s' }}>
            <HeartScribble size={20} color="#d9a441" />
          </div>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 30, animation: 'float-up 6s ease-in-out infinite 1s' }}>
            <HeartScribble size={16} color="#b06b4a" />
          </div>
        </div>

        {/* Counter */}
        {count > 0 && (
          <div className="fade-in" style={{ marginTop: 16, animationDelay: '0.35s' }}>
            <p className="serif-it" style={{ color: '#d9c79a', fontSize: 14, fontStyle: 'italic', opacity: 0.85 }}>
              senin de katkınla
            </p>
            <div className="serif" style={{ fontSize: 52, color: '#fbeec8', lineHeight: 1, fontWeight: 300, marginTop: 4 }}>
              {count} <span style={{ fontSize: 20, fontStyle: 'italic', color: '#e8c277' }}>anı</span>
            </div>
            <div className="eyebrow" style={{ color: '#e8c277', marginTop: 4 }}>paylaşıldı</div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 fade-in" style={{ animationDelay: '0.45s' }}>
          <button
            className="btn btn-ghost"
            style={{ borderColor: 'rgba(232,194,119,0.5)', color: '#fbeec8' }}
            onClick={onReset}
          >
            Yeni Anı Paylaş
          </button>
          <div className="serif-it" style={{ color: '#a89578', fontSize: 13, fontStyle: 'italic', letterSpacing: '0.08em' }}>
            — Gizem &amp; Berkay —
          </div>
        </div>
      </div>
    </div>
  );
}
