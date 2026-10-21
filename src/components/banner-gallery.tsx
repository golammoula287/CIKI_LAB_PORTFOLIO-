"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type BannerPhoto = { id: string; alt: string };
export function BannerGallery({ photos }: { photos: BannerPhoto[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState([
    { x: 0, y: 0, angle: -2, scale: 1, layer: 3 },
    { x: 8, y: -6, angle: 7, scale: 0.96, layer: 2 },
    { x: -8, y: 6, angle: -8, scale: 0.94, layer: 1 },
  ]);
  useEffect(() => {
    if (photos.length < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (
        reducedMotion.matches ||
        document.hidden ||
        root.current?.matches(":hover") ||
        root.current?.contains(document.activeElement)
      )
        return;
      setLayout((current) => {
        const next =
          (current.findIndex((card) => card.layer === 3) + 1) % photos.length;
        return current.map((card, index) => {
          const rank = (index - next + photos.length) % photos.length;
          return {
            x:
              rank === 0
                ? (Math.random() - 0.5) * 3
                : (rank === 1 ? 1 : -1) * (5 + Math.random() * 3),
            y:
              rank === 0
                ? (Math.random() - 0.5) * 3
                : (rank === 1 ? -1 : 1) * (4 + Math.random() * 3),
            angle:
              rank === 0
                ? (Math.random() - 0.5) * 4
                : (rank === 1 ? 1 : -1) * (4 + Math.random() * 3),
            scale: 1 - rank * 0.035,
            layer: 3 - rank,
          };
        });
      });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [photos.length]);
  return (
    <div
      className="banner-gallery"
      ref={root}
      role="region"
      aria-label="Research image stack. Focus or hover to pause motion."
      tabIndex={photos.length > 1 ? 0 : undefined}
    >
      <div className={`banner-photo-stage${photos.length ? "" : " is-brand"}`}>
        {photos.length ? (
          photos.map((photo, index) => (
            <div
              className="banner-photo"
              key={photo.id}
              style={{
                transform: `translate(${layout[index].x}%, ${layout[index].y}%) rotate(${layout[index].angle}deg) scale(${layout[index].scale})`,
                zIndex: layout[index].layer,
              }}
            >
              <Image
                src={`/api/media/${photo.id}`}
                alt={photo.alt}
                fill
                sizes="(max-width: 580px) 90vw, 420px"
                unoptimized
                priority={index === 0}
              />
            </div>
          ))
        ) : (
          <div className="banner-photo brand-photo">
            <Image
              src="/brand/ciki-full-logo.png"
              alt="CIKI — Cognexa Center for Intelligence, Knowledge, and Innovation"
              fill
              sizes="(max-width: 580px) 90vw, 420px"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}
