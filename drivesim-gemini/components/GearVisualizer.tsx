
import React, { useEffect, useState, useRef } from 'react';

interface GearVisualizerProps {
  gearing: number;
  wheelRadius: number;
  maxAccel: number;
  limitingFactor: string;
}

const GearVisualizer: React.FC<GearVisualizerProps> = ({ gearing, wheelRadius, maxAccel, limitingFactor }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants for layout
  const motorX = 80;
  const centerY = 100;
  const motorRadius = 15;
  const drivenGearRadius = Math.min(55, motorRadius * Math.sqrt(gearing));
  const drivenGearX = motorX + motorRadius + drivenGearRadius - 2;
  const wheelVisualRadius = wheelRadius * 800;

  // The visual "time to launch" (seconds to reach visual full speed)
  const launchDuration = maxAccel > 0 ? Math.min(4, 5 / maxAccel) : 0;
  
  useEffect(() => {
    setIsLaunching(false);
    const timer = setTimeout(() => setIsLaunching(true), 50);
    return () => clearTimeout(timer);
  }, [gearing, wheelRadius, maxAccel]);

  const renderTeeth = (r: number, count: number, color: string) => {
    const teeth = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360;
      teeth.push(
        <rect
          key={i}
          x={-1.5}
          y={-r - 4}
          width={3}
          height={6}
          fill={color}
          transform={`rotate(${angle})`}
        />
      );
    }
    return teeth;
  };

  const motorTargetDuration = 0.6; 
  const wheelTargetDuration = motorTargetDuration * gearing;

  const animationStyle = (baseDuration: number, reverse: boolean = false) => {
    if (maxAccel <= 0) return { animation: 'none' };
    
    return {
      animationName: reverse ? 'spin-gear-reverse' : 'spin-gear',
      animationDuration: `${baseDuration}s`,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      transition: isLaunching ? `all ${launchDuration}s cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
      opacity: 1,
    };
  };

  return (
    <div ref={containerRef} className="relative w-full h-100 bg-white border border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden shadow-sm">
      <style>
        {`
          @keyframes spin-gear {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-gear-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes friction-spark {
            0% { opacity: 0; transform: translateX(0) scaleX(0.5); }
            20% { opacity: 1; transform: translateX(-5px) scaleX(1.2); }
            100% { opacity: 0; transform: translateX(-20px) scaleX(0.8); }
          }
        `}
      </style>
      
      <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
        {/* Ground Line */}
        <line 
          x1="0" y1={centerY + wheelVisualRadius} 
          x2="400" y2={centerY + wheelVisualRadius} 
          stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" 
        />
        
        {/* MOTOR GEAR */}
        <g transform={`translate(${motorX}, ${centerY})`}>
          <text x={-motorRadius - 10} y={-motorRadius - 10} textAnchor="middle" className="text-[8px] fill-slate-400 font-black uppercase tracking-widest">NEO Motor</text>
          <g style={animationStyle(motorTargetDuration)} className={isLaunching ? "text-amber-500" : "text-slate-300"}>
            <circle r={motorRadius} fill="none" stroke="currentColor" strokeWidth="3" />
            <circle r={motorRadius - 6} fill="currentColor" opacity="0.3" />
            {renderTeeth(motorRadius, 8, 'currentColor')}
            <circle cx={motorRadius - 5} cy="0" r="2" fill="white" />
          </g>
        </g>

        {/* AXLE */}
        <line 
          x1={drivenGearX} y1={centerY} 
          x2={300} y2={centerY} 
          stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" 
        />

        {/* DRIVEN GEAR */}
        <g transform={`translate(${drivenGearX}, ${centerY})`}>
          <text y={-drivenGearRadius - 10} textAnchor="middle" className="text-[8px] fill-amber-700 font-black uppercase tracking-widest">Gearing</text>
          <g style={animationStyle(wheelTargetDuration, true)} className={isLaunching ? "text-amber-600" : "text-slate-300"}>
            <circle r={drivenGearRadius} fill="none" stroke="currentColor" strokeWidth="3" />
            <circle r={drivenGearRadius - 10} fill="#fef3c7" opacity="0.8" />
            {renderTeeth(drivenGearRadius, Math.max(12, Math.floor(10 * Math.sqrt(gearing))), 'currentColor')}
            <circle cx={drivenGearRadius - 8} cy="0" r="3" fill="#b45309" />
            <path d={`M -${drivenGearRadius} 0 L ${drivenGearRadius} 0 M 0 -${drivenGearRadius} L 0 ${drivenGearRadius}`} stroke="currentColor" strokeWidth="1" opacity="0.2" />
          </g>
        </g>

        {/* WHEEL & TRACTION EFFECTS */}
        <g transform={`translate(300, ${centerY})`}>
          <text y={-wheelVisualRadius - 20} textAnchor="middle" className="text-[8px] fill-slate-800 font-black uppercase tracking-widest">Wheel</text>
          
          {/* Static Tire / Sparks g */}
          <g>
             {/* Dynamic Sparks Originating from contact patch */}
             {limitingFactor === 'Traction' && isLaunching && (
              <g transform={`translate(${-wheelVisualRadius + 5}, ${wheelVisualRadius})`}>
                <line x1="0" y1="0" x2="-15" y2="2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ animation: 'friction-spark 0.3s infinite linear' }} />
                <line x1="2" y1="4" x2="-10" y2="6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" style={{ animation: 'friction-spark 0.4s infinite linear 0.1s' }} />
                <line x1="-2" y1="-2" x2="-12" y2="-1" stroke="#d97706" strokeWidth="2" strokeLinecap="round" style={{ animation: 'friction-spark 0.25s infinite linear 0.05s' }} />
              </g>
            )}

            {/* Rotating Parts */}
            <g style={animationStyle(wheelTargetDuration, true)}>
              {/* Tire */}
              <circle r={wheelVisualRadius} fill="none" stroke="#334155" strokeWidth="18" />
              <circle r={wheelVisualRadius - 9} fill="none" stroke="#475569" strokeWidth="2" />
              
              {/* Spokes */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <line 
                  key={angle}
                  x1="0" y1="0" 
                  x2={wheelVisualRadius - 10} y2="0" 
                  stroke="#f59e0b" strokeWidth="4" 
                  opacity="1"
                  transform={`rotate(${angle})`}
                />
              ))}
              
              {/* Hub */}
              <circle r="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            </g>
          </g>
        </g>
      </svg>
      
      {/* HUD overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
         <div className={`text-[11px] font-black font-mono px-4 py-2 rounded-xl border shadow-sm tracking-widest ${
            maxAccel > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {maxAccel > 0 ? 'STATUS: NOMINAL' : 'STATUS: STALLED'}
          </div>
          
          {maxAccel > 0 && (
            <div className={`text-[11px] font-black font-mono px-4 py-2 rounded-xl border shadow-sm tracking-widest animate-pulse ${
              limitingFactor === 'Traction' ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              {limitingFactor.toUpperCase()} LIMITED
            </div>
          )}
      </div>

      <div className="absolute bottom-6 right-6 text-[11px] font-mono bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 text-slate-500 space-y-2 shadow-lg">
        <div className="flex justify-between gap-10">
          <span className="font-bold">TOTAL RATIO</span>
          <span className="text-amber-600 font-black">{gearing.toFixed(2)}:1</span>
        </div>
        <div className="flex justify-between gap-10">
          <span className="font-bold">VELOCITY CAP</span>
          <span className="text-amber-600 font-black">{(1/gearing).toFixed(2)}x</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-8">
        <div className="text-[13px] font-mono text-slate-300 uppercase tracking-[0.5em] font-black italic">
          8048 SIMULATION
        </div>
      </div>
    </div>
  );
};

export default GearVisualizer;
