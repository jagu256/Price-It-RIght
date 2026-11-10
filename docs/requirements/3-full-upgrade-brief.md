PRICE IT RIGHT
Complete Small Business Pricing, Inventory & Profitability Simulator
PROJECT OVERVIEW
I am a fourth-year accounting student developing a web application for my ACCT 4500 university group project.

The application is called:

Price It Right

Tagline: "Set your price. Know your costs. Maximize your profit."

I already have an initial version of the website. I want you to inspect the existing codebase and upgrade it into a comprehensive but user-friendly small-business financial planning application.

Do not unnecessarily rebuild the project from scratch. Preserve working functionality and reuse existing components wherever possible.

The application should combine:

Multi-product profitability calculations

Pricing analysis

Break-even analysis

Inventory tracking

Excel and CSV inventory imports

Product recipes and inventory requirements

Product costing

Production capacity estimation

Inventory-constrained product mix analysis

Profit goal planning

Business scenario comparisons

Interactive financial visualizations

Educational business challenges

Downloadable financial reports

The goal is to create a genuinely useful business decision-making tool, not merely an attractive calculator.

IMPORTANT: This is a university accounting project. Financial accuracy, transparent assumptions, human oversight, reliability, and ease of use are essential.

The website must remain manageable, responsive, and understandable to students without extensive programming experience.

PART 1: WEBSITE DESIGN
1.1 Overall Appearance
Create a modern, visually appealing dashboard.

Design inspiration: A combination of a friendly fintech application and a small-business management platform.

Use:

Soft sage green

Cream

White

Pastel yellow

Muted dark green

Subtle neutral accents

Include:

Rounded cards

Soft shadows

Clean typography

Friendly icons

Smooth but lightweight transitions

Interactive charts

Clear input fields

Consistent buttons

Accessible contrast

Responsive layouts

The design should feel welcoming to someone who has never studied accounting.

Avoid making the website look overly technical or cluttered.

1.2 Website Navigation
Organize the application into these main sections:

1. 🏠 My Business
Business selection, product management, and financial assumptions.

2. 💰 Profit Dashboard
Revenue, costs, operating profit, contribution margins, and break-even analysis.

3. 🎯 Pricing Lab
Pricing scenarios, profit targets, and business decision comparisons.

4. 📦 Smart Inventory Hub
Inventory uploads, product recipes, inventory consumption, and shortages.

5. 🏆 Production Planner
Inventory-constrained production planning and product mix analysis.

6. 🎮 Business Challenge
Interactive educational business scenarios.

7. 📊 Business Report
Financial summaries, charts, and downloadable reports.

Use a responsive navigation bar, sidebar, or tab system.

Users should be able to move between sections without losing their inputs.

Use one shared application state so that product prices, costs, inventory, and other assumptions stay consistent across sections.

PART 2: HOMEPAGE
Create an attractive homepage with:

PRICE IT RIGHT

"Set your price. Know your costs. Maximize your profit."

Description:

"Make smarter business decisions with an interactive tool that helps you price products, track inventory, calculate profits, and plan production."

Include a prominent:

🚀 Start My Business

button.

Below the introduction, show four simple steps:

Choose your business.

Add your products.

Enter costs or upload inventory.

Discover your profit potential.

Also include a button:

✨ Try a Demo Business

This should load a complete fictional sample business with products, prices, costs, and inventory so that users can explore the application immediately.

Clearly label demo data as fictional.

PART 3: BUSINESS SELECTION
Allow users to select:

☕ Coffee Shop

🧁 Bakery

💅 Nail Salon

👕 Clothing Store

✨ Custom Business

Each business category should contain fictional sample products and financial assumptions.

For example:

Coffee Shop
Product	Selling Price	Variable Cost	Monthly Sales
Coffee	$6	$2	300
Latte	$8	$3	200
Muffin	$4	$1.50	150
Sandwich	$9	$4	100
All amounts are in CAD.

Provide reasonable fictional examples for the other business categories.

Do not represent the examples as real market averages.

Users must be able to edit every value.

Switching business categories should ask for confirmation before replacing existing work.

