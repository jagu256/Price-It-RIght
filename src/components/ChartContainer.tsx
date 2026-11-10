import type { ComponentProps } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useSectionVisible } from '../app/visibility';

/** Recharts' ResponsiveContainer, drawn only while its section is on screen. */
export default function ChartContainer(props: ComponentProps<typeof ResponsiveContainer>) {
  return useSectionVisible() ? <ResponsiveContainer {...props} /> : null;
}
