import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ImageWithFallback = ({ src, alt = 'Image', width = 80, height = 80, showFallback = true }) => {
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
      return (<img className="object-fit-cover  img-fluid img-thumbnail" src="/default.png" width={width} height={height} alt="Fallback" loading="lazy"
        decoding="async" />);
    } else {
      return null;
    }
  }

  return (<img className="object-fit-cover  img-fluid img-thumbnail" src={src} width={width} height={height} alt={alt} loading="lazy" decoding="async" />);
};

export default ImageWithFallback;