PART 4: MULTI-PRODUCT MANAGEMENT
Create a feature titled:

🛒 My Product Collection

Subtitle:

"Manage your products and see how each one contributes to your business."

Users must be able to:

Add a product

Edit a product

Delete a product

Duplicate a product

Enter expected monthly sales

Change selling prices

Enter variable costs

Assign an optional category

Each product should contain:

Product name

Selling price per unit

Variable cost per unit

Expected monthly sales volume

Optional category

Each product should have a unique internal identifier.

Display products in an editable table.

Individual Product Calculations
Calculate:

Revenue = Selling Price × Expected Units Sold

Total Variable Costs = Variable Cost Per Unit × Expected Units Sold

Contribution Margin Per Unit = Selling Price − Variable Cost Per Unit

Total Contribution Margin = Revenue − Total Variable Costs

Contribution Margin Ratio = Contribution Margin Per Unit ÷ Selling Price × 100

Handle zero selling prices appropriately.

Do not confuse product contribution margin with net profit.

Do not subtract the entire business's fixed costs separately from every product.

Display:

Product revenue

Total product variable costs

Contribution margin per unit

Total contribution margin

Contribution margin ratio

Allow users to sort products by:

Highest revenue

Highest total contribution margin

Highest contribution margin per unit

Highest sales volume

PART 5: BUSINESS PROFITABILITY DASHBOARD
Create a section titled:

💰 Your Business at a Glance

Users enter their total monthly business fixed costs once.

Automatically calculate profitability across all products.

Accounting Formulas
Total Revenue = Sum of All Product Revenues

Total Variable Costs = Sum of All Product Variable Costs

Total Contribution Margin = Total Revenue − Total Variable Costs

Monthly Operating Profit = Total Contribution Margin − Monthly Fixed Costs

Overall Contribution Margin Ratio = Total Contribution Margin ÷ Total Revenue × 100

Clearly distinguish operating profit from net income, as taxes, interest, and other expenses may not be included.

Display six financial summary cards:

Total Monthly Revenue

Total Variable Costs

Total Contribution Margin

Monthly Fixed Costs

Projected Operating Profit/Loss

Overall Contribution Margin Ratio

Use green indicators for positive operating profit and accessible warning colours for losses.

Include concise explanations of what the numbers mean.

Financial Charts
Create:

Chart A: Revenue vs. Total Costs

Show the relationship between sales activity, revenue, and total costs.

Chart B: Product Contribution Comparison

Compare total contribution margins across products.

Chart C: Revenue Breakdown

Show how individual products contribute to total revenue.

Use consistent accounting logic across the dashboard and charts.

PART 6: BREAK-EVEN ANALYSIS
Include an interactive break-even calculator.

For a single product:

Contribution Margin Per Unit = Selling Price − Variable Cost Per Unit

Break-Even Units = Fixed Costs ÷ Contribution Margin Per Unit

Round required units UP to the next whole unit.

For multiple products, account for the sales mix.

Use an explicitly stated constant sales-mix assumption and the weighted-average contribution margin.

For a fixed sales mix:

Weighted Average Contribution Margin = Sum of Each Product's Sales Mix Proportion × Its Contribution Margin Per Unit

Break-Even Total Units = Fixed Costs ÷ Weighted Average Contribution Margin

Clearly identify assumptions.

When producing product-level break-even quantities, use a defensible integer allocation that respects the assumed product proportions.

Do not imply that every possible product mix has the same break-even point.

If contribution margin is insufficient to cover fixed costs, display a clear explanation.

If the calculation is undefined, show "Not Available" rather than misleading results.

Include an interactive break-even visualization.

PART 7: PRICING LAB
Create a section titled:

🎯 Pricing Lab

Subtitle:

"Experiment with prices and discover how your decisions affect profit."

7.1 What-If Pricing Simulator
Allow users to:

Change product selling prices

Change product variable costs

Change expected sales volumes

Change monthly fixed costs

Immediately calculate the effects on:

Revenue

Contribution margin

Operating profit

Break-even point

Show two scenarios:

Current Business Plan

versus

Modified Business Plan

Include a side-by-side comparison.

Example:

Metric	Current	Modified
Revenue	$3,000	$3,500
Variable Costs	$1,200	$1,300
Fixed Costs	$1,000	$1,000
Operating Profit	$800	$1,200
Show the difference between scenarios.

Include:

Apply Changes

Reset Scenario

Compare Results

Scenario changes must not overwrite the original business plan without the user's confirmation.

7.2 Smart Pricing Assistant
Create a feature titled:

💡 What Price Should I Charge?

Allow the user to select one product and enter:

Desired monthly operating profit

Expected sales volume

Variable cost per unit

Monthly fixed costs or an explicitly selected share of them

For a single-product business:

Required Selling Price = Variable Cost Per Unit + (Fixed Costs + Target Profit) ÷ Expected Units Sold

For a multi-product business, calculate the selected product's required price using the expected contribution from all other products and total business fixed costs.

Required Price for Selected Product = Selected Product Variable Cost Per Unit + (Fixed Costs + Target Profit − Contribution From Other Products) ÷ Expected Sales of Selected Product

Handle zero expected sales and infeasible targets clearly.

Display the minimum calculated price required under the entered assumptions.

Do not describe the result as a guaranteed market-optimal price.

Explain that actual demand may change when prices change.

7.3 Profit Goal Tracker
Create a goal-setting tool.

Allow users to enter a desired monthly operating profit.

Display:

Target operating profit

Current projected operating profit

Difference from target

Visual progress indicator

Additional contribution margin required

For a single product with positive contribution margin, calculate the units required to achieve the target.

For multiple products, allow users to specify a sales mix or choose the product for which they want to calculate additional sales.

Never assume all products have identical contribution margins.

PART 8: SMART INVENTORY HUB
Create a section titled:

📦 Smart Inventory Hub

Subtitle:

"Upload your inventory, understand your stock, and plan smarter."

The purpose is to let users upload existing inventory spreadsheets instead of manually entering every inventory item.

8.1 Inventory Upload
Allow users to upload:

Excel (.xlsx)

CSV (.csv)

Process files directly in the browser.

Do not send uploaded inventory data to external servers.

Do not require accounts or passwords.

Use an appropriate maintained spreadsheet parsing library.

Allow:

File selection

Drag-and-drop

Spreadsheet preview

Worksheet selection for Excel workbooks

Column mapping

Import confirmation

Manual editing after import

Replacing imported inventory

Clearing inventory

The website should recognize common columns such as:

Item Name	Available Quantity	Unit	Cost Per Unit
Coffee Beans	5000	g	0.03
Milk	10000	mL	0.002
Coffee Cups	200	pieces	0.15
Flour	3000	g	0.004
Provide flexible column mapping because real businesses use different spreadsheet formats.

The user must confirm mappings before importing.

8.2 Inventory Template
Include a button:

📥 Download Inventory Template

Generate an Excel spreadsheet with example data and clear column headings.

The template should be directly compatible with the upload feature.

8.3 Inventory Management
After importing, display an editable inventory table.

Allow users to:

Add inventory items

Edit quantities

Delete inventory items

Update purchase costs

Change measurement units

Review inventory availability

Support compatible unit conversions:

Kilograms to grams

Grams to kilograms

Litres to millilitres

Millilitres to litres

Support pieces as discrete units.

Do not convert incompatible units automatically.

8.4 Inventory Validation
Detect:

Missing item names

Missing quantities

Negative quantities

Invalid numbers

Duplicate inventory records

Unsupported formats

Incompatible units

Empty files

Show helpful error messages.

Do not silently merge duplicate records.

Set appropriate limits on file sizes and spreadsheet rows.

Make clear that imported data is a snapshot, not a live inventory feed.

PART 9: PRODUCT RECIPE MANAGEMENT
Create a section titled:

🔗 Connect Your Products to Inventory

The application must know how much inventory is required to produce each product.

For example:

Coffee
20 g coffee beans

200 mL milk

1 coffee cup

Latte
20 g coffee beans

300 mL milk

