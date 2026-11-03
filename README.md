# Price It Right – Small Business Pricing Simulator

**Set your price. Know your costs. Maximize your profit.**

Price It Right is an interactive web app that shows how **selling price, variable costs, fixed costs and sales volume** work together to create (or erase) operating profit. Users pick a business type, enter their numbers, and immediately see revenue, operating profit, break-even units, contribution margin, contribution margin ratio and margin of safety. They can also test a different price in a what-if simulator and see the results on two charts.

Built for an **ACCT 4500** group project.

---

## Problem being solved

Many small-business owners and student entrepreneurs set prices by gut feel or by copying competitors, without knowing:

- how much each sale actually contributes toward fixed costs,
- how many units they must sell each month just to break even, or
- how much room they have before a slow month becomes a loss.

These ideas come from managerial accounting (cost-volume-profit, or CVP, analysis), but the formulas are hard to apply without a spreadsheet. Price It Right puts CVP analysis into a friendly tool that needs no accounting background.

## Target users

- Small-business owners and side-hustlers (cafés, bakeries, salons, retail, services)
- Student entrepreneurs testing a business idea
- Accounting and business students learning CVP analysis

## Core features

| Feature | What it does |
|---|---|
| Welcome section | App name, tagline, short description, **Start Pricing** button, 3-step guide. No account needed. |
| Choose your business | ☕ Coffee Shop, 🧁 Bakery, 💅 Nail Salon, 👕 Clothing Store, ✨ Custom Business. Each fills in **fictional example values** that can all be edited. |
| Input panel | Business name, selling price, variable cost, fixed costs, monthly units. Each field has a plain-language explanation. All amounts in CAD. Includes a price slider. |
| Results dashboard | Six cards (Revenue, Operating Profit/Loss, Break-Even Units, CM per Unit, CM Ratio, Margin of Safety), a plain-language summary, and a contribution-margin income statement. Green = profit, raspberry = loss. |
| What-If simulator | Try a new price with a slider or text box. Shows the original and new scenarios side by side, plus the change in profit. Does **not** change the original numbers unless you click **Apply new price**. Includes **Reset Scenario**. |
| Charts | (1) Revenue vs. Total Costs line chart with the break-even point marked when one exists. (2) Profit at different sales volumes bar chart. Both use the same formulas as the dashboard. |
| Error handling | Friendly messages for blank, negative, non-numeric, fractional-unit and oversized inputs. Invalid input is never silently changed to zero, and results pause until it is fixed. |
| Understand Your Numbers | Plain-language explanations of seven key concepts. |
| 📦 Inventory & Sales Estimator | At the bottom of the page. Enter inventory items (add, edit, remove) to find how many products you can make, which item limits production, estimated sales, revenue and profit, and how much more inventory you'd need to meet expected sales. See [below](#-inventory--sales-estimator). |

## Accounting formulas

All calculations are in [`src/lib/accounting.ts`](src/lib/accounting.ts). The dashboard, what-if simulator and charts all use this one function, so every part of the app shows the same numbers.

| Measure | Formula |
|---|---|
| Revenue | Selling Price × Units Sold |
| Total Variable Costs | Variable Cost per Unit × Units Sold |
| Contribution Margin per Unit | Selling Price − Variable Cost per Unit |
| Total Contribution Margin | Revenue − Total Variable Costs |
| Contribution Margin Ratio | CM per Unit ÷ Selling Price × 100 |
| Total Costs | Total Variable Costs + Fixed Costs |
| Operating Profit | Revenue − Total Variable Costs − Fixed Costs |
| Break-Even Units | Fixed Costs ÷ CM per Unit, **rounded up** to the next whole unit |
| Break-Even Revenue (theoretical) | Break-Even Units (unrounded) × Selling Price |
| Margin of Safety ($) | Projected Revenue − Theoretical Break-Even Revenue |
| Margin of Safety (%) | Margin of Safety ($) ÷ Projected Revenue × 100 |

### How special cases are handled

| Situation | What the app shows |
|---|---|
| Selling price ≤ variable cost, fixed costs > 0 | "Not reachable": a finite break-even point cannot be achieved under the current assumptions. Margin of safety: N/A. |
| Fixed costs = 0, positive CM | Break-even at 0 units. Margin of safety = all revenue (100%). No division by zero. |
| Fixed costs = 0, CM ≤ 0 | Profit can never rise above $0. Break-even: not reachable. Margin of safety: N/A. |
| Zero sales | Revenue $0, loss equal to fixed costs. Margin of safety % is shown as "can't be calculated" rather than an undefined number. |
| Selling price = $0 | CM ratio shown as N/A (it would require dividing by zero). |
| Break-even is a fraction (e.g. 333.33 units) | Shows **334 units** (rounded up), plus the theoretical 333.33 units and both the theoretical break-even revenue and the revenue from 334 units. |

