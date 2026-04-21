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
  const speed = 1.0 + (blueFactor * 1.5) + (redFactor * 0.5);
  const time = t * speed;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    let r = rBase;

    // 1) Base breathing: slow, gentle
    r += Math.sin(time * 1.5 + angle * 3) * 3;

    // 2) Smooth Wavy (nx > 0)
    if (smoothFactor > 0.01) {
      r += Math.sin(angle * 4 - time * 2) * (5 * smoothFactor);
      r += Math.sin(angle * 3 + time * 1.5) * (3 * smoothFactor);
    }

    // 3) Excited Blue Waves (+x, -y)
    if (blueFactor > 0.01) {
      r += Math.cos(angle * 8 + time * 6) * (8 * blueFactor);
    }

    // 4) Spiky Edge (-x)
    if (spikyEdge > 0.01) {
      const spikeFreq = 16 + layer * 4; 
      r += Math.sin(angle * spikeFreq + time * 4) * (7 * spikyEdge);
      r += Math.cos(angle * (spikeFreq * 1.5) - time * 3.5) * (5 * spikyEdge);
    }

    // 5) Internal Spikes (-x, -y) ONLY active heavily on inner layers
    if (layer > 0 && redFactor > 0.01) {
      const innerSpikeFreq = 24 + layer * 8;
      // Multiplying by layer makes innermost layer the spikiest!
      r += Math.sin(angle * innerSpikeFreq + time * 8) * (18 * redFactor * layer);
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

// Bilinear interpolation between the 4 Quadrants
function interpolateColor(nx: number, ny: number): string {
  // Q1: Top Right (+,+) -> Green
  const c1 = { r: 132, g: 204, b: 22 }; 
  // Q2: Top Left (-,+) -> Orange
  const c2 = { r: 249, g: 115, b: 22 }; 
  // Q3: Bottom Left (-,-) -> Red
  const c3 = { r: 220, g: 38,  b: 38 }; 
  // Q4: Bottom Right (+,-) -> Blue
  const c4 = { r: 14,  g: 165, b: 233 }; 

  const tx = (nx + 1) / 2; // 0 (Left) to 1 (Right)
  const ty = (ny + 1) / 2; // 0 (Bottom) to 1 (Top)

  // Bottom row (-Y) interpolation
  const rBottom = c3.r * (1 - tx) + c4.r * tx;
  const gBottom = c3.g * (1 - tx) + c4.g * tx;
  const bBottom = c3.b * (1 - tx) + c4.b * tx;

  // Top row (+Y) interpolation
  const rTop = c2.r * (1 - tx) + c1.r * tx;
  const gTop = c2.g * (1 - tx) + c1.g * tx;
  const bTop = c2.b * (1 - tx) + c1.b * tx;

  // Y-axis blend
  const r = rBottom * (1 - ty) + rTop * ty;
  const g = gBottom * (1 - ty) + gTop * ty;
  const b = bBottom * (1 - ty) + bTop * ty;

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
