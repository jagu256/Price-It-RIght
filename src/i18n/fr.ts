/**
 * THE French dictionary – every on-screen text in one place.
 *
 * Key   = the English text exactly as written in the code (with {placeholders}).
 * Value = the French text (same {placeholders}).
 *
 * Accounting terms used throughout (Canadian French):
 *   contribution margin (CM)   → marge sur coûts variables (MCV)
 *   break-even point           → seuil de rentabilité
 *   margin of safety           → marge de sécurité
 *   operating leverage         → levier d'exploitation
 *   operating profit           → bénéfice d'exploitation
 *   fixed / variable costs     → coûts fixes / coûts variables
 *   sales mix                  → composition des ventes
 *   net income                 → bénéfice net
 *   revenue                    → chiffre d'affaires
 */
export const FR: Record<string, string> = {
  /* ---------- General ---------- */
  '{n} unit': '{n} unité',
  '{n} units': '{n} unités',
  Cancel: 'Annuler',
  'N/A': 'S.O.',
  Optional: 'Facultatif',
  Delete: 'Supprimer',
  Duplicate: 'Dupliquer',
  Actions: 'Actions',
  'Skip to content': 'Aller au contenu',
  Language: 'Langue',
  Sections: 'Sections',
  'My business': 'Mon entreprise',
  'Fictional demo': 'Démo fictive',
  'What is “{label}”?': 'Qu’est-ce que « {label} » ?',
  'Set your price. Know your costs. Maximize your profit.': 'Fixez votre prix. Connaissez vos coûts. Maximisez votre bénéfice.',
  'An educational decision-support tool for an ACCT 4500 group project. Results depend entirely on the assumptions you enter. Example and demo data are fictional and are not industry benchmarks. Not financial advice.':
    'Un outil pédagogique d’aide à la décision créé pour un projet de groupe du cours ACCT 4500. Les résultats dépendent entièrement des hypothèses que vous saisissez. Les données d’exemple et de démonstration sont fictives et ne constituent pas des références sectorielles. Ceci n’est pas un conseil financier.',
  'Everything runs in your browser. Your business is saved on this device only and is never sent anywhere – please don’t enter confidential information.':
    'Tout fonctionne dans votre navigateur. Votre entreprise est enregistrée sur cet appareil seulement et n’est jamais envoyée ailleurs – veuillez ne pas saisir d’information confidentielle.',
  'Built with AI assistance (Claude by Anthropic) and reviewed by the project team.': 'Conçu avec l’aide de l’IA (Claude, d’Anthropic) et révisé par l’équipe du projet.',

  /* ---------- Navigation ---------- */
  'My Business': 'Mon entreprise',
  'Profit Dashboard': 'Tableau de bord',
  'Pricing Lab': 'Labo des prix',
  'Smart Inventory Hub': 'Centre des stocks',
  'Production Planner': 'Planificateur de production',
  Decisions: 'Décisions',
  'Business Challenge': 'Défi d’entreprise',
  'Business Report': 'Rapport d’entreprise',

  /* ---------- Business categories ---------- */
  'Coffee Shop': 'Café',
  'Lattes, drip coffee & cold brew': 'Lattés, café filtre et infusion à froid',
  'cups of coffee': 'tasses de café',
  Bakery: 'Boulangerie-pâtisserie',
  'Cupcakes, loaves & cookies': 'Petits gâteaux, pains et biscuits',
  'baked goods': 'produits de boulangerie',
  'Nail Salon': 'Salon de manucure',
  'Manicures, pedicures & gel sets': 'Manucures, pédicures et poses de gel',
  appointments: 'rendez-vous',
  'Clothing Store': 'Boutique de vêtements',
  'Tees, hoodies & accessories': 'T-shirts, kangourous et accessoires',
  'items of clothing': 'vêtements',
  'Custom Business': 'Entreprise personnalisée',
  'products or services': 'produits ou services',
  'Your own idea – start from a template': 'Votre propre idée – partez d’un modèle',
  Selected: 'Choisie',

  /* ---------- Home ---------- */
  'Choose your business': 'Choisissez votre entreprise',
  'Coffee shop, bakery, nail salon, clothing store or your own idea.': 'Café, boulangerie, salon de manucure, boutique de vêtements ou votre propre idée.',
  'Add your products': 'Ajoutez vos produits',
  'Prices, variable costs and how many you expect to sell each month.': 'Prix, coûts variables et quantités que vous prévoyez vendre chaque mois.',
  'Enter costs or upload inventory': 'Saisissez vos coûts ou importez vos stocks',
  'Type your stock in, or upload an Excel or CSV file.': 'Saisissez vos stocks ou importez un fichier Excel ou CSV.',
  'Discover your profit potential': 'Découvrez votre potentiel de bénéfice',
  'Profit, break-even, pricing scenarios and production plans.': 'Bénéfice, seuil de rentabilité, scénarios de prix et plans de production.',
  'Load the demo business?': 'Charger l’entreprise de démonstration ?',
  'This replaces your current products, costs and inventory with fictional demo data. Your changes will be lost.':
    'Vos produits, coûts et stocks actuels seront remplacés par des données de démonstration fictives. Vos modifications seront perdues.',
  'Load demo': 'Charger la démo',
  'Small Business Pricing, Inventory & Profit Simulator': 'Simulateur de prix, de stocks et de bénéfices pour petites entreprises',
  'Make smarter business decisions with an interactive tool that helps you price products, track inventory, calculate profits, and plan production.':
    'Prenez de meilleures décisions grâce à un outil interactif qui vous aide à fixer vos prix, à suivre vos stocks, à calculer vos bénéfices et à planifier votre production.',
  'Start My Business': 'Démarrer mon entreprise',
  'Try a Demo Business': 'Essayer une entreprise de démo',
  'The demo loads a complete **fictional** café with products, costs, inventory and recipes. No account needed.':
    'La démo charge un café **fictif** complet, avec ses produits, ses coûts, ses stocks et ses recettes. Aucun compte requis.',
  'How it works': 'Comment ça fonctionne',
  Coffee: 'Café',
  Muffin: 'Muffin',
  Sandwich: 'Sandwich',
  Cookie: 'Biscuit',
  'This month · fictional café': 'Ce mois-ci · café fictif',
  'Contribution margin': 'Marge sur coûts variables',
  'Fixed costs': 'Coûts fixes',
  'Operating profit': 'Bénéfice d’exploitation',
  'Milk is your limiting item': 'Le lait est votre facteur limitant',

  /* ---------- Glossary ---------- */
  Learn: 'Apprendre',
  'Understand Your Numbers': 'Comprendre vos chiffres',
  'The ideas behind every result in this app, in plain language.': 'Les notions derrière chaque résultat de l’application, en langage simple.',
  Revenue: 'Chiffre d’affaires',
  'Selling price × units sold': 'Prix de vente × unités vendues',
  'All the money that comes in from customers before any costs are taken out.': 'Tout l’argent reçu des clients, avant de déduire les coûts.',
  'Fixed Costs': 'Coûts fixes',
  'Same total each month': 'Même total chaque mois',
  'Costs that generally stay the same within the relevant activity range, like rent, insurance or software.':
    'Coûts qui restent généralement les mêmes à l’intérieur du seuil d’activité pertinent, comme le loyer, les assurances ou les logiciels.',
  'Variable Costs': 'Coûts variables',
  'Variable cost per unit × units sold': 'Coût variable unitaire × unités vendues',
  'Costs that rise and fall with each sale – ingredients, packaging, payment fees.': 'Coûts qui augmentent ou diminuent avec chaque vente – ingrédients, emballage, frais de paiement.',
  'Contribution Margin': 'Marge sur coûts variables',
  'Selling price − variable cost per unit': 'Prix de vente − coût variable unitaire',
  'What each sale has left to “contribute” toward fixed costs. It is not profit until fixed costs are covered.':
    'Ce qu’il reste de chaque vente pour « contribuer » aux coûts fixes. Ce n’est pas un bénéfice tant que les coûts fixes ne sont pas couverts.',
  'Break-Even Point': 'Seuil de rentabilité',
  'Fixed costs ÷ contribution margin per unit': 'Coûts fixes ÷ marge sur coûts variables unitaire',
  'The sales level where revenue equals total costs. With several products it depends on the sales mix.':
    'Le niveau de ventes où le chiffre d’affaires égale les coûts totaux. Avec plusieurs produits, il dépend de la composition des ventes.',
  'Margin of Safety': 'Marge de sécurité',
  'Expected revenue − break-even revenue': 'Chiffre d’affaires prévu − chiffre d’affaires au seuil de rentabilité',
  'How much sales could fall before the business starts losing money.': 'De combien les ventes pourraient baisser avant que l’entreprise commence à perdre de l’argent.',
  'Operating Profit': 'Bénéfice d’exploitation',
  'Total contribution margin − fixed costs': 'Marge sur coûts variables totale − coûts fixes',
  'Profit from running the business. Not net income: taxes, interest and other items are not included.':
    'Le bénéfice tiré de l’exploitation. Ce n’est pas le bénéfice net : les impôts, les intérêts et les autres éléments ne sont pas inclus.',
  'Inventory Turnover': 'Rotation des stocks',
  'Cost of goods sold ÷ average inventory': 'Coût des marchandises vendues ÷ stock moyen',
  'How many times stock is used and replaced in a period. This app does not calculate it, because it needs beginning and ending inventory values and cost-of-goods-sold records.':
    'Le nombre de fois que le stock est utilisé et renouvelé au cours d’une période. L’application ne la calcule pas, car il faudrait la valeur des stocks au début et à la fin de la période ainsi que le coût des marchandises vendues.',
  'Limiting Factors': 'Facteurs limitants',
  'The resource that runs out first': 'La ressource qui s’épuise en premier',
  'A scarce input – like milk or butter – that caps how much you can produce, no matter the demand.':
    'Un intrant rare – comme le lait ou le beurre – qui limite la quantité que vous pouvez produire, peu importe la demande.',
  'CM per Constrained Resource': 'MCV par unité de ressource limitée',
  'CM per unit ÷ scarce resource used': 'MCV unitaire ÷ ressource rare utilisée',
  'When one input is scarce, products that earn more contribution per unit of that input use it best.':
    'Quand un intrant est rare, les produits qui rapportent le plus de marge par unité de cet intrant l’utilisent le mieux.',

  /* ---------- My Business ---------- */
  'Switch to the {name} example?': 'Passer à l’exemple « {name} » ?',
  'This replaces your current products, fixed costs, inventory and recipes with fictional example data. Your changes will be lost.':
    'Vos produits, coûts fixes, stocks et recettes actuels seront remplacés par des données d’exemple fictives. Vos modifications seront perdues.',
  'Replace my work': 'Remplacer mon travail',
  'Choose a business, then add your products and monthly fixed costs.': 'Choisissez une entreprise, puis ajoutez vos produits et vos coûts fixes mensuels.',
  'Each category loads **fictional example** products, costs and inventory – not real market averages. You can change every value.':
    'Chaque catégorie charge des produits, des coûts et des stocks **fictifs, à titre d’exemple** – pas de vraies moyennes du marché. Vous pouvez modifier chaque valeur.',
  'You are using the fictional demo business': 'Vous utilisez l’entreprise de démonstration fictive',
  'Maple Leaf Café is invented for learning. Pick a category above to start your own.': 'Le Café Feuille d’érable est inventé à des fins d’apprentissage. Choisissez une catégorie ci-dessus pour commencer la vôtre.',
  'Business details': 'Renseignements sur l’entreprise',
  'Business name': 'Nom de l’entreprise',
  'Shown on your dashboard and report.': 'Affiché dans votre tableau de bord et votre rapport.',
  'Monthly fixed costs (whole business)': 'Coûts fixes mensuels (toute l’entreprise)',
  'Monthly fixed costs': 'Coûts fixes mensuels',
  'Rent, insurance, software, salaried wages – costs that stay about the same each month whatever you sell. Entered once for the whole business, never per product.':
    'Loyer, assurances, logiciels, salaires fixes – des coûts qui restent à peu près les mêmes chaque mois, peu importe ce que vous vendez. Saisis une seule fois pour toute l’entreprise, jamais par produit.',
  'All amounts are in Canadian dollars (CAD).': 'Tous les montants sont en dollars canadiens ($ CA).',
  'per month': 'par mois',

  /* ---------- Products ---------- */
  'Original order': 'Ordre d’origine',
  'Highest revenue': 'Chiffre d’affaires le plus élevé',
  'Highest total contribution margin': 'Marge sur coûts variables totale la plus élevée',
  'Highest contribution margin per unit': 'Marge sur coûts variables unitaire la plus élevée',
  'Highest sales volume': 'Volume de ventes le plus élevé',
  'Delete “{name}”?': 'Supprimer « {name} » ?',
  'this product': 'ce produit',
  'Its recipe will be deleted too. This cannot be undone.': 'Sa recette sera aussi supprimée. Cette action est irréversible.',
  'Delete product': 'Supprimer le produit',
  'My Product Collection': 'Ma collection de produits',
  'Manage your products and see how each one contributes to your business.': 'Gérez vos produits et voyez comment chacun contribue à votre entreprise.',
  'Sort by': 'Trier par',
  'Products with expected monthly sales and contribution margins': 'Produits avec leurs ventes mensuelles prévues et leurs marges sur coûts variables',
  Product: 'Produit',
  Category: 'Catégorie',
  'Price / unit': 'Prix / unité',
  'Variable cost / unit': 'Coût variable / unité',
  'Expected sales / month': 'Ventes prévues / mois',
  'Total variable costs': 'Coûts variables totaux',
  'CM / unit': 'MCV / unité',
  'Total CM': 'MCV totale',
  'CM ratio': 'Ratio de MCV',
  'Totals (before fixed costs)': 'Totaux (avant les coûts fixes)',
  'No products yet. Add your first product to get started.': 'Aucun produit pour l’instant. Ajoutez votre premier produit pour commencer.',
  'Add a product': 'Ajouter un produit',
  'Contribution margin is not profit. Fixed costs belong to the whole business and are subtracted once, on the 💰 Profit Dashboard – never from each product.':
    'La marge sur coûts variables n’est pas un bénéfice. Les coûts fixes appartiennent à toute l’entreprise et sont soustraits une seule fois, dans le 💰 Tableau de bord – jamais de chaque produit.',
  'new product': 'nouveau produit',
  'Product name ({label})': 'Nom du produit ({label})',
  'Category for {label}': 'Catégorie de {label}',
  'Selling price per unit for {label}': 'Prix de vente unitaire de {label}',
  'Itemized cost': 'Coût détaillé',
  'Variable cost per unit for {label}': 'Coût variable unitaire de {label}',
  'Expected monthly sales for {label}': 'Ventes mensuelles prévues de {label}',
  'Duplicate {label}': 'Dupliquer {label}',
  'Delete {label}': 'Supprimer {label}',

  /* ---------- Save my work ---------- */
  'Saved a copy as {name}. Keep the file somewhere safe – you can import it later on any device.':
    'Copie enregistrée sous {name}. Conservez ce fichier en lieu sûr – vous pourrez l’importer plus tard sur n’importe quel appareil.',
  'This file is too large to be a Price It Right save file (limit 1 MB).': 'Ce fichier est trop volumineux pour être une sauvegarde Price It Right (limite de 1 Mo).',
  'Unnamed business': 'Entreprise sans nom',
  'Replace your current business with “{name}”?': 'Remplacer votre entreprise actuelle par « {name} » ?',
  'The file contains {products}, {items} and {recipes}.': 'Le fichier contient {products}, {items} et {recipes}.',
  'This replaces the products, fixed costs, inventory and recipes you have now. Export your current business first if you want to keep it.':
    'Vos produits, coûts fixes, stocks et recettes actuels seront remplacés. Exportez d’abord votre entreprise actuelle si vous voulez la conserver.',
  'Imported “{name}” from {file}.': '« {name} » importée depuis {file}.',
  'This file could not be read. Please choose a file made with “Export my business”.': 'Ce fichier n’a pas pu être lu. Choisissez un fichier créé avec « Exporter mon entreprise ».',
  'Start fresh?': 'Repartir à zéro ?',
  'This removes the business saved on this device and loads the fictional Coffee Shop example again. Your products, fixed costs, inventory and recipes will be lost unless you export them first.':
    'L’entreprise enregistrée sur cet appareil sera supprimée et l’exemple fictif du café sera rechargé. Vos produits, coûts fixes, stocks et recettes seront perdus si vous ne les exportez pas d’abord.',
  'Start fresh': 'Repartir à zéro',
  'Started fresh with the fictional Coffee Shop example.': 'Nouveau départ avec l’exemple fictif du café.',
  'Save my work': 'Enregistrer mon travail',
  'Your business is saved automatically in this browser, and you can keep a copy as a file.': 'Votre entreprise est enregistrée automatiquement dans ce navigateur, et vous pouvez en garder une copie dans un fichier.',
  'Saving is off': 'L’enregistrement est désactivé',
  'This browser is blocking storage (this can happen in private browsing), so your work will be lost when you close or refresh the page. Everything else still works. Use “Export my business” to keep a copy.':
    'Ce navigateur bloque le stockage (cela peut arriver en navigation privée) : votre travail sera perdu si vous fermez ou actualisez la page. Tout le reste fonctionne. Utilisez « Exporter mon entreprise » pour en garder une copie.',
  'Auto-save is on': 'L’enregistrement automatique est activé',
  'Saved on this device. Every change is saved as you type, and your business will be here when you come back.':
    'Enregistré sur cet appareil. Chaque modification est enregistrée pendant que vous tapez, et votre entreprise sera là à votre retour.',
  'You are looking at an unchanged fictional example, so there is nothing to save yet. Your work is saved as soon as you change something.':
    'Vous consultez un exemple fictif non modifié : il n’y a rien à enregistrer pour l’instant. Votre travail est enregistré dès que vous modifiez quelque chose.',
  'Welcome back – the business you saved on this device was restored.': 'Bon retour – l’entreprise enregistrée sur cet appareil a été restaurée.',
  'A saved business was found on this device but it could not be read, so the Coffee Shop example was loaded instead.':
    'Une entreprise enregistrée a été trouvée sur cet appareil, mais elle n’a pas pu être lue : l’exemple du café a donc été chargé.',
  'Export my business (backup file)': 'Exporter mon entreprise (fichier de sauvegarde)',
  'Import a saved business': 'Importer une entreprise sauvegardée',
  'Choose a saved business file': 'Choisir un fichier de sauvegarde',
  'The backup is a Price It Right file (.json) for “Import a saved business” – it isn’t meant to be opened, and your computer may show it as a code file. It is not a spreadsheet – for that, use':
    'La sauvegarde est un fichier Price It Right (.json) destiné à « Importer une entreprise sauvegardée » – il n’est pas fait pour être ouvert, et votre ordinateur peut l’afficher comme un fichier de code. Ce n’est pas un chiffrier – pour cela, utilisez',
  'Business Report → Download my business as Excel': 'Rapport d’entreprise → Télécharger mon entreprise en format Excel',
  'This file was not imported – your current business is unchanged': 'Ce fichier n’a pas été importé – votre entreprise actuelle est inchangée',
  '**🔒 Privacy:** your data stays on this device only. It is stored in this browser and in any file you export – nothing is sent to a server, and there are no accounts. Anyone who uses this browser on this device can see it, so use “Start fresh” on a shared computer. Clearing your browser data also removes it. Pricing Lab and Production Planner experiments and challenge progress are not saved.':
    '**🔒 Confidentialité :** vos données restent sur cet appareil seulement. Elles sont conservées dans ce navigateur et dans les fichiers que vous exportez – rien n’est envoyé à un serveur, et il n’y a aucun compte. Toute personne qui utilise ce navigateur sur cet appareil peut les voir : utilisez « Repartir à zéro » sur un ordinateur partagé. Effacer les données du navigateur les supprime aussi. Les essais du Labo des prix et du Planificateur de production ainsi que la progression des défis ne sont pas enregistrés.',
  '{n} product': '{n} produit',
  '{n} products': '{n} produits',
  '{n} inventory item': '{n} article en stock',
  '{n} inventory items': '{n} articles en stock',
  '{n} recipe': '{n} recette',
  '{n} recipes': '{n} recettes',

  /* ---------- Save file checks ---------- */
  name: 'nom',
  category: 'catégorie',
  price: 'prix',
  'variable cost': 'coût variable',
  units: 'unités',
  'This file is empty.': 'Ce fichier est vide.',
  'This file could not be read. It is not a valid Price It Right save file (.json) or it has been damaged.':
    'Ce fichier n’a pas pu être lu. Ce n’est pas une sauvegarde Price It Right (.json) valide, ou il a été endommagé.',
  'This is not a Price It Right save file. Choose a file made with “Export my business”.': 'Ce n’est pas une sauvegarde Price It Right. Choisissez un fichier créé avec « Exporter mon entreprise ».',
  'This save file has no valid version number, so it can’t be read safely.': 'Cette sauvegarde n’a pas de numéro de version valide : elle ne peut pas être lue en toute sécurité.',
  'This save file was made by a newer version of Price It Right (file version {version}; this app reads up to version {max}).':
    'Cette sauvegarde a été créée par une version plus récente de Price It Right (version du fichier : {version}; cette application lit jusqu’à la version {max}).',
  'The save file has no business in it.': 'La sauvegarde ne contient aucune entreprise.',
  'The business category is missing or not recognised.': 'La catégorie d’entreprise est absente ou non reconnue.',
  'The business name is missing or too long.': 'Le nom de l’entreprise est absent ou trop long.',
  'The “fictional demo” marker is missing.': 'L’indicateur « démo fictive » est absent.',
  'Monthly fixed costs are missing.': 'Les coûts fixes mensuels sont absents.',
  'The product list is missing.': 'La liste des produits est absente.',
  'The file has {count} products; the limit is {max}.': 'Le fichier contient {count} produits; la limite est de {max}.',
  'Product {n}': 'Produit {n}',
  '{where} is not a valid product.': '{where} n’est pas un produit valide.',
  '{where} has no internal id.': '{where} n’a pas d’identifiant interne.',
  '{where} repeats the internal id of another product.': '{where} reprend l’identifiant interne d’un autre produit.',
  '{where} is missing: {fields}.': '{where} : éléments manquants – {fields}.',
  '{where} has an unknown costing method.': '{where} a une méthode d’établissement du coût inconnue.',
  '{where} has missing “other variable costs”.': '{where} : les « autres coûts variables » sont manquants.',
  'The inventory list is missing.': 'La liste des stocks est absente.',
  'The file has {count} inventory items; the limit is {max}.': 'Le fichier contient {count} articles en stock; la limite est de {max}.',
  'Inventory item {n}': 'Article en stock {n}',
  '{where} is not a valid item.': '{where} n’est pas un article valide.',
  '{where} repeats the internal id of another item.': '{where} reprend l’identifiant interne d’un autre article.',
  '{where} is missing its name, quantity or cost.': '{where} : il manque le nom, la quantité ou le coût.',
  '{where} has an unknown unit (allowed: g, kg, mL, L, pcs).': '{where} a une unité inconnue (unités permises : g, kg, mL, L, pcs).',
  'The recipe list is missing.': 'La liste des recettes est absente.',
  'A recipe belongs to a product that is not in the file.': 'Une recette appartient à un produit qui ne figure pas dans le fichier.',
  'a product': 'un produit',
  'The recipe for {name} is not valid.': 'La recette de {name} n’est pas valide.',
  'The recipe for {name} has a line that is not valid.': 'La recette de {name} contient une ligne non valide.',
  '…and {n} more problems.': '…et {n} autres problèmes.',

  /* ---------- Input checks ---------- */
  'selling price': 'prix de vente',
  'fixed costs': 'coûts fixes',
  'sales volume': 'volume des ventes',
  'Please check the comma – in French, use it only as the decimal separator, like 6,50.': 'Vérifiez la virgule – en français, utilisez-la seulement comme séparateur décimal, par exemple 6,50.',
  'Please check the commas – use them only as thousands separators, like 1,500.': 'Vérifiez les virgules – utilisez-les seulement comme séparateurs de milliers, par exemple 1,500.',
  'Please enter the {name}.': 'Veuillez entrer une valeur pour « {name} ».',
  "The {name} can't be negative. Please enter 0 or more.": 'La valeur de « {name} » ne peut pas être négative. Entrez 0 ou plus.',
  'Please use numbers only, for example 6 or 6.50.': 'Utilisez seulement des chiffres, par exemple 6 ou 6,50.',
  'Please use no more than 2 decimal places (dollars and cents).': 'Utilisez au plus 2 décimales (dollars et cents).',
  'That number is larger than this simulator supports (max $1,000,000,000).': 'Ce nombre dépasse la limite du simulateur (maximum : 1 000 000 000 $).',
  'Please enter your expected monthly sales volume.': 'Veuillez entrer votre volume de ventes mensuel prévu.',
  "Sales volume can't be negative. Please enter 0 or more.": 'Le volume des ventes ne peut pas être négatif. Entrez 0 ou plus.',
  'Please enter a whole number of units – you can’t sell part of a unit.': 'Entrez un nombre entier d’unités – on ne peut pas vendre une fraction d’unité.',
  'Please use whole numbers only, for example 300.': 'Utilisez seulement des nombres entiers, par exemple 300.',
  'That number is larger than this simulator supports (max 1,000,000,000 units).': 'Ce nombre dépasse la limite du simulateur (maximum : 1 000 000 000 unités).',
  'share of fixed costs': 'part des coûts fixes',
  'offered price per unit': 'prix unitaire offert',
  'extra one-time costs': 'coûts supplémentaires ponctuels',
  'purchase price per unit': 'prix d’achat unitaire',
  'variable cost to make one unit': 'coût variable de fabrication d’une unité',
  'avoidable fixed costs': 'coûts fixes évitables',
  'unavoidable fixed costs': 'coûts fixes inévitables',
  'opportunity cost': 'coût de renonciation',

  /* ---------- Shared UI ---------- */
  'Hide the math for {label}': 'Masquer le calcul de {label}',
  'Show the math for {label}': 'Afficher le calcul de {label}',
  'Hide the math': 'Masquer le calcul',
  'Show the math': 'Afficher le calcul',
  'The math for {label}': 'Le calcul de {label}',
  'Sufficient Stock': 'Stock suffisant',
  'Low Stock': 'Stock faible',
  'Inventory Shortage': 'Pénurie de stock',
  'Not used by plan': 'Non utilisé par le plan',
  'Some business numbers need attention': 'Certains chiffres de l’entreprise sont à corriger',
  'Go to My Business': 'Aller à Mon entreprise',
  'Fix the highlighted products or fixed costs in 🏠 My Business. We don’t show results built on incomplete or invalid numbers.':
    'Corrigez les produits ou les coûts fixes en surbrillance dans 🏠 Mon entreprise. Nous n’affichons pas de résultats fondés sur des chiffres incomplets ou non valides.',
};
