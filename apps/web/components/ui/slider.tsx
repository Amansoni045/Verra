import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  valueSuffix?: string;
  infoTooltip?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, value, min, max, step = 1, onChange, valueSuffix = "", infoTooltip, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    };

    // Calculate percentage for filled track styling
    const percent = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn("space-y-2 select-none", className)}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
            {label}
            {infoTooltip && (
              <span className="group relative cursor-help text-zinc-500 hover:text-zinc-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-zinc-300 text-[10px] p-2 rounded border border-zinc-800 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 leading-normal">
                  {infoTooltip}
                </span>
              </span>
            )}
          </span>
          <span className="text-primary font-semibold font-mono">
            {value}
            {valueSuffix}
          </span>
        </div>
        
        <div className="relative flex items-center h-5">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${percent}%, rgba(255, 255, 255, 0.08) ${percent}%)`
            }}
            className={cn(
              "w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              // Range Track
              "[&::-webkit-slider-runnable-track]:bg-transparent",
              // Webkit Thumb
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150",
              "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95",
              // Firefox Thumb
              "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150",
              "[&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95",
              "[&::-moz-range-track]:bg-transparent"
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
