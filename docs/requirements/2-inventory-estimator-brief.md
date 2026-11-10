Update Existing Application: Price It Right
I already have a working web application called "Price It Right – Small Business Pricing Simulator."

I want to add one new feature to the existing application without changing or removing any of its current features, calculations, or design.

NEW FEATURE: Inventory & Sales Estimator
Add a new section at the very bottom of the application called:

📦 Inventory & Sales Estimator

Subtitle: "Find out how many products you can sell with the inventory you have!"

1. Purpose
This feature will help small-business owners estimate how many finished products they can produce and sell based on their available inventory.

It should also calculate potential revenue and profit based on their inventory limitations.

The estimator should work for different business categories, including coffee shops, bakeries, nail salons, clothing stores, and custom businesses.

2. Inventory Inputs
Allow users to enter:

Inventory item name (e.g., coffee beans, milk, cups).

Quantity currently available.

Quantity required to produce one finished product.

Unit of measurement (grams, kilograms, millilitres, litres, pieces, etc.).

Users should be able to add multiple inventory items using an "+ Add Inventory Item" button.

Users should also be able to edit or remove items.

For example, a coffee shop might enter:

Inventory Item	Available Quantity	Required Per Coffee
Coffee beans	2,000 g	20 g
Milk	5,000 mL	200 mL
Coffee cups	100 pieces	1 piece
Use consistent units for each item, with automatic conversion between compatible units where appropriate (e.g., kg to g and L to mL).

3. Calculate Maximum Products
The application should calculate how many complete products can be produced using the available inventory.

Formula:

Maximum Products From Each Item = Available Quantity ÷ Quantity Required Per Product

Round DOWN to the nearest whole number.

The maximum number of products that can be produced overall is the LOWEST result among all required inventory items.

Example:

Coffee beans: 2,000 ÷ 20 = 100 coffees

Milk: 5,000 ÷ 200 = 25 coffees

Coffee cups: 100 ÷ 1 = 100 coffees

Maximum Production = 25 coffees

The application should explain:

"Based on your current inventory, you can produce a maximum of 25 coffees. Milk is your limiting inventory item."

Clearly identify which inventory item is limiting production. If multiple items are tied, show all of them.

4. Sales Estimation
Use the existing selling price and variable cost per unit from the Price It Right calculator.

Display:

Maximum products that can be produced.

Expected products sold.

Maximum potential revenue.

Estimated revenue based on expected sales.

Estimated operating profit or loss.

Limiting inventory item.

The estimated sales volume should be the smaller of:

The maximum number of products that can be produced from inventory.

The expected monthly sales volume entered in the existing calculator.

Formula:

Estimated Sales = MIN(Maximum Production, Expected Monthly Sales)

Maximum Potential Revenue = Maximum Production × Selling Price

Estimated Revenue = Estimated Sales × Selling Price

Estimated Operating Profit = Estimated Sales × (Selling Price − Variable Cost Per Unit) − Monthly Fixed Costs

Make it clear that maximum potential revenue assumes all producible products are sold.

Make it clear that estimated profit assumes the entered variable cost applies to each unit sold and that monthly fixed costs remain unchanged.

5. Results Dashboard
Create attractive result cards displaying:

📦 Maximum Production: 25 products

🛒 Estimated Sales: 25 products

💰 Estimated Revenue: $150

📊 Estimated Operating Profit/Loss: Based on current costs

⚠️ Limiting Inventory: Milk

If the user has enough inventory to satisfy their expected sales, display:

"Great! Your current inventory is sufficient to meet your expected sales volume."

If inventory is insufficient, display:

"Your inventory may limit your sales. Consider replenishing your limiting inventory item."

Do not automatically recommend purchasing inventory without considering demand or costs.

6. Inventory Shortage Calculator
Add an additional feature that identifies how much inventory is needed to meet expected monthly sales.

For each inventory item:

Required Inventory = Expected Sales Volume × Quantity Required Per Product

Shortage = MAX(0, Required Inventory − Available Inventory)

Example:

Expected sales: 100 coffees

Milk required per coffee: 200 mL

Total milk required: 20,000 mL

Available milk: 5,000 mL

Shortage: 15,000 mL

Display:

"To meet your expected sales of 100 coffees, you would need an additional 15 litres of milk."

If inventory is sufficient, show no shortage.

7. User Experience and Design
Follow the existing application's design system.

Use the same colours, fonts, and styling.

Create clean inventory input rows.

Include an "Add Inventory Item" button.

Add helpful tooltips.

Display results immediately after calculation.

Make the feature mobile-friendly.

Provide a "Reset Inventory" button.

Ensure the new section visually matches the rest of Price It Right.

8. Input Validation
Handle the following cases:

Negative quantities.

Zero quantity required per product.

Missing inventory names.

Empty input fields.

Invalid or nonnumeric values.

Incompatible measurement units.

No inventory items entered.

Very large numbers.

Show understandable error messages rather than displaying incorrect calculations.

Do not calculate a production maximum until at least one valid required inventory item has been entered.

9. Accounting and Business Accuracy
Ensure the calculations are mathematically correct.

Use the existing accounting logic wherever possible.

The inventory estimator should automatically update if the user changes:

Selling price.

Variable cost per unit.

Expected sales volume.

Monthly fixed costs.

Clearly distinguish between:

Maximum production capacity based on materials.

Expected customer demand.

Estimated actual sales.

Estimated operating profit.

Do not assume that everything produced will automatically sell.

For service businesses such as nail salons, explain that the result represents the number of services that can be completed based on available consumable supplies. It does not account for staff availability or appointment capacity.

For clothing stores, inventory can be entered as finished products, with one unit of inventory required per item sold.

10. Testing
Create automated tests for the inventory calculations.

Test at least:

Sufficient inventory.

Insufficient inventory.

Multiple inventory items.

Two items tied as limiting factors.

Zero available inventory.

Invalid quantities.

Unit conversions.

Expected sales lower than production capacity.

Expected sales higher than production capacity.

Updates to selling price and costs.

Verify that the original pricing calculator, what-if simulator, and financial charts still work correctly.

11. Development Instructions
IMPORTANT:

This is an update to an EXISTING application.

Do not rebuild the website from scratch.

Do not remove or redesign existing features.

Inspect the current project structure and follow its existing coding conventions.

Add the new inventory estimator as a separate component or module.

Reuse existing business data, pricing inputs, accounting formulas, and design elements where appropriate.

Make sure the entire application remains responsive and functional.

Run the available tests and production build.

Fix any errors introduced by this change.

Update the README to explain the inventory estimator, its formulas, assumptions, and limitations.

Do not invent test results or user feedback.

Final Goal: Add a functional, visually appealing Inventory & Sales Estimator that helps small-business owners understand how inventory availability affects production capacity, potential sales, revenue, and profitability while preserving the existing Price It Right application.

