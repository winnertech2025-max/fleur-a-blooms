import { useMemo } from "react";

export const PetalBackground = () => {
  const petals = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: 8 + Math.random() * 10,
      height: 8 + Math.random() * 10,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 12,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {petals.map((p) => (
        <div
          key={p.id}
          className="falling-petal"
          style={{
            left: p.left,
            width: `${p.width}px`,
            height: `${p.height}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
