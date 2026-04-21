import { useRef, useEffect } from 'react';
import { useSpring, useAnimationFrame } from 'motion/react';

export function ScoreBlob({ targetX, targetY }: { targetX: number; targetY: number }) {
  const path0 = useRef<SVGPathElement>(null);
  const path1 = useRef<SVGPathElement>(null);
  const path2 = useRef<SVGPathElement>(null);

  // Smooth animation to target coordinates
  const animatedX = useSpring(targetX, { stiffness: 45, damping: 20 });
  const animatedY = useSpring(targetY, { stiffness: 45, damping: 20 });

  useEffect(() => {
    animatedX.set(targetX);
    animatedY.set(targetY);
  }, [targetX, targetY, animatedX, animatedY]);

  useAnimationFrame((t) => {
    const nx = Math.max(-1, Math.min(1, animatedX.get() || 0));
    const ny = Math.max(-1, Math.min(1, animatedY.get() || 0));
    const time = t * 0.001; // Scale to seconds

    if (path0.current) path0.current.setAttribute("d", buildBlobPath(nx, ny, time, 0));
    if (path1.current) path1.current.setAttribute("d", buildBlobPath(nx, ny, time, 1));
    if (path2.current) path2.current.setAttribute("d", buildBlobPath(nx, ny, time, 2));

    if (path0.current) {
        // Compute interpolated color and apply directly via attribute
        path0.current.setAttribute("fill", interpolateColor(nx, ny));
    }
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
      {/* Dynamic filters like drop shadows could be added here */}
      <path 
        ref={path0} 
        opacity="0.95" 
      />
      <path 
        ref={path1} 
        fill="#ffffff" 
        opacity="0.3" 
        style={{ mixBlendMode: 'overlay' }} 
      />
      <path 
        ref={path2} 
        fill="#000000" 
        opacity="0.25" 
        style={{ mixBlendMode: 'overlay' }} 
      />
    </svg>
  );
}

// Generates an smooth continuous SVG path based on (x,y) scoring mapped to organic properties
function buildBlobPath(nx: number, ny: number, t: number, layer: number = 0): string {
  const numPoints = 120; // High count for smoothness & safe integer multiplication steps
  let d = "";
  
  // Layers render slightly smaller as index grows.
  const rBase = 90 - (layer * 30); 
  const centerX = 150;
  const centerY = 150;

  // Derive trait intensities
  const spikyEdge = Math.max(0, -nx);       // sharp spikes (Left)
  const smoothFactor = Math.max(0, nx);     // soft/smooth waves (Right)
  const blueFactor = smoothFactor * Math.max(0, -ny);  // fast, excited (Bottom Right)
  const redFactor = Math.max(0, -nx) * Math.max(0, -ny); // internal highly spiky (Bottom Left)

  // Adjust global time scaling based on "excitedness" (bottom right is fast)
  const speed = 1.2 + (blueFactor * 2.0) + (redFactor * 0.8);
  const time = t * speed;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    let r = rBase;

    // 1) Base breathing: slow, gentle
    r += Math.sin(time * 2.0 + angle * 3) * 5;

    // 2) Smooth Wavy (nx > 0)
    if (smoothFactor > 0.01) {
      r += Math.sin(angle * 4 - time * 2) * (8 * smoothFactor);
      r += Math.sin(angle * 3 + time * 1.5) * (5 * smoothFactor);
    }

    // 3) Excited Blue Waves (+x, -y)
    if (blueFactor > 0.01) {
      r += Math.cos(angle * 8 + time * 6) * (12 * blueFactor);
    }

    // 4) Spiky Edge (-x)
    if (spikyEdge > 0.01) {
      const spikeFreq = 20 + layer * 6; 
      r += Math.sin(angle * spikeFreq + time * 4) * (12 * spikyEdge);
      r += Math.cos(angle * (spikeFreq * 1.5) - time * 3.5) * (8 * spikyEdge);
    }

    // 5) Internal Spikes (-x, -y) ONLY active heavily on inner layers
    if (layer > 0 && redFactor > 0.01) {
      const innerSpikeFreq = 24 + layer * 8;
      // Multiplying by layer makes innermost layer the spikiest!
      r += Math.sin(angle * innerSpikeFreq + time * 8) * (30 * redFactor * layer);
    }

    // Clamp radius
    r = Math.max(1, r);

    const ax = centerX + r * Math.cos(angle);
    const ay = centerY + r * Math.sin(angle);

    if (i === 0) d += `M ${ax} ${ay} `;
    else d += `L ${ax} ${ay} `;
  }
  return d + "Z";
}

// A completely re-written radial interpolation logic to perfectly map the colors provided 
// by the reference picture, scaling across Euclidean distances from quadrant corners.
function interpolateColor(nx: number, ny: number): string {
  const c1 = { r: 171, g: 208, b: 55 };  // Q1: Top Right (+,+) -> Green (#ABD037)
  const c2 = { r: 253, g: 185, b: 23 };  // Q2: Top Left (-,+) -> Yellow (#FDB917)
  const c3 = { r: 181, g: 9,   b: 0 };   // Q3: Bottom Left (-,-) -> Red (#B50900)
  const c4 = { r: 151, g: 65,  b: 152 }; // Q4: Bottom Right (+,-) -> Purple (#974198)

  // Max distance diagonally across the full box is 2.828.
  const MAX_DIST = 2.828;

  // Calculate distance from each of the 4 absolute reference corners
  const d1 = Math.max(0, 1 - Math.sqrt(Math.pow(1 - nx, 2)  + Math.pow(1 - ny, 2))  / MAX_DIST);
  const d2 = Math.max(0, 1 - Math.sqrt(Math.pow(-1 - nx, 2) + Math.pow(1 - ny, 2))  / MAX_DIST);
  const d3 = Math.max(0, 1 - Math.sqrt(Math.pow(-1 - nx, 2) + Math.pow(-1 - ny, 2)) / MAX_DIST);
  const d4 = Math.max(0, 1 - Math.sqrt(Math.pow(1 - nx, 2)  + Math.pow(-1 - ny, 2)) / MAX_DIST);

  // Exponent dictates how fast the blend falls off (higher -> stays "pure" closer to corners)
  const p = 3.0;
  const w1 = Math.pow(d1, p);
  const w2 = Math.pow(d2, p);
  const w3 = Math.pow(d3, p);
  const w4 = Math.pow(d4, p);

  const sum = w1 + w2 + w3 + w4 || 1;
  const r = (c1.r * w1 + c2.r * w2 + c3.r * w3 + c4.r * w4) / sum;
  const g = (c1.g * w1 + c2.g * w2 + c3.g * w3 + c4.g * w4) / sum;
  const b = (c1.b * w1 + c2.b * w2 + c3.b * w3 + c4.b * w4) / sum;

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
