/**
 * 🧭 Guided first-visit tour: the steps, and whether it has been seen.
 * "Seen" is remembered in this browser (wrapped in try/catch: if storage is
 * blocked the tour simply shows again next time – the app still works).
 */
import type { SectionId } from '../app/routes';
import { tx } from '../i18n/i18n';

export const TOUR_KEY = 'price-it-right:tour-done';

export interface TourStep {
  section: SectionId;
  title: string;
  text: string;
}

export const TOUR_STEPS: TourStep[] = [
  { section: 'home', title: tx('Welcome to Price It Right'), text: tx('This one-minute tour shows where everything is. You can skip it at any time and restart it from Home.') },
  { section: 'my-business', title: tx('1. Start with your business'), text: tx('Choose a business type, enter your monthly fixed costs once, then your products with their price, variable cost and expected sales.') },
  { section: 'dashboard', title: tx('2. See your profit'), text: tx('Revenue, contribution margin, operating profit and break-even, with charts. Tap “Show the math” on any card to see the formula with your numbers.') },
  { section: 'pricing', title: tx('3. Experiment safely'), text: tx('Try new prices, costs or sales in the What-If simulator. Nothing changes your business until you click Apply.') },
  { section: 'inventory', title: tx('4. Add your inventory'), text: tx('Upload stock from Excel or CSV, link each product to its recipe, and see shortages and what to buy.') },
  { section: 'planner', title: tx('5. Plan production'), text: tx('Find which products use your scarce stock best, and compare production plans.') },
  { section: 'decisions', title: tx('6. Make decisions'), text: tx('Special orders and make-or-buy, using only the costs that change.') },
  { section: 'report', title: tx('7. Share your results'), text: tx('Download a PDF or Excel report. Practise in Business Challenge, and switch between English and French at the top at any time.') },
];

/** True when this browser has already finished or skipped the tour. */
export function tourDone(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): boolean {
  try {
    return storage?.getItem(TOUR_KEY) === 'yes';
  } catch {
    return false;
  }
}

/** Remembers that the tour was finished or skipped. Never throws. */
export function markTourDone(storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(TOUR_KEY, 'yes');
  } catch {
    /* storage blocked – the tour will just show again next time */
  }
}