1 coffee cup

Muffin
100 g flour

30 g sugar

Allow users to:

Select a product.

Select required inventory items.

Enter quantity required per product.

Save the recipe.

Edit or delete recipe entries.

Support manual recipe entry.

Also support optional CSV or Excel recipe uploads.

Provide a downloadable recipe template.

Example:

Product	Inventory Item	Quantity Required	Unit
Coffee	Coffee Beans	20	g
Coffee	Milk	200	mL
Coffee	Coffee Cups	1	pieces
Latte	Milk	300	mL
If the uploaded spreadsheet references unknown products or ingredients, ask the user to resolve the mappings.

Never invent missing recipes.

Clearly distinguish products with complete recipes from products whose inventory requirements are unknown.

PART 10: AUTOMATIC PRODUCT COSTING
Create a section titled:

🧾 Know Your Product Costs

If inventory purchase costs are available, calculate direct material costs for each product.

Formula:

Material Cost Per Product = Sum of (Quantity of Each Ingredient Required × Cost Per Compatible Unit)

For example:

Ingredient	Quantity	Cost
Coffee Beans	20 g	$0.60
Milk	200 mL	$0.40
Coffee Cup	1 piece	$0.15
Total Direct Material Cost	
$1.15
Allow users to enter additional variable costs such as:

Variable labour

Packaging

Payment processing fees

Other variable expenses

Prevent double-counting by using a consistent cost structure.

When itemized costing is enabled:

Variable Cost Per Unit = Direct Materials + Other Variable Costs Per Unit

If users prefer to enter one total variable cost manually, allow that instead.

Never add calculated material costs to a manually entered total variable cost unless the user explicitly confirms that materials were excluded.

Clearly label estimated costs and missing cost information.

If ingredient purchase costs are unavailable, do not treat them as zero unless the user explicitly enters zero.

PART 11: INVENTORY & SALES ESTIMATOR
Create a section titled:

📦 How Much Can You Produce?

The purpose is to estimate production capacity using current inventory.

For a single product:

Maximum Units From Each Inventory Item = Available Quantity ÷ Quantity Required Per Product

Round DOWN to whole units.

Overall Maximum Units = Minimum Across All Required Inventory Items

For example:

Inventory	Available	Required per Coffee	Maximum Coffees
Coffee Beans	2000 g	20 g	100
Milk	5000 mL	200 mL	25
Coffee Cups	100 pieces	1 piece	100
Result:

Maximum Production: 25 Coffees

Limiting Inventory: Milk

For multiple products sharing inventory, do not calculate capacities independently and add them.

Instead, evaluate their combined inventory requirements.

For each inventory item:

Required Quantity = Sum of (Planned Product Units × Quantity Required Per Product)

Remaining Inventory = Available Quantity − Required Quantity

Shortage = MAX(0, Required Quantity − Available Quantity)

Display:

Planned production

Available inventory

Inventory required

Remaining inventory

Shortages

Limiting resources

If a proposed plan is infeasible, display a warning.

Do not present infeasible production as achievable sales.

PART 12: PRODUCTION PLANNER
Create an interactive feature titled:

🏆 What Should I Produce More Of?

Subtitle:

"Discover which products make the best use of your limited inventory."

This is one of the application's main features.

12.1 Contribution Margin Per Constrained Resource
For each product:

Contribution Margin Per Unit = Selling Price − Variable Cost Per Unit

Contribution Margin Per Unit of Scarce Resource = Contribution Margin Per Unit ÷ Scarce Resource Used Per Product

Example:

Coffee:

Selling price: $6

Variable cost: $2

Contribution margin: $4

Milk used: 200 mL

Latte:

Selling price: $8

Variable cost: $3

Contribution margin: $5

Milk used: 300 mL

Contribution per litre of milk:

Coffee = $20

Latte = approximately $16.67

The app should explain:

"Coffee generates more contribution margin per litre of milk than latte. If milk is the only limiting resource, prioritizing coffee may generate more contribution, subject to customer demand and other constraints."

Include a bar chart comparing products.

