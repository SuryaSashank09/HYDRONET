import React, { useState, useRef } from 'react';
import api from '../../utils/api';

/**
 * ImageUploader
 * Uploads images to /api/upload/images and returns URLs.
 * Props:
 *   onUpload(urls: string[]) — called with the array of uploaded image URLs
 *   maxFiles — max number of images (default 3)
 *   label — field label text
 */
export default function ImageUploader({ onUpload, maxFiles = 3, label = 'Attach Photos (optional)' }) {
  const [previews,  setPreviews]  = useState([]);  // { url, file, status }
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files.length) return;
    const allowed = Array.from(files).slice(0, maxFiles - previews.length);
    if (!allowed.length) return;

    // Show local previews immediately
    const localPreviews = allowed.map(f => ({
      localUrl: URL.createObjectURL(f),
      file: f,
      status: 'uploading',
      serverUrl: null,
    }));
    setPreviews(prev => [...prev, ...localPreviews]);
    setUploading(true);

    try {
      const formData = new FormData();
      allowed.forEach(f => formData.append('images', f));

      const { data } = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        const serverUrls = data.files.map(f => f.url);

        setPreviews(prev => {
          const updated = [...prev];
          let serverIdx = 0;
          for (let i = 0; i < updated.length; i++) {
            if (updated[i].status === 'uploading') {
              updated[i] = { ...updated[i], status: 'done', serverUrl: serverUrls[serverIdx++] };
            }
          }
          return updated;
        });

        const allUrls = [...previews.filter(p => p.serverUrl).map(p => p.serverUrl), ...serverUrls];
        onUpload(allUrls);
      }
    } catch (err) {
      setPreviews(prev =>
        prev.map(p => p.status === 'uploading' ? { ...p, status: 'error' } : p)
      );
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx) => {
    const updated = previews.filter((_, i) => i !== idx);
    setPreviews(updated);
    onUpload(updated.filter(p => p.serverUrl).map(p => p.serverUrl));
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em', display: 'block', marginBottom: '0.5rem' }}>
        {label}
      </label>

      {/* Drop zone */}
      {previews.length < maxFiles && (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--color-surface-2)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-teal)'; e.currentTarget.style.background = 'var(--color-teal-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📸</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {uploading ? 'Uploading...' : `Drop images here or click to browse`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            JPG, PNG, WebP · Max 5MB · Up to {maxFiles} photos
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img
                src={p.localUrl}
                alt={`preview-${i}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${p.status === 'error' ? 'var(--color-rose)' : p.status === 'done' ? 'var(--color-emerald)' : 'var(--color-border)'}`,
                  opacity: p.status === 'uploading' ? 0.6 : 1,
                }}
              />
              {p.status === 'uploading' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)',
                }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                </div>
              )}
              {p.status === 'done' && (
                <div style={{ position: 'absolute', top: 2, left: 2, fontSize: '0.7rem', background: 'var(--color-emerald)', color: 'white', borderRadius: 4, padding: '0 3px' }}>✓</div>
              )}
              {p.status === 'error' && (
                <div style={{ position: 'absolute', top: 2, left: 2, fontSize: '0.7rem', background: 'var(--color-rose)', color: 'white', borderRadius: 4, padding: '0 3px' }}>!</div>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  background: 'var(--color-rose)', color: 'white', border: 'none',
                  borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
