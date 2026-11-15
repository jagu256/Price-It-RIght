# Price It Right – 5-minute demo script

For the oral demonstration. Every figure below comes from the fictional demo café and has been checked by hand and by an independent recalculation (README → Independent verification). Practise it once on the live site: https://price-it-r-ight.vercel.app

**Before you start:** open the site, click **🧹 Start fresh** in My Business if needed, then go to Home. Zoom the browser to about 125 % so the audience can read it.

---

### 0:00 – The problem (30 s)
*"Small-business owners often set prices by guessing. They don't know their break-even point or which product actually makes money, and they can't tell whether their stock can cover expected sales. Price It Right is a free, educational tool that answers those questions with accounting logic."*

→ Click **✨ Try a Demo Business**. *"This is a fictional café."*

### 0:30 – Profit Dashboard (1 min 15 s)
- Point at the cards: revenue **$3,900**, contribution margin **$2,475**, operating profit **$975**.
- *"Contribution margin is price minus variable cost. Fixed costs of $1,500 are subtracted **once** for the whole business, not per product."*
- Click **Show the math** on operating profit → *$2,475 − $1,500 = $975*.
- Scroll to break-even: **455 units** (about **$2,363.64**). *"We round up, because half a muffin can't be sold. It assumes the sales mix stays the same, and the app says so."*
- Sensitivity: *"A 10 % rise in prices adds $390. Leverage is 2.54, so a 10 % sales change moves profit about 25 %."*

### 1:45 – Pricing Lab (45 s)
- What-If: change Coffee price from $6 to $7 → compare current vs modified plan.
- *"This is only an experiment – nothing changes until I click Apply."* → click **Reset Scenario**.
- Optional: *What Price Should I Charge?* for a profit target.

### 2:30 – Inventory and Production Planner (1 min)
- Smart Inventory Hub: *"Stock can be uploaded from Excel or CSV. Each product has a recipe, so the app knows what it uses."*
- Production Planner: *"Expected sales need more milk and butter than we have, so the profit of $975 isn't achievable with current stock."*
- Click **🧮 Best mix (exact search)** → *"This searches every possible plan and is labelled proven optimal only when the search finishes. The simpler 'Suggested plan' is clearly labelled as not proven."*

### 3:30 – Decisions (30 s)
- Make or buy: *"We compare only relevant costs. Unavoidable fixed costs are crossed out because they're paid either way."*
- Special order: *"An order the stock can't cover is shown as not achievable, never as profit."*

### 4:00 – Report, French, trust (45 s)
- Business Report → **Download My Business Report** (PDF) and the Excel file.
- Click **FR** → *"The whole app, report included, works in French, with Canadian formats like 975 $."* → back to **EN**.
- *"Accuracy: money is calculated in whole cents, invalid input is never turned into zero, 307 automated tests pass, and a separate checker recalculated every key example independently, with no discrepancies."*

### 4:45 – Close (15 s)
*"It's an educational decision-support tool: results depend on the assumptions entered, and it isn't financial advice. We used AI to build it, and our team checked the formulas, tested it with real users and made improvements from their feedback."*
(Only say the last part once user testing has actually been done.)

---

### Likely questions and short answers
- **Why is break-even 455 and not 454.55?** Units must be whole, so we round up. The split (182/91/61/121) keeps the mix and still earns at least $0.
- **Is contribution margin the same as profit?** No. Operating profit = total CM − fixed costs. It's also not net income: there's no tax or interest unless you use the optional after-tax target.
- **Why can't the café earn $975?** Expected sales need more milk and butter than it has. The app keeps expected, inventory-constrained and scenario profit separate.
- **How do you know the numbers are right?** There are hand checks, 307 automated tests and an independent recalculation, and Best mix is cross-checked against trying every possible plan.