12.2 Production Plan Simulator
Allow users to adjust planned production quantities.

For each change, automatically update:

Inventory consumption

Inventory shortages

Revenue

Variable costs

Contribution margin

Operating profit

Display the original plan beside the modified plan.

Users should be able to experiment without permanently changing the original information.

12.3 Important Optimization Rules
Never claim that the product with the highest contribution margin per unit is automatically the best product to prioritize.

When one resource is limiting, the contribution per unit of that resource can guide decisions.

When multiple resources are constrained, simple rankings may not produce the best overall result.

For the initial application, focus on accurate scenario comparisons.

If a mathematically verified optimization algorithm is added, it must:

Maximize total contribution margin.

Respect all relevant inventory constraints.

Respect expected customer demand.

Use whole-number product quantities.

Prevent shared inventory from being allocated twice.

Report whether a solution is proven optimal or merely suggested.

Do not describe a heuristic as mathematically optimal.

PART 13: INVENTORY ALERTS
Create a visual inventory warning system.

Statuses:

🟢 Sufficient Stock

🟡 Low Stock

🔴 Inventory Shortage

Base these statuses on the planned production requirements.

Show inventory shortages clearly.

For example:

"Your current inventory is insufficient to produce the planned quantity of lattes."

"An additional 15 litres of milk would be required."

Allow users to explore what happens when they increase inventory quantities.

Inventory purchases should not automatically reduce operating profit unless the model explicitly incorporates the relevant expense or cost-of-goods-sold treatment.

Avoid confusing cash spent purchasing inventory with the accounting expense recognized when that inventory is sold.

PART 14: BUSINESS CHALLENGE MODE
Create a fun educational section titled:

🎮 Can You Save Your Business?

The purpose is to help users learn business decision-making through fictional scenarios.

Include three challenge levels:

Beginner
A business is operating at a loss.

The user must change prices, costs, or sales assumptions to reach break-even.

Intermediate
A business wants to achieve a target profit.

The user must determine an appropriate pricing and sales strategy.

Expert
A business has limited inventory and multiple products.

The user must choose a feasible production plan that improves profitability.

Each challenge should display:

Business background

Starting financial information

Objective

Editable decision variables

Current results

Updated results

Success conditions

Example:

"Your coffee shop is losing $400 per month. Can you reach a monthly operating profit of $200?"

Allow users to try different decisions.

Display encouraging messages when goals are achieved.

Do not award success for impossible production plans or invalid inputs.

Use clearly defined success conditions.

All challenge data must be fictional.

Keep challenge mode separate from the user's saved business information.

PART 15: SURPRISE BUSINESS EVENTS
Add a button:

🎲 Surprise Me!

Generate one of several predefined fictional business events.

Examples:

Supplier Price Increase
Variable costs increase by 15%.

Rent Increase
Monthly fixed costs increase by $300.

Higher Customer Demand
Expected sales increase by 20%.

Lower Customer Demand
Expected sales decrease by 20%.

Inventory Shortage
Available quantity of one inventory item decreases by 25%.

Show:

The event.

The financial impact.

How the user can respond.

The updated profit projection.

Allow users to accept, modify, or reset the event.

Clearly label these as hypothetical scenarios rather than real forecasts.

PART 16: BUSINESS REPORT GENERATOR
Create a section titled:

📊 My Business Report

Include a button:

📥 Download My Business Report

Allow users to generate a professional PDF report directly in the browser.

The report should contain:

Business name and category.

Date generated.

Product list.

Product selling prices.

Expected monthly sales.

Product variable costs.

Total revenue.

Total contribution margin.

Monthly fixed costs.

Projected operating profit.

Break-even analysis.

Inventory summary.

Inventory shortages.

Production planning results.

Scenario comparison, if applicable.

Accounting assumptions and limitations.

Include charts where practical.

Use a clean, professional layout.

Avoid cutting tables or charts across pages unnecessarily.

Clearly distinguish expected sales forecasts from actual transactions.

All monetary amounts should be labelled CAD.

PART 17: USER-FRIENDLY FEATURES
Include:

Editable financial inputs

Clear field labels

