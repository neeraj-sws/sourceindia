import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ImageWithFallback = ({ src, alt = 'Image', width = 100, height = 100, showFallback = true }) => {
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
      return (<img className="object-fit-cover mt-3" src="/default.png" width={width} height={height} alt="Fallback" />);
    } else {
      return null;
    }
  }

  return (<img className="object-fit-cover mt-3" src={src} width={width} height={height} alt={alt} />);
};

export default ImageWithFallback;