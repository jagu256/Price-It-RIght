# Rubric checklist and reflection guide

This page maps each line of the grading rubric to the evidence already in this project, lists what **only your team can do**, and gives a structure for the reflection.

> **Ownership matters for the grade.** The reflection has to be written by your team, in your own words, about what *you* decided, checked and learned. The evidence log below is a factual record to draw from. Don't paste it as your reflection, and don't claim work you didn't do.

---

## 1. Rubric → where the evidence is

| Criterion (2 pts each) | What earns full marks | Evidence in this project | Still to do by the team |
|---|---|---|---|
| **Deployment and completion** | Deployed on Vercel, accessible, works start to finish | Live at https://price-it-r-ight.vercel.app; every push to `main` redeploys; 419 automated tests and a production build pass before each push; README → Deployment | Open the live site on a phone and a laptop and run the demo start to finish ([DEMO_SCRIPT.md](DEMO_SCRIPT.md)). Remove the unused `price-it-right.ca` domain/redirect in Vercel if it is still there. |
| **Complexity and feature depth** | Multiple interacting features beyond a basic build | 9 sections sharing one business model: CVP and sales-mix break-even, inventory → recipes → costing → shortages, production planning with a proven-optimal "Best mix", pricing tools, decisions, budgets, cash flow, reports (PDF and Excel), save files, French. A price change in one place flows through every screen. | Be ready to explain 3–4 of them in the oral demo. |
| **Quality and polish** | Clear, usable, visually coherent, reasonably polished | One design system (sage/cream), phone layout with a bottom tab bar, a guided tour, tooltips, undo, dark mode / large text / high contrast, print styles. All text was contrast-checked on 9 screens in both themes: 0 failures out of 1,815. Invalid input never becomes 0. | Real user testing ([USER_TESTING_KIT.md](USER_TESTING_KIT.md)) and **one improvement based on it**. |
| **Reflection and ownership** | Explains what the AI did, what the student changed or solved, the challenge faced, and what they learned | README → AI-assisted development disclosure; `docs/PROJECT_HISTORY.md` | **Write the reflection** (section 3 below). |
| **Iteration and problem-solving** | Clear evidence of revising, debugging and decisions beyond the first AI output | 44+ commits, each with checks; PROJECT_HISTORY records bugs found, AI mistakes caught and design decisions; three independent recalculations (2, 9 and 15 Nov) with no discrepancies | Fill in the manual testing table with **real** results; record the user-testing change. |

---

## 2. Evidence log (facts to draw from)

### Decisions and requests that came from you (the project owner)
These are taken from the project conversation. Check them, and add your own.
- Moved the project to GitHub and Vercel, and asked for the current GitHub version to be used instead of an older local copy.
- **Found a usability problem yourself:** "Export my business" downloaded a file that looked like a code file. That led to clearer labelling of the backup file and to the **Excel export** feature.
- Chose the feature roadmap: Show the math, save/load, sensitivity, after-tax target, demand, decisions, Excel; then French, 12-month projection and the proven-optimal optimizer; then the two later lists of features and UI/UX changes.
- Asked for **independent verification** of the calculations by a separate agent that never saw the code, including a re-check after new features were added.
- Shared the grading rubric and asked for the work to be judged against it.

### Problems found and fixed (iteration)
Each one is described in `docs/PROJECT_HISTORY.md`, in the section for that feature:
- **Wrong expectations written by the AI, caught by hand checks:** the Coffee Shop's fixed costs ($1,500, not $800); the lowest price for a $200 target ($8.58, not $8.70); the best month (July, not December).
- **Rounding traps:** 300 × 1.1 is not exactly 330 in JavaScript (test fixed; app inputs are whole units); markup/margin prices are rounded up so the requested rate is always met.
- **Accounting design decisions:**
  - A special order is achievable only if every item *its* product uses covers demand plus the order.
  - Buying stock is cash, not an expense.
  - Saved scenarios are not stored.
  - Drop-a-product counts only avoidable fixed costs.
- **UI bugs found by checking in the browser:**
  - Tooltips ran off a phone screen, then appeared in the wrong place inside animated cards.
  - The tour's tab highlight disappeared.
  - Two quick clicks on the display buttons cancelled each other.
  - A heading id was duplicated.
  - Faint text in the light theme was found by a contrast check.
- **Project rule kept:** when a screen started doing its own arithmetic, it was moved into the tested `src/lib` code.

### Verification
- Automated tests: 61 → 156 → 307 → 419 over the project (see README → Testing).
- Independent recalculations by a separate agent, with no discrepancies: 2 Nov (8 scenarios), 9 Nov (9 scenarios), 15 Nov (5 feature groups). See README → Independent verification.

---

## 3. Reflection structure (write this yourselves)

Aim for "analytical, not just descriptive": say **why**, what you would do differently, and what it shows about using AI.

1. **What the AI did:** be specific (code, tests, first drafts of documentation, translations). What did you *not* let it decide?
2. **What you changed, decided or solved:** pick 2–3 concrete moments. Examples to choose from: spotting the "code file" export problem; insisting on independent verification; choosing which features matter for the course. For each: what was wrong or unclear, what you decided, and how you checked it.
3. **A challenge you faced:** a real one. For example, trusting AI-generated numbers, keeping the accounting correct (fixed costs once, contribution margin ≠ profit), scope growing too large, or understanding code you didn't write. How did you handle it?
4. **What you learned:** about accounting (e.g. relevant costs, contribution margin per scarce resource, cash ≠ profit) and about working with AI (why tests and hand checks matter: the AI's own expectations were wrong several times).
5. **User testing → improvement:** what testers struggled with, what you changed, and whether it helped. Only write this once it has really happened.
6. **If you did it again:** one thing you would do differently.

> Tip for the oral demo: be ready to recompute one number by hand (e.g. $2,475 − $1,500 = $975, or break-even 1,500 ÷ 3.30 = 454.5 → 455 units) and to explain one design decision in your own words.
