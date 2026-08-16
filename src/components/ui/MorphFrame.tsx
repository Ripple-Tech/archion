import React, { useEffect, useState } from "react";
import { blobPathAt, type BlobConfig } from "@/lib/blob-architectural";

interface MorphFrameProps {
  size?: number;
  radius?: number;
  className?: string;
}

export const MorphFrame: React.FC<MorphFrameProps> = ({
  size = 300,
  radius = 100,
  className = "",
}) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      setTime((now - startTime) / 1000);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  const config: BlobConfig = {
    size,
    radius,
  };

  const path = blobPathAt(time, config);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="currentColor"
      />
    </svg>
  );
};

export default MorphFrame;