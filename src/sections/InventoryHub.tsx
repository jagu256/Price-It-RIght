import { t } from '../i18n/i18n';
import ImportWizard from '../components/ImportWizard';
import InventoryTable from '../components/InventoryTable';
import ProductCosting from '../components/ProductCosting';
import ProductionCapacity from '../components/ProductionCapacity';
import PurchasePlanner from '../components/PurchasePlanner';
import RecipeManager from '../components/RecipeManager';
import { Notice, SectionHeader, SubHeader } from '../components/ui';
import { BUSINESS_NOTES } from '../lib/inventory';
import { useStore } from '../app/StoreContext';

export default function InventoryHub() {
  const { state } = useStore();
  const note = BUSINESS_NOTES[state.business.type];
  // A business with no inventory (e.g. an accounting firm selling services) needs no recipes or stock checks.
  const servicesOnly = state.business.inventory.length === 0;
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <SectionHeader emoji="📦" title={t('Smart Inventory Hub')} subtitle={t('Upload your inventory, understand your stock, and plan smarter.')} />

      <section aria-labelledby="stock-title" className="space-y-4">
        <SubHeader id="stock-title" title={t('Your inventory')} subtitle={t('Upload a spreadsheet or type items in. You can edit everything after importing.')} />
        <Notice tone="info">{t('Imported data is a snapshot of your stock at that moment – it is not a live inventory feed. Re-import or edit it when your stock changes.')}</Notice>
        {note && <Notice tone="idea">{t(note)}</Notice>}
        <ImportWizard kind="inventory" />
        <InventoryTable />
      </section>

      {servicesOnly ? (
        <Notice tone="success" title={t('Selling services? No inventory needed')}>
          {t('Your business has no inventory items, so recipes, product costing from stock, production capacity and the shopping list are not needed and are hidden. Services (like accounting, consulting or cleaning) just use the variable cost per unit entered in 🏠 My Business. If your products do use stock, add your inventory above and these tools will appear.')}
        </Notice>
      ) : (
        <>
          <RecipeManager />
          <ProductCosting />
          <ProductionCapacity />
          <PurchasePlanner />
        </>
      )}
    </div>
  );
}
