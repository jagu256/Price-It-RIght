import { t } from '../i18n/i18n';
import ImportWizard from '../components/ImportWizard';
import InventoryTable from '../components/InventoryTable';
import ProductCosting from '../components/ProductCosting';
import ProductionCapacity from '../components/ProductionCapacity';
import RecipeManager from '../components/RecipeManager';
import { Notice, SectionHeader, SubHeader } from '../components/ui';
import { BUSINESS_NOTES } from '../lib/inventory';
import { useStore } from '../app/StoreContext';

export default function InventoryHub() {
  const { state } = useStore();
  const note = BUSINESS_NOTES[state.business.type];
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

      <RecipeManager />
      <ProductCosting />
      <ProductionCapacity />
    </div>
  );
}
