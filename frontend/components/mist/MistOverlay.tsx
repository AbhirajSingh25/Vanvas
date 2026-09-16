import React from "react";

export const MistOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Soft Fog Cloud 1 */}
      <div 
        className="absolute -top-20 -left-20 w-[120%] h-[70%] opacity-40 mix-blend-screen filter blur-3xl animate-mist"
        style={{
          background: "radial-gradient(ellipse at center, rgba(220, 227, 221, 0.45) 0%, rgba(243, 238, 227, 0) 70%)"
        }}
      />
      {/* Soft Fog Cloud 2 */}
      <div 
        className="absolute bottom-0 right-0 w-[80%] h-[50%] opacity-30 mix-blend-screen filter blur-2xl animate-mist"
        style={{
          animationDelay: "-11s",
          background: "radial-gradient(ellipse at center, rgba(200, 215, 205, 0.4) 0%, rgba(243, 238, 227, 0) 75%)"
        }}
      />
    </div>
  );
};