### Assumptions

- Selling price and variable cost per unit stay constant at every sales volume.
- Fixed costs stay constant within the relevant range.
- In the what-if simulator, **sales volume stays the same when the price changes.** In reality, raising a price may reduce the number of customers, so a higher price does not automatically mean higher real-world profit. The app states this on screen.
- The app does not recommend an "ideal" price. It only shows the results of the numbers the user enters.
- Example business values are **fictional** and are **not** industry benchmarks.
- Money is calculated in whole cents to avoid floating-point rounding errors.

## 📦 Inventory & Sales Estimator

*"Find out how many products you can sell with the inventory you have!"*

The estimator is in [`src/lib/inventory.ts`](src/lib/inventory.ts) (calculations), [`src/lib/inventoryState.ts`](src/lib/inventoryState.ts) (add / edit / remove / reset) and [`src/components/InventoryEstimator.tsx`](src/components/InventoryEstimator.tsx) (the section). It reuses the selling price, variable cost, fixed costs and expected sales from Step 2. Revenue and profit come from the same `calculate` function as the dashboard, so the estimator updates automatically whenever those inputs change.

### Inputs

For each inventory item: **name**, **quantity available** (with unit), and **quantity needed for one product** (with unit). Units: grams, kilograms, millilitres, litres or pieces. Compatible units convert automatically (1 kg = 1,000 g, 1 L = 1,000 mL), so "2 kg available, 20 g per coffee" works. Each business loads its own **fictional** sample inventory (not benchmarks). **Reset Inventory** restores it, and **Clear all items** empties the list.

### Formulas

| Measure | Formula |
|---|---|
| Maximum products from each item | Available quantity ÷ Quantity required per product, **rounded down** |
| Maximum production | The **lowest** result among all items (the limiting item; ties are all shown) |
| Estimated sales | MIN(Maximum production, Expected monthly sales) |
| Maximum potential revenue | Maximum production × Selling price |
| Estimated revenue | Estimated sales × Selling price |
| Estimated operating profit | Estimated sales × (Selling price − Variable cost per unit) − Monthly fixed costs |
| Required inventory (per item) | Expected sales volume × Quantity required per product |
| Shortage (per item) | MAX(0, Required inventory − Available inventory) |

**Worked example (coffee shop sample):** beans 2,000 g ÷ 20 g = 100, milk 5,000 mL ÷ 200 mL = 25, cups 100 ÷ 1 = 100, so the maximum is **25 coffees** and **milk is the limiting item**. With expected sales of 300: estimated sales = 25, revenue = 25 × $6 = $150, operating profit = 25 × ($6 − $2) − $800 = −$700. To meet expected sales of 100 coffees you would need 100 × 200 mL = 20 L of milk, a shortage of **15 litres**.

### Assumptions

- **Production capacity is not sales.** The section keeps three numbers separate: capacity from materials, expected customer demand (from Step 2), and estimated actual sales (the smaller of the two). It never assumes everything produced will sell.
- **Maximum potential revenue** assumes every product that can be made is sold.
- **Estimated profit** assumes the entered variable cost per unit applies to each unit sold, and that monthly fixed costs don't change.
- **Inventory costs are not added separately.** They are assumed to be part of the variable cost per unit, so they aren't counted twice.
- **Nail salon (services):** the result is the number of services consumable supplies can cover. It does **not** account for staff availability or appointment capacity.
- **Clothing store:** enter finished products as inventory, with 1 piece required per item sold.
- The "Consider replenishing" message is not a purchase recommendation. The app reminds users to weigh expected demand and the cost of extra inventory first.

### Validation

Every row must be valid before anything is calculated, because skipping a bad row could overstate production. The estimator handles:

- missing names and empty fields
- negative or non-numeric values
- more than 3 decimal places
- a quantity per product of 0 (the user is told to remove the item instead)
- incompatible units (e.g. kg vs mL)
- values over 1,000,000,000
- no items at all

Errors appear once a field has been used, and **Show what's missing** reveals them all at once. Quantities are stored as whole thousandths of a gram, millilitre or piece, so rounding down is exact (0.3 kg ÷ 100 g = exactly 3).

## How to run the app on your computer

