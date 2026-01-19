import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ImageFront = ({ src, alt = 'Image', width = 80, height = 80, showFallback = true, style = null, className = null, defaultimg = null }) => {
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    const checkImage = async () => {
      try {
        await axios.head(src); setImageExists(true);
      } catch {
        setImageExists(false);
      }
    };
    if (src) checkImage();
  }, [src]);

  if (!imageExists) {
    if (showFallback) {
      const fallbackSrc = defaultimg || '/default.png';
      return (<img className={`img-fluid ${className || ''}`} src={fallbackSrc} loading="lazy"
        decoding="async" alt={alt || 'Image'} style={style} />);
    } else {
      return null;
    }
  }

  return (<img className="img-fluid" src={src} alt={alt} loading="lazy"
    decoding="async" />);
};

export default ImageFront;