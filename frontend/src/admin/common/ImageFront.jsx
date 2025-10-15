import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ImageFront = ({ src, alt = 'Image', width = 80, height = 80, showFallback = true }) => {
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
      return (<img className="img-fluid" src="/default.png" alt="Fallback" />);
    } else {
      return null;
    }
  }

  return (<img className="img-fluid" src={src} alt={alt} />);
};

export default ImageFront;