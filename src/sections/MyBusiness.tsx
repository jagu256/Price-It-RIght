import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import BusinessPicker from '../components/BusinessPicker';
import InfoTip from '../components/InfoTip';
import ProductCollection from '../components/ProductCollection';
import SaveMyWork from '../components/SaveMyWork';
import { Notice, Rich, SectionHeader } from '../components/ui';
import { t } from '../i18n/i18n';
import { getBusiness, type BusinessId } from '../lib/businesses';
import { hasUnsavedWork } from '../lib/store';

export default function MyBusiness() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const b = state.business;

  const choose = async (id: BusinessId) => {
    if (id === b.type && !b.isDemo && !hasUnsavedWork(state)) return;
    if (
      hasUnsavedWork(state) &&
      !(await confirm({
        title: t('Switch to the {name} example?', { name: t(getBusiness(id).label) }),
        message: t('This replaces your current products, fixed costs, inventory and recipes with fictional example data. Your changes will be lost.'),
        confirmLabel: t('Replace my work'),
        danger: true,
      }))
    )
      return;
    dispatch({ type: 'load-sample', business: id });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <SectionHeader emoji="🏠" title={t('My Business')} subtitle={t('Choose a business, then add your products and monthly fixed costs.')} />

      <section aria-labelledby="choose-business" className="space-y-4">
        <div>
          <h3 id="choose-business" className="text-2xl font-bold text-sage-900">{t('Choose your business')}</h3>
          <p className="mt-1 text-sage-700">
            <Rich text={t('Each category loads **fictional example** products, costs and inventory – not real market averages. You can change every value.')} />
          </p>
        </div>
        <BusinessPicker selected={b.type} onSelect={choose} labelledBy="choose-business" />
        {b.isDemo && (
          <Notice tone="warn" title={t('You are using the fictional demo business')}>
            {t('Maple Leaf Café is invented for learning. Pick a category above to start your own.')}
          </Notice>
        )}
      </section>

      <section className="card grid gap-6 p-5 sm:p-8 md:grid-cols-2" aria-label={t('Business details')}>
        <div>
          <label htmlFor="business-name" className="block font-semibold text-sage-900">{t('Business name')}</label>
          <p className="text-sm text-sage-600">{t('Shown on your dashboard and report.')}</p>
          <input
            id="business-name"
            className="text-input mt-2"
            maxLength={60}
            value={b.name}
            onChange={(e) => dispatch({ type: 'set-business-name', value: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="fixed-costs" className="block font-semibold text-sage-900">{t('Monthly fixed costs (whole business)')}</label>
            <InfoTip label={t('Monthly fixed costs')} align="right">
              {t('Rent, insurance, software, salaried wages – costs that stay about the same each month whatever you sell. Entered once for the whole business, never per product.')}
            </InfoTip>
          </div>
          <p className="text-sm text-sage-600">{t('All amounts are in Canadian dollars (CAD).')}</p>
          <div className={`mt-2 flex items-center rounded-2xl border-2 bg-white ${model.fixedError ? 'border-loss-600' : 'border-sage-200 focus-within:border-sage-500'}`}>
            <span className="pl-4 font-semibold text-sage-500" aria-hidden="true">$</span>
            <input
              id="fixed-costs"
              inputMode="decimal"
              autoComplete="off"
              className="w-full min-w-0 rounded-2xl bg-transparent px-3 py-3 text-lg font-semibold tabular-nums outline-none"
              value={b.fixedCosts}
              aria-invalid={model.fixedError ? true : undefined}
              aria-describedby={model.fixedError ? 'fixed-costs-error' : undefined}
              onChange={(e) => dispatch({ type: 'set-fixed-costs', value: e.target.value })}
            />
            <span className="whitespace-nowrap pr-4 text-sm font-semibold text-sage-500">{t('per month')}</span>
          </div>
          {model.fixedError && (
            <p id="fixed-costs-error" className="mt-1.5 text-sm font-semibold text-loss-700">⚠ {model.fixedError}</p>
          )}
        </div>
      </section>

      <ProductCollection />
      <SaveMyWork />
    </div>
  );
}
