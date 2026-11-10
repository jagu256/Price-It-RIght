Build a Complete Web Application: Price It Right
I am a fourth-year accounting student working on an ACCT 4500 group project. I need you to build a complete, functional, interactive web application called Price It Right – Small Business Pricing Simulator.

The application should be creative, visually appealing, professional, beginner-friendly, and easy to use.

The goal is to help small-business owners and student entrepreneurs understand how selling prices, variable costs, fixed costs, and sales volume affect their profitability.

I have no coding experience, so please handle the technical implementation while keeping the project straightforward enough for me to understand and explain during a university demonstration.

1. Application Design
Create a modern, aesthetically pleasing financial dashboard.

Design preferences:

Soft sage green, cream, white, and pastel yellow colour palette.

Rounded cards, subtle shadows, and smooth animations.

Clean, modern typography.

Friendly icons for different business categories.

Professional but playful appearance.

Fully responsive design for mobile phones, tablets, and laptops.

Clear navigation and accessible form labels.

The application should feel like a polished startup product rather than a basic classroom calculator.

Application title: Price It Right

Tagline: Set your price. Know your costs. Maximize your profit.

2. Welcome Section
Create a welcoming homepage with:

Application name and tagline.

A short description explaining what the application does.

A prominent "Start Pricing" button.

A simple explanation of the three steps:

Choose your business.

Enter your numbers.

Discover your profit potential.

Users should be able to start immediately without creating an account.

3. Choose Your Business
Allow users to select one of five business categories:

☕ Coffee Shop

🧁 Bakery

💅 Nail Salon

👕 Clothing Store

✨ Custom Business

Each category should have editable fictional example values.

Suggested defaults:

Business	Selling Price	Variable Cost	Monthly Fixed Costs	Monthly Units
Coffee Shop	$6	$2	$800	300
Bakery	$5	$2	$1,000	500
Nail Salon	$45	$12	$2,500	150
Clothing Store	$40	$18	$1,800	120
Custom Business	$20	$8	$500	100
Selecting a business should automatically populate the input fields with these examples.

Clearly identify all values as fictional examples, not industry benchmarks.

Users must be able to change every value.

4. Input Section
Create an intuitive panel where users can enter:

Business name or category.

Selling price per unit ($).

Variable cost per unit ($).

Monthly fixed costs ($).

Expected monthly sales volume (units).

Include brief explanations of accounting terms.

For example:

Variable Cost: The cost that changes with each product sold, such as materials or packaging.

Fixed Cost: Expenses that generally stay the same within the relevant activity range, such as monthly rent.

All amounts should be displayed in Canadian dollars (CAD).

Add a button called Calculate My Profit.

Also allow users to adjust their selling price using an interactive slider.

5. Accounting Calculations
Use accurate managerial accounting formulas.

Revenue = Selling Price × Units Sold

Total Variable Costs = Variable Cost per Unit × Units Sold

Contribution Margin per Unit = Selling Price − Variable Cost per Unit

Total Contribution Margin = Revenue − Total Variable Costs

Contribution Margin Ratio = Contribution Margin per Unit ÷ Selling Price × 100

Total Costs = Total Variable Costs + Fixed Costs

Operating Profit = Revenue − Total Variable Costs − Fixed Costs

Break-Even Units = Fixed Costs ÷ Contribution Margin per Unit

Break-Even Revenue = Break-Even Units (unrounded) × Selling Price

Margin of Safety in Dollars = Projected Revenue − Break-Even Revenue

Margin of Safety Percentage = Margin of Safety in Dollars ÷ Projected Revenue × 100

For break-even units, round UP to the next whole unit because a business cannot sell a fraction of a product or service.

If selling price is equal to or less than variable cost per unit, clearly indicate that a finite break-even point cannot be achieved with positive fixed costs under the current assumptions.

If fixed costs are zero, handle break-even appropriately without dividing by zero.

For zero sales or zero selling price, show an appropriate explanation instead of undefined percentages.

Distinguish the theoretical break-even revenue from the revenue associated with the rounded-up break-even units.

Do not make unsupported claims about the ideal selling price.

6. Results Dashboard
After calculating, display a professional results dashboard with six cards:

Monthly Revenue

Monthly Operating Profit or Loss

Break-Even Units

Contribution Margin per Unit

Contribution Margin Ratio

Margin of Safety

Use green to indicate positive profit and a contrasting accessible colour to indicate losses.

Display a short explanation of the results.

Examples:

"At your current price and expected sales volume, your business is projected to earn $400 in monthly operating profit."

"Your business must sell at least 200 units per month to break even."

If the business is operating at a loss, explain the projected shortfall without making misleading recommendations.

All calculations must update consistently when users change their inputs.

7. Interactive What-If Simulator
This should be the application's signature feature.

Create a section called:

What If You Changed Your Price?

Allow users to adjust selling price with a slider or numeric input.

Display side-by-side comparisons between:

