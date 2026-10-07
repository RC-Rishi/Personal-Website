import { useEffect, useState } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from 'three'

function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** The reference GLB packs the front/back into two halves of a square UV atlas. */
export function useCardTexture(front: string, back: string | undefined, color: string, invalidate: () => void) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null)
  useEffect(() => {
    let current = true
    let owned: CanvasTexture | undefined
    Promise.all([loadImage(front), loadImage(back)]).then((images) => {
      if (!current) return
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1024
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1024, 1024)
      images.forEach((img, i) => {
        if (!img) return
        const scale = Math.max(512 / img.naturalWidth, (1024 * .757) / img.naturalHeight)
        const width = img.naturalWidth * scale, height = img.naturalHeight * scale
        ctx.save()
        ctx.beginPath(); ctx.rect(i * 512, 0, 512, 1024); ctx.clip()
        ctx.drawImage(img, i * 512 + (512 - width) / 2, (1024 * .757 - height) / 2, width, height)
        ctx.restore()
      })
      owned = new CanvasTexture(canvas)
      owned.flipY = false
      owned.colorSpace = SRGBColorSpace
      owned.wrapS = owned.wrapT = RepeatWrapping
      owned.anisotropy = 16
      setTexture(owned)
      invalidate()
    })
    return () => { current = false; owned?.dispose() }
  }, [front, back, color, invalidate])
  return texture
}

export function useStrapTexture(src: string | null, invalidate: () => void) {
  const [texture, setTexture] = useState<Texture | null>(null)
  useEffect(() => {
    let current = true
    if (!src) return
    const owned = new TextureLoader().load(src, (loaded) => {
      if (!current) return
      loaded.wrapS = loaded.wrapT = RepeatWrapping
      loaded.anisotropy = 16
      setTexture(loaded)
      invalidate()
    }, undefined, () => { if (current) { setTexture(null); invalidate() } })
    return () => { current = false; owned.dispose() }
  }, [src, invalidate])
  return src ? texture : null
}
