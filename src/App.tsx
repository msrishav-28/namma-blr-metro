
import './App.css'
import MetroMapStage from './components/Stage'
import { LazyBoundary } from './components/LazyComponent'
import { I18nProvider } from './i18n'
import { usePathname } from './store/locationStore'
import { ThemeProvider } from './theme'
import { createLazyComponent } from './utils/lazyComponent'

const StationPage = createLazyComponent(() => import('./components/StationPage'));
const LegalPage = createLazyComponent(() => import('./components/LegalPage'));
const OpenSourceAlternativePage = createLazyComponent(() => import('./components/OpenSourceAlternativePage'));

const stationSlugFromPathname = (pathname: string) => {
  const match = pathname.match(/^\/stations\/([^/]+)\/?$/);
  return match?.[1] || null;
};

const openSourceAlternativeSlugFromPathname = (pathname: string) => {
  const match = pathname.match(/^\/open-source-free-alternative-to-([^/]+)\/?$/);
  return match?.[1] || null;
};

function AppContent() {
  const pathname = usePathname();
  const stationSlug = stationSlugFromPathname(pathname);
  const openSourceAlternativeSlug = openSourceAlternativeSlugFromPathname(pathname);
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';

  if (stationSlug) {
    return (
      <LazyBoundary fallback={<div className="min-h-svh bg-[#f4f0e8] dark:bg-zinc-950" />}>
        <StationPage slug={stationSlug} />
      </LazyBoundary>
    );
  }

  if (openSourceAlternativeSlug) {
    return (
      <LazyBoundary fallback={<div className="min-h-svh bg-[#f4f0e8] dark:bg-zinc-950" />}>
        <OpenSourceAlternativePage slug={openSourceAlternativeSlug} />
      </LazyBoundary>
    );
  }

  if (normalizedPathname === '/privacy-policy' || normalizedPathname === '/privacy_policy') {
    return (
      <LazyBoundary fallback={<div className="min-h-svh bg-[#f4f0e8] dark:bg-zinc-950" />}>
        <LegalPage kind="privacy" />
      </LazyBoundary>
    );
  }

  if (
    normalizedPathname === '/terms-and-conditions' ||
    normalizedPathname === '/termsn-and-condition' ||
    normalizedPathname === '/terms'
  ) {
    return (
      <LazyBoundary fallback={<div className="min-h-svh bg-[#f4f0e8] dark:bg-zinc-950" />}>
        <LegalPage kind="terms" />
      </LazyBoundary>
    );
  }

  return <MetroMapStage />;
}

function App() {

  return (
    <ThemeProvider>
      <I18nProvider>
        <div>
          <AppContent />
        </div>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