Helpful tooltips

Add/delete buttons

Reset functionality

Scenario comparisons

Responsive charts

Confirmation prompts before deleting important data

Keyboard-accessible controls

Clear validation messages

Helpful empty states

Include a small educational feature:

📚 Understand Your Numbers

Explain:

Revenue

Fixed Costs

Variable Costs

Contribution Margin

Break-Even Point

Margin of Safety

Operating Profit

Inventory Turnover

Limiting Factors

Contribution Margin per Constrained Resource

Keep definitions concise.

Do not display inventory turnover unless the required beginning and ending inventory values and cost-of-goods-sold information are available.

PART 18: FINANCIAL ACCURACY REQUIREMENTS
Financial accuracy is extremely important.

Implement all accounting calculations in reusable, independently testable functions.

Use consistent monetary rounding and appropriately precise intermediate calculations.

Do not allow:

Division by zero

NaN results

Infinity results

Negative inventory quantities

Invalid selling prices

Misleading break-even calculations

Double-counting inventory

Double-counting material costs

Infeasible production plans being treated as achievable

Confusion between contribution margin and operating profit

Assumptions being silently changed

Handle zero sales and zero prices appropriately.

Use whole units for discrete products.

Use consistent inventory measurement units.

Clearly communicate assumptions.

The application must distinguish:

Expected Profit: Based on projected customer demand.

Inventory-Constrained Profit: Based on the feasible quantity that can be sold given inventory restrictions.

Scenario Profit: Based on modified assumptions entered by the user.

These should not be mixed together without explanation.

If production exceeds expected customer demand, do not automatically count unsold products as revenue.

PART 19: TECHNICAL REQUIREMENTS
Use the existing project framework where practical.

Preferred technology stack:

React

TypeScript

Vite

Tailwind CSS

Recharts

A maintained browser-compatible Excel/CSV parsing library

A browser-compatible PDF generation library

Requirements:

No backend required.

No database required.

No user accounts.

No API keys.

No payment functionality.

No external AI API required.

No confidential information sent to a server.

Deployable through GitHub and Vercel.

Keep the code modular.

Suggested modules:

Business management

Product management

Financial calculations

Pricing scenarios

Inventory import

Inventory validation

Product recipes

Product costing

Production planning

Challenge mode

Report generation

Avoid unnecessary dependencies.

Optimize the website for responsiveness and reliability.

PART 20: TESTING AND INDEPENDENT VERIFICATION
Create automated tests for all important business calculations.

Include tests for:

Financial Calculations
One-product profitability

Multi-product profitability

Positive operating profit

Operating losses

Contribution margin calculations

Break-even calculations

Zero sales

Zero fixed costs

Invalid inputs

Price changes

Profit targets

Inventory
Excel import

CSV import

Incorrect column mappings

Missing values

Duplicate inventory

Negative quantities

Unit conversions

Product recipe mapping

Shared inventory

Inventory shortages

Zero inventory

Multiple limiting resources

Production Planning
Single-product production

Multi-product production

Insufficient inventory

Demand limits

Contribution per scarce resource

Feasible production plans

Infeasible production plans

Changes to production quantities

Profit changes from production decisions

User Interactions
Adding products

Deleting products

Resetting scenarios

Uploading files

Editing imported records

Generating reports

Completing business challenges

Required Financial Verification Example
Use this fictional coffee shop:

Product	Price	Variable Cost	Monthly Sales
Coffee	$6	$2	300
Muffin	$4	$1.50	150
Sandwich	$9	$4	100
Cookie	$3	$1	200
Monthly Fixed Costs: $1,500

Expected Results:

Total Revenue: $3,900

Total Variable Costs: $1,425

Total Contribution Margin: $2,475

Monthly Operating Profit: $975

Ensure the application reproduces these results accurately.

Required Inventory Verification Example
Available Inventory:

Coffee beans: 2,000 g

Milk: 5,000 mL

Cups: 100 pieces

One coffee requires:

20 g coffee beans

200 mL milk

1 cup

Expected Maximum Production:

25 coffees

Limiting Resource:

Milk