1. Install **Node.js** (the LTS version) from <https://nodejs.org>.
2. Open a terminal in the project folder (the folder containing `package.json`).
3. Install the dependencies (only needed once):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the address it prints (usually <http://localhost:5173>) in your browser. The page reloads automatically when you edit the code.

To build and preview the production version:
```bash
npm run build
npm run preview
```

## Testing

Automated tests use **Vitest** and **React Testing Library**.

```bash
npm test          # run all tests once
npm run test:watch  # re-run tests as you edit
```

Test files:

| File | What it checks |
|---|---|
| `src/lib/accounting.test.ts` | The three required scenarios, rounding up break-even units, zero sales, zero fixed costs, $0 price, very large numbers, and what-if calculations |
| `src/lib/validation.test.ts` | Empty, negative, non-numeric, too-many-decimals, fractional-unit and oversized inputs |
| `src/lib/state.test.ts` | Choosing a business, reset to example values, what-if Reset Scenario and Apply |
| `src/lib/explain.test.ts` | Plain-language summaries (including that loss messages don't recommend a price) |
| `src/lib/chartData.test.ts` | Charts use the same formulas as the dashboard |
| `src/App.test.tsx` | Full user workflows in a simulated browser: choose a business, calculate, edit inputs, errors, reset, what-if |
| `src/lib/inventory.test.ts` | Inventory: sufficient / insufficient inventory, multiple items, tied limiting items, zero inventory, invalid quantities, unit conversions, demand lower / higher than capacity, price and cost changes, shortages |
| `src/lib/inventoryState.test.ts` | Inventory: add, edit, remove, clear, Reset Inventory |
| `src/components/InventoryEstimator.test.tsx` | Inventory workflows in the full app: coffee example, live updates when Step 2 inputs change, adding/removing items, errors, incompatible units, reset, nail salon note, tooltips |

**Automated test record:**
- **Original version (2 November 2026):** `npm test` ran **61 tests in 6 files, all passing**.
- **After adding the Inventory & Sales Estimator (2 November 2026):** `npm test` ran **98 tests in 9 files, all passing**. That's the original 61 tests, unchanged, which confirms the pricing calculator, what-if simulator and charts still work, plus 37 new inventory tests.

Both runs used Vitest 3.2.7 and Node 22 in the development environment, and `npm run build` completed without errors. Re-run `npm test` on your own computer to confirm.

### Manual testing table

*To be completed by the project team while using the app. The "Actual Result" and "Pass/Fail" columns are intentionally left blank.*

| # | Test Case | Input | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Profitable coffee shop | Price $6, variable $2, fixed $800, 300 units | Revenue $1,800; variable costs $600; CM/unit $4; profit $400; break-even 200 units | | |
| 2 | Loss-making business | Price $10, variable $6, fixed $1,000, 100 units | Revenue $1,000; variable costs $600; loss −$600; break-even 250 units | | |
| 3 | No positive contribution margin | Price $5, variable $7, fixed $500, 100 units | Loss −$700; "a finite break-even point cannot be achieved" | | |
| 4 | Zero sales | Coffee shop values, 0 units | Revenue $0; loss −$800; margin of safety % "can't be calculated" | | |
| 5 | Zero fixed costs | Price $6, variable $2, fixed $0, 300 units | Profit $1,200; break-even 0 units; margin of safety 100% | | |
| 6 | Fractional break-even | Price $5, variable $2, fixed $1,000, 400 units | Break-even 334 units (theoretical 333.33); revenue $1,666.67 vs $1,670 | | |
| 7 | Empty input | Clear the selling price, click Calculate | "Please enter the selling price." Results paused | | |
| 8 | Letters | Type `abc` as selling price | "Please use numbers only…" Input kept as typed | | |
| 9 | Negative value | Type `-5` as fixed costs | "The fixed costs can't be negative…" | | |
| 10 | Fractional units | Type `12.5` as sales volume | "Please enter a whole number of units…" | | |
| 11 | Very large number | Type `99999999999` as fixed costs | "That number is larger than this simulator supports…" No crash | | |
| 12 | Reset | Edit values, click "Reset to … example values" | Original fictional values restored | | |
| 13 | What-if | Coffee shop, what-if price $7 | New profit $700; difference +$300; new break-even 160 units; original price still $6 | | |
| 14 | Reset Scenario | After test 13, click Reset Scenario | What-if price back to $6; difference $0 | | |
| 15 | Apply new price | What-if $7, click Apply new price | Main selling price becomes $7 | | |
| 16 | Mobile layout | Open on a phone | All sections readable, no sideways scrolling | | |
| 17 | Inventory – coffee sample | Coffee Shop, default inventory, 300 expected sales | Max production 25 coffees; milk limiting; estimated sales 25; revenue $150; loss −$700; "may limit your sales" | | |
| 18 | Inventory – sufficient | Coffee Shop, expected sales changed to 20 | Estimated sales 20; "Great! Your current inventory is sufficient…"; no shortage | | |
| 19 | Inventory – tie | Remove Milk | Max 100 coffees; Coffee beans and Coffee cups tied as limiting | | |
| 20 | Inventory – conversion | Milk: 5 L available, 200 mL per coffee | Milk can make 25 coffees | | |
| 21 | Inventory – incompatible units | Milk: available in kg, per coffee in mL | Error explaining the units can't be converted; no results | | |
| 22 | Inventory – zero per product | Quantity per coffee = 0 | "Quantity per product must be more than 0…" | | |
| 23 | Inventory – shortage | Coffee Shop, expected sales 100 | "…you would need an additional 15 litres of milk." | | |
| 24 | Inventory – reset | Clear all items, then Reset Inventory | "No inventory items entered", then sample items restored | | |
| 25 | Inventory – price update | Change selling price to $8 | Estimated revenue updates to $200 | | |

## Real user feedback and improvements

> **TO BE COMPLETED BY THE PROJECT TEAM.** No real user testing has been done yet. Fill this in after a real person tries the app.

| Item | Details |
|---|---|
| Tester (role, not full name) | |
| Date | |
| Tasks they tried | |
| What worked well | |
| What was confusing | |
| Suggestions | |

**Improvements made after feedback:**

1. _…_
2. _…_

## Known limitations

- **Single product, constant prices.** CVP assumes one average selling price and variable cost per unit. Businesses with many products would need a weighted-average contribution margin (sales mix), which this version doesn't include.
- **Volume does not respond to price.** The what-if simulator keeps sales volume constant. It does not model price elasticity or how customers react to price changes.
- **Fixed costs are truly fixed.** Step costs (e.g. hiring another employee at higher volumes) are not modelled.
- **Monthly, pre-tax view.** No income taxes, GST/PST/HST, financing costs, cash-flow timing or inventory are included.
- **Input limits.** Dollar amounts accept up to 2 decimal places. Every field is capped at 1,000,000,000. Sales volume must be a whole number.
- **Nothing is saved.** Refreshing the page goes back to the example values (there is no database or account, by design).
- **Inventory estimator:**
  - It works from a single product recipe: every unit sold uses the same quantities.
  - It doesn't model waste, spoilage, expiry dates, supplier lead times, reorder costs or inventory carrying costs.
  - For services, it doesn't consider staff hours or appointment slots.
  - It supports weight, volume and piece units only, with no imperial units or conversions between weight and volume.
  - Inventory entries are not saved when the page is refreshed, and they reload to the sample when the business type changes.
- **Educational only.** Results are simplified estimates, not financial advice.

## AI-assisted development disclosure

This application was developed with the help of **Claude**, an AI assistant made by Anthropic. Claude wrote the code, automated tests and first draft of this README based on our detailed project requirements (formulas, edge cases, design and testing scenarios).

The project team is responsible for:

- reviewing the accounting formulas and edge-case handling against course material,
- checking the expected test results by hand,
- completing the manual testing table and real-user feedback section, and
- any changes made afterwards.

AI-generated code can contain errors, so the team should check the output rather than assume it is correct.

## Project structure

```
src/
  lib/
    accounting.ts     ← all accounting formulas (start here)
    validation.ts     ← input checking and friendly error messages
    explain.ts        ← plain-language result summaries
    businesses.ts     ← the 5 business categories and fictional example values
    state.ts          ← app state: select, edit, reset, what-if
    chartData.ts      ← chart points (built from accounting.ts)
    inventory.ts      ← inventory estimator formulas, units and sample inventory
    inventoryState.ts ← inventory rows: add, edit, remove, reset
    format.ts         ← CAD currency / number formatting
    *.test.ts         ← automated tests
  components/         ← reusable React components (one per section/card)
  App.tsx             ← puts the sections together
  App.test.tsx        ← user-workflow tests
```

**Tech stack:** React 18 · TypeScript 5.6 · Vite 6 · Tailwind CSS 3 · Recharts 2 · Vitest 3 + React Testing Library. No backend, database, accounts, payments, API keys or paid services. Everything runs in the browser.

## Deployment (GitHub + Vercel)

### 1. Put the code on GitHub
1. Create a free account at <https://github.com> and click **New repository** (e.g. `price-it-right`). Leave "Add a README" unticked.
2. In a terminal in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Price It Right – initial version"
   git branch -M main
   git remote add origin https://github.com/<your-username>/price-it-right.git
   git push -u origin main
   ```
   (`node_modules` and `dist` are excluded by `.gitignore`.)
   *No terminal? Use GitHub's "uploading an existing file" link on the empty repo page and drag in the project files, **without** the `node_modules` and `dist` folders.*

### 2. Deploy on Vercel
1. Go to <https://vercel.com> and **Sign up with GitHub** (the free Hobby plan is enough).
2. Click **Add New… → Project**, then **Import** your `price-it-right` repository.
3. Vercel detects **Vite** automatically (settings are also in `vercel.json`): build command `npm run build`, output directory `dist`.
4. Click **Deploy**. After about a minute you get a public link like `https://price-it-right.vercel.app`.
5. From then on, every `git push` to `main` redeploys automatically.
