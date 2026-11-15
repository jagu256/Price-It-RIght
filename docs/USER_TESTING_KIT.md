# Price It Right – user-testing kit

The brief requires **real user testing** and **at least one improvement based on the feedback**. This kit makes that quick: about 20 minutes per tester. Aim for 3–5 testers, for example classmates, a family member who runs or has run a small business, or someone with no accounting background.

> **Rules:** write down only what really happened. Don't fill anything in for a tester, and don't "tidy up" their words. Use a role, not a full name (e.g. "ACCT student", "café owner").

---

## 1. Before the session (2 min)
- Open https://price-it-r-ight.vercel.app on the tester's own device if possible (phone or laptop – note which).
- Say: *"We're testing the app, not you. Please think out loud. If you get stuck, that's useful for us – I won't help unless you're stuck for more than a minute."*
- The observer only watches and writes. Don't point at buttons.

## 2. Tasks (12–15 min)
Read each task aloud. Tick ✅ done alone, 🟡 done with a hint, or ❌ not done. Note where they hesitated.

| # | Task (read this to the tester) | What "success" looks like (observer only) |
|---|---|---|
| 1 | "Load the demo business and tell me how much profit it makes per month." | Home → *Try a Demo Business* → Profit Dashboard → says **$975** operating profit |
| 2 | "How many items does the café need to sell to break even?" | Finds the sales-mix break-even: **455 units** (about $2,363.64 of revenue) |
| 3 | "Find out how that profit is calculated." | Clicks **Show the math** on the profit card → *$2,475 − $1,500 = $975* |
| 4 | "Raise the coffee price to $7. What happens to profit? Don't keep the change." | Pricing Lab → What-If → changes Coffee price → compares → *Reset Scenario* (not *Apply*) |
| 5 | "Does the café have enough stock for the sales it expects? What's short?" | Smart Inventory Hub or Production Planner → **milk and butter are short** |
| 6 | "A customer offers to buy 100 coffees at $4 each. Should the café accept?" | Decisions → Special order → sees it's **not achievable with current inventory** (milk) |
| 7 | "Download a report you could give to a bank or a partner." | Business Report → downloads the PDF (or the Excel file) |
| 8 | (Optional, if the tester reads French) "Switch the app to French." | Clicks **FR** in the header; amounts show as `975 $` |

## 3. Questions after the tasks (5 min)
Ask these and write the answers word for word:
1. What was the most useful part?
2. What was confusing or hard to find?
3. Was any word or number you didn't understand? (e.g. *contribution margin*, *break-even*)
4. On a scale of 1–5, how easy was the app to use? (1 = very hard, 5 = very easy)
5. On a scale of 1–5, how much would you trust these numbers for a real decision? Why?
6. If you could change one thing, what would it be?

## 4. Record sheet (one per tester)

| Item | Details |
|---|---|
| Tester (role, not full name) | |
| Date | |
| Device (phone / laptop, browser) | |
| Tasks: ✅ / 🟡 / ❌ for 1–8 | 1: 2: 3: 4: 5: 6: 7: 8: |
| Where they hesitated | |
| Ease of use (1–5) | |
| Trust in the numbers (1–5) and why | |
| Most useful part | |
| Most confusing part | |
| Suggested change | |

## 5. After testing – turning feedback into the required improvement
1. List every problem that came up and count how many testers had it.
2. Pick **one** problem that several testers had and that is small enough to fix well. Good candidates are a confusing label, a hard-to-find button, or a missing explanation.
3. Write it down **before** fixing: *"3 of 4 testers couldn't find X because Y."*
4. Ask Claude Code to make the fix. Paste the problem statement and say it came from user testing. It will add a test, update the README and push.
5. If possible, ask one tester to try the same task again, and note the result.
6. Copy the record sheets' key points into **README → Real user testing and feedback**. Write the improvement under *Improvements made after feedback* as "problem → change made → result".

> The README section must stay empty until real testing has happened. Never invent feedback, tester answers or results.
