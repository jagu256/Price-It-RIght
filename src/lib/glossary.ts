/**
 * 📖 One-line definitions shown by the ⓘ buttons next to accounting terms.
 * Plain language, consistent with the "Understand Your Numbers" section on Home.
 */
import { tx } from '../i18n/i18n';

export const GLOSSARY = {
  revenue: { term: tx('Revenue'), definition: tx('All the money that comes in from customers before any costs are taken out: selling price × units sold.') },
  variableCosts: { term: tx('Variable costs'), definition: tx('Costs that rise and fall with each unit sold, like ingredients, packaging and payment fees.') },
  fixedCosts: { term: tx('Fixed costs'), definition: tx('Costs that stay the same each month within the relevant range, like rent or insurance. They are subtracted once for the whole business.') },
  contributionMargin: { term: tx('Contribution margin'), definition: tx('Selling price − variable cost. What each sale has left to cover fixed costs; it is not profit until fixed costs are covered.') },
  cmRatio: { term: tx('Contribution margin ratio'), definition: tx('Contribution margin ÷ revenue: how many cents of each sales dollar are left after variable costs.') },
  operatingProfit: { term: tx('Operating profit'), definition: tx('Total contribution margin − fixed costs. It is not net income: taxes, interest and other items are not included.') },
  breakEven: { term: tx('Break-even point'), definition: tx('The sales level where revenue equals total costs, so operating profit is $0. Units are rounded up.') },
  salesMix: { term: tx('Sales mix'), definition: tx('The share of each product in total units sold. Multi-product break-even assumes this mix stays the same.') },
  marginOfSafety: { term: tx('Margin of safety'), definition: tx('Expected revenue − break-even revenue: how far sales could fall before the business makes a loss.') },
  sensitivity: { term: tx('Sensitivity analysis'), definition: tx('Changing one input at a time (here by ±10 %) to see which one moves profit the most.') },
  operatingLeverage: { term: tx('Degree of operating leverage'), definition: tx('Total contribution margin ÷ operating profit. A DOL of 2.5 means a 10 % change in sales changes profit by about 25 %.') },
  relevantRange: { term: tx('Relevant range'), definition: tx('The range of activity in which fixed costs stay fixed. Outside it (e.g. needing more staff) they step up.') },
  variance: { term: tx('Variance'), definition: tx('The difference between an actual result and the budget. Favourable (F) raises profit; unfavourable (U) lowers it.') },
  flexibleBudget: { term: tx('Flexible budget'), definition: tx('The budget recalculated at the actual number of units sold, using budget prices and costs.') },
  markup: { term: tx('Markup'), definition: tx('Profit as a percentage of cost. A $2 cost with a 50 % markup sells for $3.') },
  margin: { term: tx('Margin'), definition: tx('Profit as a percentage of the selling price. A $3 price with a $2 cost has a 33.3 % margin.') },
  relevantCost: { term: tx('Relevant cost'), definition: tx('A future cost that differs between the options. Costs you pay either way are irrelevant to the decision.') },
  opportunityCost: { term: tx('Opportunity cost'), definition: tx('The benefit you give up by choosing one option over the next best one.') },
  incrementalProfit: { term: tx('Incremental profit'), definition: tx('The extra profit a decision adds (or removes) compared with not doing it.') },
  scarceResource: { term: tx('CM per scarce resource'), definition: tx('Contribution margin per unit ÷ the amount of a scarce input it uses. When one input limits production, favour the product that earns most per unit of it.') },
  safetyStock: { term: tx('Safety stock'), definition: tx('Extra inventory kept above expected needs, in case sales are higher or deliveries are late.') },
  afterTax: { term: tx('After-tax profit'), definition: tx('Operating profit minus estimated income tax. Required pre-tax profit = after-tax target ÷ (1 − tax rate).') },
} as const;

export type TermId = keyof typeof GLOSSARY;
