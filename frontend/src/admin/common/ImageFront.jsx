import React, { useEffect, useMemo, useState } from 'react';

const ImageFront = ({
  src,
  alt = 'Image',
  width = 80,
  height = 80,
  loading = 'lazy',
  fetchPriority = 'auto',
  showFallback = true,
  style = null,
  className = null,
  defaultimg = null
}) => {
  const fallbackSrc = useMemo(() => defaultimg || '/default.png', [defaultimg]);
  const normalizedSrc = useMemo(() => {
    if (!src || src === 'null' || src.endsWith('/null')) return '';
    return src;
  }, [src]);

  const [currentSrc, setCurrentSrc] = useState(normalizedSrc || fallbackSrc);

  useEffect(() => {
    if (normalizedSrc) {
      setCurrentSrc(normalizedSrc);
      return;
    }

    if (showFallback) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    setCurrentSrc('');
  }, [normalizedSrc, fallbackSrc, showFallback]);

  if (!currentSrc) return null;

  return (
    <img
      className={`img-fluid ${className || ''}`}
      src={currentSrc}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      width={width}
      height={height}
      onError={(e) => {
        if (!showFallback) return;
        if (e.currentTarget.src.includes(fallbackSrc)) return;
        e.currentTarget.src = fallbackSrc;
      }}
      style={style}
    />
  );
};

export default ImageFront;