Original Scenario

Original selling price

Original revenue

Original profit

Original break-even units

New Scenario

New selling price

New revenue

New profit

New break-even units

Highlight the dollar difference in projected profit.

For the initial version, assume the expected sales volume remains constant when the price changes.

Clearly display this assumption so users understand that higher selling prices do not automatically lead to higher real-world profits.

Changes made in the what-if simulator should not overwrite the original baseline scenario unless the user explicitly chooses to apply the new price.

Include a "Reset Scenario" button.

8. Interactive Financial Charts
Include two visualizations.

Chart 1: Revenue vs. Total Costs

Create a line chart showing:

Sales volume on the horizontal axis.

Revenue and total costs on the vertical axis.

The approximate break-even intersection when one exists.

Chart 2: Profit at Different Sales Volumes

Create an interactive bar or line chart showing projected operating profit at different monthly sales volumes.

Use readable labels, units, and accessible colours.

Charts must use the same accounting formulas as the main dashboard.

Do not display a misleading break-even intersection if none exists.

9. User-Friendly Error Handling
The application must handle invalid inputs reliably.

Requirements:

Prevent negative selling prices.

Prevent negative variable costs.

Prevent negative fixed costs.

Prevent negative sales volumes.

Prevent blank required inputs from producing misleading outputs.

Prevent letters or nonnumeric values in numeric fields.

Handle selling prices below variable costs.

Handle zero sales.

Handle zero fixed costs.

Handle extremely large numbers without crashing.

Show clear, friendly error messages.

Allow users to correct inputs easily.

Do not silently replace invalid user input with zero.

Include a reset feature that restores the selected business's original fictional values.

10. Educational Features
Include a small section titled:

Understand Your Numbers

Explain these concepts in simple language:

Revenue

Variable Costs

Fixed Costs

Contribution Margin

Break-Even Point

Operating Profit

Margin of Safety

Keep explanations concise and understandable to someone without an accounting background.

11. Technical Requirements
Build this as a complete, working web application.

Use:

React

TypeScript

Vite

Tailwind CSS

Recharts for financial visualizations

Keep the code organized and easy to maintain.

Requirements:

No backend required.

No user accounts.

No database.

No payment functionality.

No API keys.

No external paid services.

All calculations should work directly in the browser.

The application should be ready for deployment on Vercel.

Provide clear instructions for running it locally.

Make the project compatible with GitHub.

Use reusable React components and separate the accounting calculations into a dedicated module.

12. Testing and Verification
Include automated tests for important accounting calculations and error cases.

At minimum, verify these scenarios:

Test 1: Profitable Coffee Shop

Selling price: $6
Variable cost: $2
Fixed costs: $800
Expected sales: 300

Expected results:

Revenue = $1,800

Total variable costs = $600

Contribution margin per unit = $4

Profit = $400

Break-even units = 200

Test 2: Loss-Making Business

Selling price: $10
Variable cost: $6
Fixed costs: $1,000
Expected sales: 100

Expected results:

Revenue = $1,000

Total variable costs = $600

Profit = −$600

Break-even units = 250

Test 3: No Positive Contribution Margin

Selling price: $5
Variable cost: $7
Fixed costs: $500
Expected sales: 100

Expected results:

Profit = −$700

No finite break-even point exists.

Also include tests for:

Zero sales.

Zero fixed costs.

Empty inputs.

Invalid inputs.

Reset functionality.

What-if scenario calculations.

If possible, include component or interaction tests for key user workflows.

Do not claim that tests have passed unless they have actually been executed successfully.

13. Documentation
Create a README.md file containing:

Application name and description.

Problem being solved.

Target users.

Core features.

Accounting formulas and assumptions.

How to run the application.

Testing instructions.

Known limitations.

AI-assisted development disclosure.

Deployment instructions.

Include a testing table with columns for:

Test Case | Input | Expected Result | Actual Result | Pass/Fail

Do not invent actual results or claim that real user testing has occurred.

Leave a clearly marked section for us to document feedback from a real person and the improvements made afterward.

14. Important Development Instructions
Please build the actual application, not just describe how it could be built.

Follow these steps:

Inspect the existing project files, if any.

Create the complete application.

Implement the accounting formulas.

Add the business categories and sample values.

Build the interactive dashboard.

Add the what-if simulator.

Add the financial charts.

Implement input validation.

Add automated tests.

Run the tests and fix any issues found.

Run the production build and fix any errors.

Create or update the README.

Explain how I can preview the application.

Explain how to publish it using GitHub and Vercel.

Prioritize accurate accounting calculations, reliable functionality, and ease of use over unnecessary complexity.

Make the interface beautiful, but ensure it is a genuinely functional business application.

Keep the application small enough that a fourth-year accounting student can understand and demonstrate its logic.

Final goal: Deliver a polished, functional, interactive pricing simulator that demonstrates accounting knowledge, human oversight of AI-assisted development, and responsible financial decision-making.