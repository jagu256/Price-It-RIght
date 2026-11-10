import { sliderStep } from '../lib/chartData';
import { formatCAD } from '../lib/format';

interface Props {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  colour?: string;
}

/** A styled range slider for choosing a price between $0 and `max`. */
export default function PriceSlider({ id, label, value, max, onChange, colour = '#4F7150' }: Props) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div className="mt-3">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="slider"
        min={0}
        max={max}
        step={sliderStep(max)}
        value={clamped}
        aria-valuetext={formatCAD(clamped)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%`, ['--fill' as string]: colour }}
      />
      <div className="mt-1 flex justify-between text-xs font-semibold text-sage-500" aria-hidden="true">
        <span>{formatCAD(0)}</span>
        <span>{formatCAD(max)}</span>
      </div>
    </div>
  );
}
