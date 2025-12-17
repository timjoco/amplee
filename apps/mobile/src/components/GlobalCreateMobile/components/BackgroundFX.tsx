import { useMemo } from 'react';
import type { Orb } from '../types';

export default function BackgroundFX() {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  const orbs = useMemo<Orb[]>(() => {
    const colors = [
      'rgba(147, 51, 234, 0.25)',
      'rgba(124, 58, 237, 0.3)',
      'rgba(168, 85, 247, 0.25)',
      'rgba(192, 132, 252, 0.2)',
    ];

    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: Math.random() * 150 + 80,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -15,
      opacity: Math.random() * 0.4 + 0.2,
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <>
      {/* Orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="gc-orb"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            opacity: orb.opacity,
            animation: `gcFloat ${orb.duration}s infinite ease-in-out ${orb.delay}s`,
          }}
        />
      ))}

      {/* Stars */}
      <div className="gc-stars-container">
        {stars.map((star) => (
          <div
            key={star.id}
            className="gc-star"
            style={{
              width: star.size,
              height: star.size,
              left: `${star.x}%`,
              top: `${star.y}%`,
              opacity: star.opacity,
              animation: `gcTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
