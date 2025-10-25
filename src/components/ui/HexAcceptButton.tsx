import React, { ButtonHTMLAttributes } from "react";

interface HexAcceptButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

// POINTY-TOP hexagon with EXACTLY 165° interior angles at top/bottom vertices
// Button: W=560, H=140, s=8%, theta=165°, y1=30.96px → y1%=22.114%
const HEX_PATH = "polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)";

const HexAcceptButton: React.FC<HexAcceptButtonProps> = ({
  children = "ELFOGADOM",
  className = "",
  style,
  ...props
}) => {
  return (
    <button
      className={`relative grid place-items-center select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        width: "100%",
        height: "clamp(56px, 14vh, 80px)",
        boxSizing: "border-box",
        outline: "none",
        border: 0,
        animation: "casino-pulse 3s ease-in-out infinite",
        ...style,
      }}
      {...props}
    >
      {/* BASE SHADOW (3D depth) */}
      <div
        className="absolute"
        style={{
          top: "6px",
          left: "6px",
          right: "-6px",
          bottom: "-6px",
          clipPath: HEX_PATH,
          background: "rgba(0,0,0,0.35)",
          filter: "blur(4px)",
        }}
        aria-hidden
      />

      {/* OUTER GOLD FRAME (dark diagonal gradient) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: HEX_PATH,
          background:
            "linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))",
          boxShadow:
            "inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 8px 20px rgba(0,0,0,0.35)",
        }}
        aria-hidden
      />

      {/* MIDDLE GOLD FRAME (bright inner highlight) */}
      <div
        className="absolute inset-[3px]"
        style={{
          clipPath: HEX_PATH,
          background:
            "linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))",
          boxShadow: "inset 0 1px 0 hsl(var(--dup-gold-300))",
        }}
        aria-hidden
      />

      {/* INNER EMERALD CRYSTAL (radial + vertical, élénk zafír) */}
      <div
        className="absolute"
        style={{
          top: "6px",
          left: "6px", 
          right: "6px",
          bottom: "6px",
          clipPath: HEX_PATH,
          background:
            "radial-gradient(ellipse 100% 80% at 50% -10%, hsl(155 90% 82%) 0%, hsl(155 85% 68%) 30%, hsl(155 78% 58%) 60%, hsl(155 70% 45%) 100%)",
          boxShadow:
            "inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)",
        }}
        aria-hidden
      />

      {/* SPECULAR HIGHLIGHT (top-left conic) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6px",
          left: "6px",
          right: "6px", 
          bottom: "6px",
          clipPath: HEX_PATH,
          background:
            "radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 30%, transparent 60%)",
        }}
        aria-hidden
      />

      {/* DIAGONAL LIGHT STREAKS */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6px",
          left: "6px",
          right: "6px",
          bottom: "6px",
          clipPath: HEX_PATH,
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)",
          opacity: 0.7,
        }}
        aria-hidden
      />

      {/* INNER GLOW (bottom shadow for 3D depth) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6px",
          left: "6px",
          right: "6px",
          bottom: "6px",
          clipPath: HEX_PATH,
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.3)",
          filter: "blur(3px)",
        }}
        aria-hidden
      />

      {/* GOLD INNER ACCENT STROKE */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6px",
          left: "6px",
          right: "6px",
          bottom: "6px",
          clipPath: HEX_PATH,
          boxShadow:
            "inset 0 0 0 1.5px hsla(var(--dup-gold-400) / 0.8)",
        }}
        aria-hidden
      />

      {/* 45° SHINE (animated, clipped to hex) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6px",
          left: "6px",
          right: "6px",
          bottom: "6px",
          clipPath: HEX_PATH,
          overflow: "hidden",
        }}
        aria-hidden
      >
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background:
              "linear-gradient(45deg, transparent 46%, rgba(255,215,0,0.65) 50%, transparent 54%)",
            animation: "slot-shine 3s linear infinite",
          }}
        />
      </div>

      {/* LABEL */}
      <span
        className="relative z-[1] font-black text-white tracking-[0.08em]"
        style={{
          fontSize: "clamp(1.05rem, 4.6vw, 1.45rem)",
          textShadow:
            "0 2px 8px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)",
        }}
      >
        {typeof children === "string" ? children.toUpperCase() : children}
      </span>
    </button>
  );
};

export default HexAcceptButton;
