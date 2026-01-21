import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

    const checkImage = async () => {
      try {
        await axios.head(src);
        setImageExists(true);
      } catch {
        setImageExists(false);
      }
    };

    checkImage();
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
