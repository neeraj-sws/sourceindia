import React, { useEffect, useState } from 'react';

// Simple in-memory cache for image existence checks
const _imageExistenceCache = new Map();

const ImageWithFallback = ({ src, alt = 'Image', width = 80, height = 80, showFallback = true }) => {
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    if (!src || src === 'null' || src.endsWith('/null')) {
      setImageExists(false);
      return;
    }

    if (_imageExistenceCache.has(src)) {
      setImageExists(Boolean(_imageExistenceCache.get(src)));
      return;
    }

    let mounted = true;
    const img = new Image();
    let timeoutId = null;

    const onLoad = () => {
      if (!mounted) return;
      _imageExistenceCache.set(src, true);
      setImageExists(true);
      cleanup();
    };

    const onError = () => {
      if (!mounted) return;
      _imageExistenceCache.set(src, false);
      setImageExists(false);
      cleanup();
    };

    const cleanup = () => {
      try { img.onload = null; img.onerror = null; } catch (e) {}
      if (timeoutId) clearTimeout(timeoutId);
    };

    img.onload = onLoad;
    img.onerror = onError;
    // small timeout to guard against very slow responses
    timeoutId = setTimeout(() => {
      if (!mounted) return;
      _imageExistenceCache.set(src, false);
      setImageExists(false);
      cleanup();
    }, 5000);

    img.src = src;

    return () => { mounted = false; cleanup(); };
  }, [src]);

  if (!imageExists) {
    if (showFallback) {
      return (<img className="object-fit-cover  img-fluid img-thumbnail" src="/default.png" width={width} height={height} alt="Fallback" loading="lazy"
        decoding="async" />);
    } else {
      return null;
    }
  }

  return (<img className="object-fit-cover  img-fluid img-thumbnail" src={src} width={width} height={height} alt={alt} loading="lazy" decoding="async" />);
};

export default ImageWithFallback;