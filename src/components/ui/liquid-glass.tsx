"use client";

import React from "react";
import { Link } from "react-router-dom";

// Types
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  onClick?: () => void;
  asButton?: boolean;
  overlayColor?: string;
}

export interface DockIcon {
  src?: string;
  icon?: React.ReactNode;
  alt: string;
  onClick?: () => void;
}

export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
  onClick,
  asButton = false,
  overlayColor = "rgba(255, 255, 255, 0.4)",
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.05), 0 0 20px rgba(0, 0, 0, 0.02)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex overflow-hidden cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
      onClick={onClick}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit"
        style={{
          backdropFilter: "blur(4px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit pointer-events-none"
        style={{ background: overlayColor }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.6), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.4)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 w-full">{children}</div>
    </div>
  );

  if (asButton) {
    return <button onClick={onClick} className="block w-full">{content}</button>;
  }

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block w-full" onClick={onClick}>
      {content}
    </a>
  ) : (
    content
  );
};

// Dock Component
export const GlassDock: React.FC<{ icons: DockIcon[]; href?: string; className?: string }> = ({
  icons,
  href,
  className = ""
}) => (
  <GlassEffect
    href={href}
    className={`rounded-3xl p-3 hover:p-4 hover:rounded-4xl shadow-xl shadow-black/5 bg-white/40 ${className}`}
    overlayColor="rgba(255, 255, 255, 0.4)"
  >
    <div className="flex items-center justify-center gap-4 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {icons.map((icon, index) => (
        <div
          key={index}
          className="w-14 h-14 transition-all duration-700 hover:scale-110 cursor-pointer flex items-center justify-center text-primary bg-white/50 backdrop-blur-md rounded-2xl shadow-sm"
          style={{
            transformOrigin: "center center",
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          }}
          onClick={icon.onClick}
        >
          {icon.icon ? (
            icon.icon
          ) : icon.src ? (
            <img src={icon.src} alt={icon.alt} className="w-full h-full object-cover rounded-2xl" />
          ) : null}
        </div>
      ))}
    </div>
  </GlassEffect>
);

// Button Component
export const GlassButton: React.FC<{ children: React.ReactNode; href?: string; onClick?: () => void; className?: string }> = ({
  children,
  href,
  onClick,
  className = ""
}) => (
  <GlassEffect
    href={href}
    onClick={onClick}
    asButton={!!onClick && !href}
    overlayColor="rgba(255, 255, 255, 0.15)"
    className={`rounded-3xl px-10 py-5 hover:px-11 hover:py-6 hover:rounded-4xl overflow-hidden bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/30 transition-all duration-500 opacity-100 ${className}`}
  >
    <div
      className="transition-all duration-700 hover:scale-95 flex items-center justify-center"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

// SVG Filter Component
export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.002 0.002"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="3"
        specularConstant="0.8"
        specularExponent="80"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="20"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);
