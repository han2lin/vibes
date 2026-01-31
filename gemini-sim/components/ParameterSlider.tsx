
import React from 'react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  description?: string;
  toFixed?: number;
  secondaryValue?: number;
  secondaryUnit?: string;
  secondaryToFixed?: number;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  description,
  toFixed = 2,
  secondaryValue,
  secondaryUnit,
  secondaryToFixed = 1
}) => {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:border-amber-400 hover:shadow-md">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-mono font-bold text-amber-600">
            {value.toFixed(toFixed)}{unit}
          </span>
          {secondaryValue !== undefined && secondaryUnit && (
            <span className="text-[10px] font-mono font-bold text-slate-400 italic">
              ({secondaryValue.toFixed(secondaryToFixed)}{secondaryUnit})
            </span>
          )}
        </div>
      </div>
      <div className="relative flex items-center h-6">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600 transition-all border border-slate-200"
        />
      </div>
      {description && <p className="text-[11px] text-slate-400 font-medium leading-tight mt-1">{description}</p>}
    </div>
  );
};

export default ParameterSlider;
