"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Keyboard, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import styles from './BannerSlider.module.css';
import Image from 'next/image';

type Banner = {
  id: string;
  title?: string;
  caption?: string | null;
  imageUrl: string;
  link?: string | null;
};

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const swiperRef = useRef<any>(null);
  const [autoplayStarted, setAutoplayStarted] = useState(false);
  const raw = useMemo(() => (Array.isArray(banners) ? [...banners] : []), [banners]);
  const uniqueCount = raw.length;

  // Handle low-count cases explicitly:
  // - 0 banners: nothing (handled above)
  // - 1 banner: render a static single banner (no autoplay, no navigation)
  // - 2 banners: enable loop/autoplay and duplicate slides so they alternate smoothly
  // - >=3 banners: enable loop/autoplay and ensure at least 8 slides for smooth coverflow
  const shouldLoop = uniqueCount >= 2;

  const slides = useMemo(() => {
    let computed = [...raw];
    if (shouldLoop) {
      if (uniqueCount === 2) {
        while (computed.length < 6) computed = computed.concat(raw);
      } else {
        const desiredTotal = 8;
        const repeats = Math.max(1, Math.ceil(desiredTotal / uniqueCount));
        while (computed.length < repeats * uniqueCount) computed = computed.concat(raw);
      }
    }

    return computed.slice(0, Math.max(uniqueCount, computed.length));
  }, [raw, shouldLoop, uniqueCount]);

  // Choose an initial slide - always start from center for stability
  // This ensures the middle card is always properly positioned
  const initialSlide = useMemo(() => {
    if (!shouldLoop || slides.length === 0) {
      return 0;
    }

    let start = Math.floor(slides.length / 2);

    if (uniqueCount >= 3) {
      const targetId = raw[1]?.id;
      if (targetId) {
        const centerIdx = Math.floor(slides.length / 2);
        let bestIdx = centerIdx;
        let bestDist = Infinity;

        slides.forEach((slide, idx) => {
          if (slide.id === targetId) {
            const dist = Math.abs(idx - centerIdx);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = idx;
            }
          }
        });

        start = bestIdx;
      }
    }

    return start;
  }, [shouldLoop, slides, uniqueCount, raw]);

  // Start autoplay only after first user interaction to respect user's desire
  // for the carousel to be idle until the user interacts. We still set up
  // autoplay config ahead of time and will start it programmatically.
  // Note: this effect must run (or be declared) before any early returns so
  // hooks order is stable across renders.
  // Compute a small window of slides around the initialSlide that should be
  // loaded eagerly. Use IDs rather than numeric indices so duplicated loop
  // slides (which share the same id) are also eager-loaded.
  const eagerIds = useMemo(() => {
    const ids = new Set<string>();
    if (slides.length === 0) {
      return ids;
    }

    const window = 3;
    for (let k = -window; k <= window; k++) {
      const idx = ((initialSlide + k) % slides.length + slides.length) % slides.length;
      const s = slides[idx];
      if (s && s.id) ids.add(s.id);
    }
    return ids;
  }, [slides, initialSlide]);
  useEffect(() => {
    // only attach listeners for multi-banner carousels
    if (!shouldLoop) return;
    const node = document.querySelector(`.${styles.wrapper}`);
    if (!node) return;
    const start = () => {
      if (autoplayStarted) return;
      setAutoplayStarted(true);
      try { swiperRef.current?.autoplay?.start(); } catch (e) { /* ignore */ }
    };
    node.addEventListener('mousemove', start, { once: true });
    node.addEventListener('touchstart', start, { once: true });
    node.addEventListener('mouseenter', start, { once: true });
    return () => {
      node.removeEventListener('mousemove', start);
      node.removeEventListener('touchstart', start);
      node.removeEventListener('mouseenter', start);
    };
  }, [autoplayStarted, shouldLoop]);

  // Helper: update DOM stacking (z-index) so active slide always appears above others.
  // We set higher z-index for closer slides to avoid duplicated/loop timing issues.
  function updateSlideStack(sw: any) {
    if (!sw || !sw.slides) return;
    const active = sw.activeIndex ?? 0;
    const total = sw.slides.length || 0;
    for (let idx = 0; idx < total; idx++) {
      const el = sw.slides[idx] as HTMLElement;
      if (!el) continue;
      // distance in circular space
      const dist = Math.min(Math.abs(idx - active), Math.abs(idx - active + total), Math.abs(idx - active - total));
      let z = 100;
      if (dist === 0) z = 1000;
      else if (dist === 1) z = 600;
      else if (dist === 2) z = 400;
      else if (dist === 3) z = 200;
      else z = 100;
      el.style.zIndex = String(z);
      // ensure duplicate slides keep lower base unless they are active
      if (el.classList.contains('swiper-slide-duplicate') && dist !== 0) {
        el.style.zIndex = String(Math.min(z, 50));
      }
    }
  }

  // Preload images for eagerIds using a simple Image() preload so that
  // even duplicated loop slides (rendered later by Swiper) have their
  // assets already cached by the browser. This helps when the rightmost
  // (last) slide is visually present but its Image component hasn't yet
  // triggered a network request.
  useEffect(() => {
    if (slides.length === 0 || eagerIds.size === 0) return;

    const loaders: HTMLImageElement[] = [];
    eagerIds.forEach((id) => {
      slides.forEach((s) => {
        if (s.id === id && s.imageUrl) {
          try {
            const img = document.createElement('img');
            img.src = s.imageUrl;
            loaders.push(img);
          } catch {
            /* ignore */
          }
        }
      });
    });

    return () => {
      loaders.length = 0;
    };
  }, [slides, eagerIds]);

  // If only one banner, render a static card (no Swiper)
  if (uniqueCount === 1) {
    const b = raw[0];
    return (
      <div className={`${styles.wrapper} ${styles.singleBanner}`}>
        <div className={styles.singleCard}>
          <div className={styles.card} role="group" aria-label={b.title ?? 'banner'}>
            <div className={styles.imageWrap}>
              <Image
                src={b.imageUrl}
                alt={b.title ?? ''}
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                priority
                loading="eager"
              />
            </div>
            <div className={`${styles.meta} ${styles.metaCenter}`}>
              {b.title ? <h3 className={styles.title}>{b.title}</h3> : null}
              {b.caption ? <p className={styles.caption}>{b.caption}</p> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use coverflow for any multiple banners so the center slide is emphasized consistently
  const useCoverflow = uniqueCount >= 2;

  // Consistent slidesPerView for all multi-banner cases (except single banner)
  const slidesPerViewDefault = 1.6;

  return (
    // Use RTL so ordering progresses to the left (left neighbor is the next item)
    <div className={styles.wrapper} dir="rtl">
      <Swiper
        modules={[Autoplay, Keyboard, Navigation, EffectCoverflow]}
        onSwiper={(sw) => {
          swiperRef.current = sw;
          // Ensure proper initialization with longer delay for stability
          try {
            setTimeout(() => {
              sw.slideTo(initialSlide, 0);
              // Force update to ensure proper positioning
              sw.update();
              // Apply stacking order so center slide stays above others
              try { updateSlideStack(sw); } catch (err) { /* ignore */ }
            }, 150);
          } catch (e) { /* ignore */ }
        }}
        onInit={(sw) => {
          try { 
            setTimeout(() => { 
              sw.slideTo(initialSlide, 0);
              sw.update();
              try { updateSlideStack(sw); } catch (err) { /* ignore */ }
            }, 150); 
          } catch (e) { /* ignore */ }
        }}
        onSlideChange={(sw) => {
          try { updateSlideStack(sw); } catch (err) { /* ignore */ }
        }}
        effect={useCoverflow ? 'coverflow' : 'slide'}
        centeredSlides={true}
        loop={shouldLoop}
        keyboard={{ enabled: true, onlyInViewport: true }}
        navigation={uniqueCount > 1}
        {...(useCoverflow ? { coverflowEffect: { rotate: 0, stretch: -22, depth: 88, modifier: 1.05, slideShadows: false } } : {})}
        autoplay={shouldLoop ? { delay: 3000, disableOnInteraction: true, pauseOnMouseEnter: true, reverseDirection: false } : false}
        slidesPerView={1.7}
        // Approximate 30% overlap by using negative spaceBetween (px) per breakpoint.
        // Values chosen as ~30% of estimated slide width for each breakpoint.
        spaceBetween={-420}
        breakpoints={{
          0: { slidesPerView: 1.15, spaceBetween: -40 },
          640: { slidesPerView: 1.2, spaceBetween: -100 },
          900: { slidesPerView: 1.5, spaceBetween: -280 },
          1200: { slidesPerView: 1.7, spaceBetween: -420 },
        }}
        initialSlide={initialSlide}
        aria-roledescription="carousel"
      >
        {slides.map((b, i) => (
          <SwiperSlide key={`${b.id}-${i}`} className={styles.slide}>
            <div className={styles.card} role="group" aria-label={b.title ?? 'banner'}>
              <div className={styles.imageWrap}>
                <Image
                  src={b.imageUrl}
                  alt={b.title ?? ''}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority={eagerIds.has(b.id)}
                  loading={eagerIds.has(b.id) ? 'eager' : 'lazy'}
                />
              </div>
              <div className={`${styles.meta} ${styles.metaCenter}`}>
                {b.title ? <h3 className={styles.title}>{b.title}</h3> : null}
                {b.caption ? <p className={styles.caption}>{b.caption}</p> : null}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
