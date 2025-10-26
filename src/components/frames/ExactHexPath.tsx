/**
 * Exact hexagon path geometry extracted from SVG
 * Sharp left/right tips, rounded top/bottom corners (r=56)
 * 
 * Original viewBox: -660 -270 1320 540
 * Path coordinates are normalized to objectBoundingBox (0-1)
 */

// Original absolute path from SVG (r=56 version)
export const EXACT_HEX_PATH_ABSOLUTE = `
  M -600.000 0.000
  L -416.552 -192.621
  A 56.000 56.000 0 0 1 -376.000 -210.000
  L 376.000 -210.000
  A 56.000 56.000 0 0 1 416.552 -192.621
  L 600.000 0.000
  L 416.552 192.621
  A 56.000 56.000 0 0 1 376.000 210.000
  L -376.000 210.000
  A 56.000 56.000 0 0 1 -416.552 192.621
  L -600.000 0.000
  Z
`.trim();

// Normalized to objectBoundingBox (0-1) for clipPath
// Formula: x' = (x + 600) / 1200, y' = (y + 210) / 420
export const EXACT_HEX_PATH_NORMALIZED = `
  M 0.00000,0.50000
  L 0.15287,0.04128
  A 0.04667,0.13333 0 0 1 0.18667,0.00000
  L 0.81333,0.00000
  A 0.04667,0.13333 0 0 1 0.84713,0.04128
  L 1.00000,0.50000
  L 0.84713,0.95872
  A 0.04667,0.13333 0 0 1 0.81333,1.00000
  L 0.18667,1.00000
  A 0.04667,0.13333 0 0 1 0.15287,0.95872
  L 0.00000,0.50000
  Z
`.trim();

interface ExactHexPathProps {
  clipPathId?: string;
}

/**
 * Provides exact hexagon clipPath with pixel-perfect geometry
 * Sharp left/right tips, rounded diagonal corners
 */
export const ExactHexPath = ({ clipPathId = 'exactHexClip' }: ExactHexPathProps) => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
          <path 
            shapeRendering="geometricPrecision"
            d={EXACT_HEX_PATH_NORMALIZED}
          />
        </clipPath>
      </defs>
    </svg>
  );
};
