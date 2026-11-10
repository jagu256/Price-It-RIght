/**
 * The same app in French (Français): key workflows, fr-CA number formats, and
 * a check that every screen shows no untranslated text from the dictionary.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { SECTIONS } from './app/routes';
import { LANGUAGE_KEY, missingFrench, setLanguage } from './i18n/i18n';
import { initialAppState } from './lib/store';

const FAST_USER = { pointerEventsCheck: PointerEventsCheckLevel.Never, delay: null } as const;
const panel = (id: string) => document.getElementById(`panel-${id}`)! as HTMLElement;
const go = async (id: string) => {
  await act(async () => {
    window.location.hash = id;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};

function setupFrench(hash: string, business: Parameters<typeof initialAppState>[0] = 'demo') {
  window.localStorage.setItem(LANGUAGE_KEY, 'fr');
  setLanguage('fr'); // so the example business is built with French names, as in the real app
  window.location.hash = hash;
  const user = userEvent.setup(FAST_USER);
  render(<App initial={initialAppState(business)} />);
  return { user };
}

beforeEach(() => missingFrench.clear());
afterEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
  setLanguage('en');
});

describe('en français', () => {
  it('shows the dashboard in French with fr-CA amounts (demo café: 3 900 $, 975 $)', async () => {
    const { user } = setupFrench('dashboard');
    const dash = within(panel('dashboard'));
    expect(screen.getByRole('link', { name: /Tableau de bord/ })).toBeInTheDocument();
    expect(dash.getByRole('heading', { name: 'Chiffre d’affaires mensuel total' }).closest('article')).toHaveTextContent('3 900 $');
    expect(dash.getByRole('heading', { name: 'Marge sur coûts variables totale' }).closest('article')).toHaveTextContent('2 475 $');
    const profit = dash.getByRole('heading', { name: 'Bénéfice d’exploitation prévu' }).closest('article')!;
    expect(profit).toHaveTextContent('975 $');
    expect(dash.getByRole('heading', { name: 'Ratio global de MCV' }).closest('article')).toHaveTextContent('63,5 %');

    await user.click(within(profit as HTMLElement).getByRole('button', { name: 'Afficher le calcul de Bénéfice d’exploitation prévu' }));
    expect(within(profit as HTMLElement).getByRole('region')).toHaveTextContent('Bénéfice d’exploitation = marge sur coûts variables totale − coûts fixes');
    expect(within(profit as HTMLElement).getByRole('region')).toHaveTextContent('2 475 $ − 1 500 $ = 975 $');
  });

  it('shows sensitivity and the coefficient of operating leverage in French (2,54)', () => {
    setupFrench('dashboard');
    const sec = within(within(panel('dashboard')).getByRole('heading', { name: /Analyse de sensibilité/ }).closest('section')!);
    expect(sec.getByRole('rowheader', { name: 'Prix de vente' }).closest('tr')).toHaveTextContent('1 365 $');
    expect(sec.getByText('Coefficient de levier d’exploitation').parentElement).toHaveTextContent('2,54');
  });

  it('accepts a French decimal comma and keeps invalid input as typed', async () => {
    const { user } = setupFrench('my-business', 'coffee');
    const mb = within(panel('my-business'));
    const price = mb.getByLabelText('Prix de vente unitaire de Café');
    await user.clear(price);
    await user.type(price, '6,50');
    expect(price).toHaveValue('6,50');
    expect(mb.queryByText(/Vérifiez la virgule/)).not.toBeInTheDocument();
    await user.clear(price);
    await user.type(price, 'abc');
    expect(mb.getByText('Utilisez seulement des chiffres, par exemple 6 ou 6,50.')).toBeInTheDocument();
  });

  it('switches back to English and remembers the choice', async () => {
    const { user } = setupFrench('dashboard');
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(within(panel('dashboard')).getByRole('heading', { name: 'Total Monthly Revenue' }).closest('article')).toHaveTextContent('$3,900');
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    await user.click(screen.getByRole('button', { name: 'Français' }));
    expect(window.localStorage.getItem(LANGUAGE_KEY)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr-CA');
  });

  it('shows the business report preview in French with the same figures', () => {
    setupFrench('report');
    const rep = within(panel('report'));
    expect(rep.getByRole('button', { name: /Télécharger le rapport de mon entreprise/ })).toBeInTheDocument();
    const preview = rep.getByRole('article', { name: 'Aperçu du rapport' });
    expect(within(preview).getByRole('heading', { name: 'Analyse du seuil de rentabilité' })).toBeInTheDocument();
    expect(preview.textContent!.replace(/[  ]/g, ' ')).toContain('455 unités au total');
  });

  it('runs the exact Best mix search and a make-or-buy decision in French', async () => {
    const { user } = setupFrench('planner');
    const planner = within(panel('planner'));
    await user.click(planner.getByRole('button', { name: /Meilleure composition/ }));
    expect(planner.getByText(/optimalité prouvée pour ces chiffres/)).toBeInTheDocument();

    await go('decisions');
    const dec = within(panel('decisions'));
    expect(dec.getByRole('heading', { name: /Fabriquer ou acheter/ })).toBeInTheDocument();
    expect([...missingFrench]).toEqual([]);
  });

  it('every screen shows only translated text (nothing asked for is missing from the dictionary)', async () => {
    setupFrench('home');
    for (const s of SECTIONS) await go(s.id);
    await go('home');
    expect([...missingFrench]).toEqual([]);
  });
});
