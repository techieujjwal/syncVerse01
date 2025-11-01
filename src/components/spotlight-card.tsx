import React, { useEffect, useRef } from 'react';

export const GlowCard = ({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  const glowColorMap = {
    blue: { base: 220, spread: 200 },
    purple: { base: 280, spread: 300 },
    green: { base: 120, spread: 200 },
    red: { base: 0, spread: 200 },
    orange: { base: 30, spread: 200 }
  };

  const sizeMap = {
    sm: 'w-48 h-64',
    md: 'w-64 h-80',
    lg: 'w-80 h-96'
  };

  useEffect(() => {
    const syncPointer = (e) => {
      const { clientX: x, clientY: y } = e;
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', x.toFixed(2));
        cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        cardRef.current.style.setProperty('--y', y.toFixed(2));
        cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };
    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) return '';
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '3',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      position: 'relative',
      overflow: 'hidden', // ✅ Keeps glow inside the box
      border: '2px solid transparent',
      borderRadius: '14px',
      background: 'var(--backdrop, transparent)',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) 100% 70% / 0.15), transparent
      )`,
      backgroundSize: 'cover',
      touchAction: 'none'
    };

    if (width) baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) baseStyles.height = typeof height === 'number' ? `${height}px` : height;

    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      content: "";
      position: absolute;
      inset: 0; /* ✅ Stay within box, not outside */
      border-radius: 14px;
      pointer-events: none;
    }

    [data-glow]::before {
      border: 2px solid transparent;
      background: radial-gradient(
        circle at var(--x, 0px) var(--y, 0px),
        hsl(var(--hue, 210) 100% 60% / 0.4),
        transparent 60%
      );
      mask: linear-gradient(white, white) content-box, linear-gradient(white, white);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      filter: brightness(1.5);
    }

    [data-glow]::after {
      border: 1px solid hsl(var(--hue, 210) 100% 70% / 0.7);
      box-shadow: inset 0 0 10px hsl(var(--hue, 210) 100% 70% / 0.5);
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl relative grid grid-rows-[1fr_auto]
          shadow-[0_1rem_2rem_-1rem_black] p-4 gap-4
          backdrop-blur-[5px]
          ${className}
        `}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  );
};
