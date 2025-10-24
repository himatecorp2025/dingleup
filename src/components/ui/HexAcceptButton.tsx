import React, { ButtonHTMLAttributes } from "react";

interface HexAcceptButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

// POINTY-TOP hexagon clip-path with ~150° top/bottom interior angles
const HEX_PATH = "polygon(50% 11.25%, 86% 25%, 86% 75%, 50% 88.75%, 14% 75%, 14% 25%)";

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
        // Only the button should pulse, not parents
        animation: "casino-pulse 3s ease-in-out infinite",
        ...style,
      }}
      {...props}
    >
      {/* FRAME (gold) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: HEX_PATH,
          background:
            "linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-500)) 45%, hsl(var(--dup-gold-700)))",
          boxShadow:
            "inset 0 0 0 2px hsl(var(--dup-gold-800)), 0 8px 20px rgba(0,0,0,0.35)",
        }}
        aria-hidden
      />

      {/* INNER (emerald / zafír zöld) */}
      <div
        className="absolute inset-[6px]"
        style={{
          clipPath: HEX_PATH,
          background:
            "radial-gradient(100% 100% at 35% 20%, hsl(155 85% 78%), hsl(155 75% 52%) 55%, hsl(155 68% 38%))",
          boxShadow: "inset 0 10px 18px rgba(255,255,255,0.15), inset 0 -10px 20px rgba(0,0,0,0.35)",
        }}
        aria-hidden
      />

      {/* 45° SHINE (clipped exactly to hex) */}
      <div
        className="absolute inset-[6px] pointer-events-none"
        style={{
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
          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
        }}
      >
        {typeof children === "string" ? children.toUpperCase() : children}
      </span>
    </button>
  );
};

export default HexAcceptButton;
