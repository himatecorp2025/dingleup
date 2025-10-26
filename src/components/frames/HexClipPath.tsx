/**
 * Reusable hexagon clip-path component
 * Uses exact hexagon geometry from ExactHexPath
 */

interface HexClipPathProps {
  clipPathId: string;
}

export const HexClipPath = ({ clipPathId }: HexClipPathProps) => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
          <path 
            shapeRendering="geometricPrecision"
            d="M 0.00000,0.50000 L 0.15287,0.04128 A 0.04667,0.13333 0 0 1 0.18667,0.00000 L 0.81333,0.00000 A 0.04667,0.13333 0 0 1 0.84713,0.04128 L 1.00000,0.50000 L 0.84713,0.95872 A 0.04667,0.13333 0 0 1 0.81333,1.00000 L 0.18667,1.00000 A 0.04667,0.13333 0 0 1 0.15287,0.95872 L 0.00000,0.50000 Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