Also independently verify at least one multi-product scenario involving shared inventory.

Test all calculations without assuming AI-generated answers are automatically correct.

Run the test suite and production build.

Fix identified problems.

Do not claim tests passed unless they actually ran successfully.

PART 21: PROJECT DOCUMENTATION
Create or update README.md.

Include:

Project name.

Problem being solved.

Target users.

Application features.

Main user workflows.

Accounting calculations.

Financial assumptions.

Inventory upload instructions.

Product recipe instructions.

Production planning methodology.

Installation instructions.

Testing instructions.

Known limitations.

AI-assisted development disclosure.

Deployment instructions.

Include a testing table:

Test Case | Input | Expected Result | Actual Result | Pass/Fail

Only populate actual test results using tests that were genuinely performed.

Leave a clearly marked section for real user testing and feedback.

Do not invent user feedback, test observations, or completed improvements.

PART 22: IMPORTANT PROJECT REQUIREMENTS
The application is for an ACCT 4500 group project.

It must demonstrate:

A meaningful business problem.

Interactive functionality.

Accurate accounting logic.

Clear assumptions.

Reliable handling of invalid inputs.

Independent verification of calculations.

Testing and debugging.

A meaningful improvement based on feedback.

Human oversight of AI-assisted development.

Public deployment.

Clear documentation.

The application should be simple enough for a student to explain its important calculations during an oral demonstration.

All sample business information should be fictional.

Avoid collecting real confidential financial information.

Clearly communicate that the application is an educational decision-support tool and that results depend on user assumptions.

PART 23: DEVELOPMENT PRIORITIES
Because the application must remain manageable, build it in phases.

PHASE 1 — Essential Business Functions
Complete:

Business selection

Multi-product management

Revenue and cost calculations

Profit dashboard

Break-even analysis

Basic what-if pricing simulator

PHASE 2 — Inventory Integration
Complete:

Excel and CSV import

Inventory templates

Editable inventory records

Product recipe mapping

Product costing

Inventory shortage calculations

PHASE 3 — Production Planning
Complete:

Production capacity calculations

Shared inventory consumption

Contribution margin per constrained resource

Interactive production planning

Inventory-constrained profit forecasts

PHASE 4 — Interactive Enhancements
Add:

Smart Pricing Assistant

Profit Goal Tracker

Business Challenge Mode

Surprise Business Events

Scenario comparison charts

PHASE 5 — Final Polish
Complete:

PDF business reports

Responsive mobile design

Input validation

Automated testing

Documentation

Production build

Prioritize correctness over adding more features.

If the existing application already contains a feature, improve or integrate it rather than creating a duplicate.

Keep the core application usable throughout development.

FINAL INSTRUCTIONS TO CODEX
Please now:

Inspect the existing project files.

Identify which features already exist.

Identify which features need to be added or updated.

Preserve the existing design and functionality.

Implement the application incrementally.

Use shared data and accounting calculation modules.

Ensure inventory and financial information remain synchronized.

Validate uploaded inventory before accepting it.

Prevent double-counting of inventory and costs.

Implement reliable production planning calculations.

Add interactive charts and scenario tools.

Add automated accounting tests.

Run the tests and production build.

Correct errors introduced by development.

Update README.md.

Explain how to preview and deploy the finished website.

Do not stop after providing a plan. Implement the code in the available workspace.

If the workspace does not contain an existing application, create the project using the preferred technology stack.

If it does contain the existing Price It Right website, extend it rather than replacing it unnecessarily.

If a feature is too complex to implement reliably, prioritize a simpler, accurate version and clearly document the limitation.

FINAL VISION
Price It Right should help small-business owners answer five questions:

How much money am I making from my products?

What price should I charge to achieve my financial goals?

Do I have enough inventory to meet customer demand?

Which products make the best use of my limited resources?

How will changes in prices, costs, inventory, or demand affect my business?

The final product should combine the accuracy of an accounting calculator, the usefulness of a business management tool, and the interactivity of a business simulation game.

Make it visually appealing, genuinely functional, financially accurate, and easy for beginners to understand.