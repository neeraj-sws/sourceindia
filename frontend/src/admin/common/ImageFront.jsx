import React, { useEffect, useState } from 'react';

// Simple in-memory cache for image existence checks to avoid repeated network probes
const _imageExistenceCache = new Map();

const ImageFront = ({
  src,
  alt = 'Image',
  width = 80,
  height = 80,
  showFallback = true,
  style = null,
  className = null,
  defaultimg = null
}) => {
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    if (!src || src === 'null' || src.endsWith('/null')) {
      setImageExists(false);
      return;
    }

    // Return cached result when available
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
    // small timeout to guard against very slow responses (treat as not available)
    timeoutId = setTimeout(() => {
      if (!mounted) return;
      _imageExistenceCache.set(src, false);
      setImageExists(false);
      cleanup();
    }, 5000);

    // start loading image (this triggers browser image fetch, not a HEAD request)
    img.src = src;

    return () => { mounted = false; cleanup(); };
  }, [src]);

  if (!imageExists) {
    if (!showFallback) return null;

    return (
      <img
        className={`img-fluid ${className || ''}`}
        src={defaultimg || '/default.png'}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={style}
      />
    );
  }

  return (
    <img
      className={`img-fluid ${className || ''}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={style}
    />
  );
};

export default ImageFront;
