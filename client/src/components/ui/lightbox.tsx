import { useState, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";

interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  open: boolean;
  index: number;
  onClose: () => void;
}

export function ImageLightbox({ images, open, index, onClose }: ImageLightboxProps) {
  const slides = images.map((img) => ({
    src: img.src,
    alt: img.alt || "",
    title: img.title,
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails, Counter]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
      }}
      thumbnails={{
        position: "bottom",
        width: 80,
        height: 60,
        gap: 8,
      }}
      counter={{
        container: { style: { top: "unset", bottom: 0, left: "50%", transform: "translateX(-50%)" } },
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
      }}
      carousel={{
        padding: "16px",
      }}
    />
  );
}

export function useLightbox() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openLightbox = useCallback((idx: number = 0) => {
    setIndex(idx);
    setOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    index,
    openLightbox,
    closeLightbox,
  };
}
