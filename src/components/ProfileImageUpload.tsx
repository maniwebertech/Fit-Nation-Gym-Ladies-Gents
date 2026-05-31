'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

interface Props {
  currentUrl: string | null
  gender: 'Male' | 'Female'
  onChange: (blob: Blob | null) => void
}

function MaleAvatar() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(27,63,204,0.18)" />
      <circle cx="40" cy="28" r="14" fill="rgba(107,143,255,0.6)" />
      <ellipse cx="40" cy="62" rx="22" ry="14" fill="rgba(107,143,255,0.4)" />
    </svg>
  )
}

function FemaleAvatar() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(255,100,180,0.15)" />
      <circle cx="40" cy="28" r="14" fill="rgba(255,100,180,0.6)" />
      <ellipse cx="40" cy="62" rx="22" ry="14" fill="rgba(255,100,180,0.35)" />
      <path d="M22 30 Q22 12 40 12 Q58 12 58 30" fill="rgba(255,100,180,0.22)" />
    </svg>
  )
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 300, 300)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.88))
}

export default function ProfileImageUpload({ currentUrl, gender, onChange }: Props) {
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const prevPreview = useRef<string | null>(null)

  useEffect(() => {
    return () => { if (prevPreview.current) URL.revokeObjectURL(prevPreview.current) }
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setPixelCrop(pixels)
  }, [])

  async function confirmCrop() {
    if (!rawSrc || !pixelCrop) return
    const blob = await getCroppedBlob(rawSrc, pixelCrop)
    if (prevPreview.current) URL.revokeObjectURL(prevPreview.current)
    const url = URL.createObjectURL(blob)
    prevPreview.current = url
    setPreviewUrl(url)
    setCleared(false)
    setRawSrc(null)
    onChange(blob)
  }

  function handleRemove() {
    if (prevPreview.current) { URL.revokeObjectURL(prevPreview.current); prevPreview.current = null }
    setPreviewUrl(null)
    setCleared(true)
    onChange(null)
  }

  const displayUrl = previewUrl ?? (cleared ? null : currentUrl)

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Avatar preview circle */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: '2px solid var(--border)', background: 'var(--bg-card2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {displayUrl
            ? <img src={displayUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : gender === 'Male' ? <MaleAvatar /> : <FemaleAvatar />
          }
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              UPLOAD
            </button>
            <button type="button" onClick={() => cameraRef.current?.click()} className="btn-ghost"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              CAMERA
            </button>
          </div>
          {displayUrl && (
            <button type="button" onClick={handleRemove}
              style={{ fontSize: '0.7rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em', color: '#FF3B5C', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', marginBottom: 4 }}>
              REMOVE PHOTO
            </button>
          )}
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Optional · JPG, PNG, WebP</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileSelect} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* Crop modal */}
      {rawSrc && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'rgba(0,0,0,0.96)' }}>
          <div className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: '#fff', fontSize: '1.1rem', letterSpacing: '0.06em' }}>
              CROP PHOTO
            </h3>
            <button type="button" onClick={() => setRawSrc(null)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              ✕
            </button>
          </div>

          <div className="relative flex-1" style={{ minHeight: 0 }}>
            <Cropper
              image={rawSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </div>

          <div className="px-5 py-5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,14,26,0.8)' }}>
            <div className="flex items-center gap-3 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#39FF14' }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
              </svg>
            </div>
            <button type="button" onClick={confirmCrop} className="btn-primary w-full justify-center"
              style={{ fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.95rem' }}>
              USE THIS PHOTO
            </button>
          </div>
        </div>
      )}
    </>
  )
}
