"use client"

import React from 'react'
import Image from 'next/image'

interface UnicornParts {
  body: string
  hair: string
  eyes: string
  mouth: string
  accessory: string
}

interface CompositeUnicornProps {
  parts: UnicornParts
  size?: number
}

export function CompositeUnicorn({ parts, size = 128 }: CompositeUnicornProps) {
  // Function to get image source - now handles both blob URLs and local paths
  const getImageSrc = (partUrl: string, fallbackCategory?: string) => {
    // If it's already a full URL (blob URL), use it directly
    if (partUrl.startsWith('http') || partUrl.startsWith('blob:')) {
      return partUrl;
    }
    
    // If it's a local path starting with /, use it directly
    if (partUrl.startsWith('/')) {
      return partUrl;
    }
    
    // Fallback: try to map filename to local path (for backward compatibility)
    const imageMap: { [key: string]: { [key: string]: string } } = {
      bodies: {
        "body.png": "/images/unicorn/bodies/body.png",
        "body_h.png": "/images/unicorn/bodies/body_h.png",
      },
      hair: {
        "hair_blue.png": "/images/unicorn/hair/hair_blue.png",
        "hair_g.png": "/images/unicorn/hair/hair_g.png",
      },
      eyes: {
        "eye_h.png": "/images/unicorn/eyes/eye_h.png",
        "eye_heart.png": "/images/unicorn/eyes/eye_heart.png",
      },
      mouths: {
        "m_.png": "/images/unicorn/mouths/m_.png",
        "m_ice.png": "/images/unicorn/mouths/m_ice.png",
      },
      accessories: {
        "corn_ice1.png": "/images/unicorn/accessories/corn_ice1.png",
        "corn_ice2.png": "/images/unicorn/accessories/corn_ice2.png",
      },
    }
    
    if (fallbackCategory && imageMap[fallbackCategory]?.[partUrl]) {
      return imageMap[fallbackCategory][partUrl];
    }
    
    return `/placeholder.svg?height=${size}&width=${size}`;
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Body (base layer) */}
      <Image
        src={getImageSrc(parts.body, "bodies")}
        alt="Unicorn body"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 1 }}
      />

      {/* Hair */}
      <Image
        src={getImageSrc(parts.hair, "hair")}
        alt="Unicorn hair"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 2 }}
      />

      {/* Eyes */}
      <Image
        src={getImageSrc(parts.eyes, "eyes")}
        alt="Unicorn eyes"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 3 }}
      />

      {/* Mouth */}
      <Image
        src={getImageSrc(parts.mouth, "mouths")}
        alt="Unicorn mouth"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 4 }}
      />

      {/* Accessory (top layer) */}
      <Image
        src={getImageSrc(parts.accessory, "accessories")}
        alt="Unicorn accessory"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 5 }}
      />
    </div>
  )
} 