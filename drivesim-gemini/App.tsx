
import React, { useState, useMemo } from 'react';
import { SimulationParams, SimulationResult } from './types';
import { calculateMaxAccel } from './physics';
import ParameterSlider from './components/ParameterSlider';
import GearVisualizer from './components/GearVisualizer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INITIAL_PARAMS: SimulationParams = {
  wheelRadius: 0.0381, // 1.5 inch radius approx
  driveGearing: 5.143,
  maxDriveSpeed: 4.5,
  currentLimit: 40,
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(INITIAL_PARAMS);

  const result = useMemo(() => calculateMaxAccel(params), [params]);

  const chartData = [
    { name: 'Acceleration', value: result.maxAccel },
  ];

  const updateParam = (key: keyof SimulationParams, val: number) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-10 bg-slate-50 min-h-screen font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-amber-500 flex items-center justify-center rounded-2xl font-black text-white text-1xl italic shadow-xl shadow-amber-500/20">
              8048
            </div>
            <div>
              <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter leading-none">
                CHURRO DRIVE <span className="text-amber-500">SIM</span>
              </h1>
              <p className="text-slate-400 font-mono text-sm uppercase tracking-[0.4em] mt-2 font-bold">
                DRIVETRAIN KINETICS SIMULATOR
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls Column */}
        <div className="lg:col-span-4 space-y-10">
          <div className="flex items-center justify-between border-l-4 border-slate-900 pl-5 py-2">
            <h2 className="text-base font-black uppercase tracking-widest text-slate-900">
              Configuration
            </h2>
          </div>
          <div className="space-y-6">
            <ParameterSlider
              label="Wheel Radius"
              unit="m"
              min={0.02}
              max={0.15}
              step={0.001}
              value={params.wheelRadius}
              secondaryValue={params.wheelRadius * 39.3701}
              secondaryUnit="in"
              secondaryToFixed={1}
              onChange={(v) => updateParam('wheelRadius', v)}
              description="Larger wheels increase top speed but decrease torque leverage (acceleration)."
              toFixed={3}
            />
            <ParameterSlider
              label="Drive Gearing"
              unit=":1"
              min={1.0}
              max={25.0}
              step={0.05}
              value={params.driveGearing}
              onChange={(v) => updateParam('driveGearing', v)}
              description="Higher reduction multiplies motor torque for better acceleration, capping top speed."
              toFixed={3}
            />
            <ParameterSlider
              label="Current Limit"
              unit="A"
              min={10}
              max={120}
              step={5}
              value={params.currentLimit}
              onChange={(v) => updateParam('currentLimit', v)}
              description="Caps total electrical power. Low limits act as a bottleneck for peak force."
              toFixed={1}
            />
            <ParameterSlider
              label="Max Speed"
              unit="m/s"
              min={1.0}
              max={12.0}
              step={0.1}
              value={params.maxDriveSpeed}
              secondaryValue={params.maxDriveSpeed * 3.28084}
              secondaryUnit="ft/s"
              secondaryToFixed={1}
              onChange={(v) => updateParam('maxDriveSpeed', v)}
              description="Robot max speed used to calculate potential back electromotive force efficiency losses."
              toFixed={1}
            />
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 p-12 rounded-[2.5rem] relative overflow-hidden group hover:shadow-xl hover:shadow-amber-500/5 transition-all">
              <div className="absolute -top-10 -right-10 p-4 opacity-5 text-amber-500 group-hover:opacity-10 transition-opacity">
                <svg className="w-56 h-56" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z"/></svg>
              </div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.4em] mb-4">Max Starting Acceleration</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-4">
                  <span className="text-8xl font-black text-slate-900 italic tracking-tighter">
                    {result.maxAccel.toFixed(2)}
                  </span>
                  <span className="text-2xl text-amber-500 font-black uppercase italic">m/s²</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-400 italic pl-1">
                  ({(result.maxAccel * 3.28084).toFixed(1)} ft/s²)
                </div>
              </div>
            </div>
            
            <div className={`p-12 rounded-[2.5rem] border-2 transition-all shadow-sm flex flex-col justify-center ${
              result.limitingFactor === 'Traction' ? 'bg-amber-50 border-amber-300' : 
              result.limitingFactor === 'Current Limit' ? 'bg-indigo-50 border-indigo-200' : 
              'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] mb-4">Current Bottleneck</p>
              <p className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">
                {result.limitingFactor}
              </p>
              <p className="text-xs text-slate-500 mt-6 font-medium leading-relaxed uppercase italic">
                {result.limitingFactor === 'Traction' ? 'Wheels are spinning. You have more torque than grip!' :
                 result.limitingFactor === 'Current Limit' ? 'Electronic caps are throttling motor performance.' :
                 'Motor torque is the primary limiting factor for this configuration.'}
              </p>
            </div>
          </div>

          {/* Visualization Frame */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-400 flex items-center gap-5 px-2">
              <span className="w-16 h-1 bg-slate-200 rounded-full"></span>
              Live Mechanical Telemetry
              <span className="flex-1 h-px bg-slate-200"></span>
            </h2>
            <GearVisualizer 
              gearing={params.driveGearing} 
              wheelRadius={params.wheelRadius} 
              maxAccel={result.maxAccel}
              limitingFactor={result.limitingFactor}
            />
          </div>

          {/* Insights & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 bg-white border border-slate-200 p-10 rounded-[2.5rem] h-80 flex flex-col shadow-sm">
              <h3 className="text-xs font-black text-slate-400 mb-10 uppercase tracking-[0.4em] flex items-center justify-between border-b border-slate-50 pb-4">
                Scale View
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40"></span>
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis 
                      domain={[0, 16]} 
                      stroke="#94a3b8" 
                      fontSize={13} 
                      width={40}
                      tick={{ fill: '#64748b', fontWeight: '900' }}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(245, 158, 11, 0.05)'}}
                      contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#d97706', fontWeight: '900', fontSize: '15px', textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={90}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={result.maxAccel > 0 ? "#f59e0b" : "#e2e8f0"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 p-12 rounded-[2.5rem] flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21H23L12 2M12 6L19.53 19H4.47L12 6M11 10V14H13V10H11M11 16V18H13V16H11Z"/></svg>
              </div>
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-4 tracking-[0.5em] border-b border-slate-100 pb-5">
                 Fundamentals
                </h3>
                <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
                  <p>
                    <span className="text-slate-900 font-black">Trade-Offs:</span> Gearing behaves like a lever. A <span className="text-amber-600 font-bold italic">High Gearing</span> (large reduction) makes it easier for the motor to turn the wheel, increasing acceleration but lowering the maximum possible speed.
                  </p>
                  <p>
                    <span className="text-slate-900 font-black">Wheel Interaction:</span> Larger wheels cover more ground per rotation (higher speed) but require more torque to "push" the robot forward, making them harder for a motor to accelerate.
                  </p>
                  <p>
                    <span className="text-slate-900 font-black">Electronic Limits:</span> Even with perfect gearing, your <span className="text-amber-600 font-bold italic">Current Limit</span> acts as a ceiling on how much torque the motor can actually produce.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Footer */}
      <footer className="pt-20 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-300 text-xs font-black uppercase tracking-[0.6em] pb-16">
        <p>COEFFICIENT OF FRICTION μ=1.20 • NEO VORTEX MODEL</p>
      </footer>
    </div>
  );
};

export default App;
