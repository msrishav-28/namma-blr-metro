/* eslint-disable @typescript-eslint/no-explicit-any */

import { PlayIcon } from '@radix-ui/react-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { availableLanguages, getLocalizedStationName, useI18n, type Language } from '../i18n';
import { getInitialRouteParams, usePath } from '../store/pathStore';
import type { CinematicZoomLevel, RouteAnimationMode } from '../types/route';
import { buildRoute, getStationLineColors, stations } from '../utils/routePlanner';

interface StationOption {
  label: string;
  value: string;
  lineColors: string[];
}

const updateRouteUrl = (from: string, to: string) => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.pathname = '/';
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  window.history.pushState({ from, to }, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
};

const getStationOptions = (language: Language): StationOption[] => stations.map((station) => ({
  label: getLocalizedStationName(station.id, station.text, language),
  value: station.id,
  lineColors: getStationLineColors(station.id),
}));

const selectStyles: StylesConfig<StationOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 'var(--station-select-height)',
    borderRadius: 999,
    backgroundColor: 'white',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(0,0,0,0.04)' : 'none',
    paddingLeft: 'var(--station-select-x-padding)',
    paddingRight: 6,
    border: '1px solid',
    borderColor: state.isFocused ? '#111827' : '#e5e7eb',
    cursor: 'pointer',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#737373',
    fontWeight: 500,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    display: 'none',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#f5f5f5' : 'white',
    color: '#111',
  }),
};

function ToggleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="15" cy="15" r="15" fill="white" />
      <path d="M10.022 12.3254L11.9038 9.23479L13.8412 12.3254" stroke="black" strokeLinecap="round" />
      <path d="M11.9343 19.7286L11.9391 9.69627" stroke="black" strokeLinecap="round" />
      <path d="M15.7609 16.6381L17.8596 19.7286L19.9221 16.7408" stroke="black" strokeLinecap="round" />
      <path d="M17.8901 9.23479L17.8949 19.2671" stroke="black" strokeLinecap="round" />
    </svg>
  );
}



function StationOptionLabel({ option }: { option: StationOption }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-base font-medium sm:text-lg">{option.label}</span>
    </div>
  );
}




export function SearchBox({
  animationMode = 'smooth',
  cinematicZoom = 1,
  disableSearch = false,
  onAnimationModeChange,
  onCinematicZoomChange,
  onFromChange,
  onRoutePlan,
}: {
  animationMode?: RouteAnimationMode;
  cinematicZoom?: CinematicZoomLevel;
  disableSearch?: boolean;
  onAnimationModeChange?: (mode: RouteAnimationMode) => void;
  onCinematicZoomChange?: (zoom: CinematicZoomLevel) => void;
  onFromChange?: () => void;
  onRoutePlan?: () => void;
}) {
  const { language, setLanguage, t } = useI18n();
  const initialRouteParams = useMemo(() => getInitialRouteParams(), []);
  const { control, getValues, handleSubmit, setValue } = useForm({
    defaultValues: {
      from: initialRouteParams.hasRouteQuery ? initialRouteParams.from : '',
      to: initialRouteParams.hasRouteQuery ? initialRouteParams.to : '',
    },
  });
  const setRoute = usePath((state: any) => state.setRoute);
  const setSelectedFrom = usePath((state: any) => state.setSelectedFrom);
  const hydratedRouteRef = useRef(false);
  const stationOptions = useMemo(() => getStationOptions(language), [language]);

  useEffect(() => {
    if (hydratedRouteRef.current || !initialRouteParams.hasRouteQuery) return;
    hydratedRouteRef.current = true;

    const plannedRoute = buildRoute(initialRouteParams.from, initialRouteParams.to, language);
    if (!plannedRoute) return;

    const animationFrame = requestAnimationFrame(() => {
      setSelectedFrom(initialRouteParams.from);
      setRoute(plannedRoute.svgPath, plannedRoute.route);
      onRoutePlan?.();
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [initialRouteParams.from, initialRouteParams.hasRouteQuery, initialRouteParams.to, language, onRoutePlan, setRoute, setSelectedFrom]);

  const swapStations = () => {
    const fromValue = getValues('from');
    const toValue = getValues('to');

    setValue('from', toValue);
    setValue('to', fromValue);
    setSelectedFrom(toValue);
    onFromChange?.();
  };

  const toggleAnimationMode = () => {
    onAnimationModeChange?.(animationMode === 'smooth' ? 'step' : 'smooth');
  };

  return (
    <form
      onSubmit={handleSubmit((e) => {
        if (!e.from || !e.to) return;

        const plannedRoute = buildRoute(e.from, e.to, language);
        if (!plannedRoute) return;

        setRoute(plannedRoute.svgPath, plannedRoute.route);
        updateRouteUrl(e.from, e.to);
        onRoutePlan?.();
      })}
      className='grid gap-3 [--station-select-height:48px] [--station-select-x-padding:12px] sm:gap-4 sm:[--station-select-height:58px] sm:[--station-select-x-padding:14px]'
    >
      <div className='grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3'>
        <Controller
          control={control}
          name="from"
          render={({ field }) => (
            <div>
              <label id="from-station-label" htmlFor="from-station-input" className="sr-only">
                {t('fromStation')}
              </label>
              <Select
                inputId="from-station-input"
                instanceId="from-station"
                name="from"
                aria-labelledby="from-station-label"
                options={stationOptions}
                placeholder={t('fromStation')}
                value={stationOptions.find((option) => option.value === field.value) || null}
                onChange={(option: SingleValue<StationOption>) => {
                  const nextValue = option?.value || '';
                  field.onChange(nextValue);
                  setSelectedFrom(nextValue);
                  onFromChange?.();
                }}
                formatOptionLabel={(option) => <StationOptionLabel option={option} />}
                styles={selectStyles}
                isSearchable={!disableSearch}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="to"
          render={({ field }) => (
            <div>
              <label id="to-station-label" htmlFor="to-station-input" className="sr-only">
                {t('toStation')}
              </label>
              <Select
                inputId="to-station-input"
                instanceId="to-station"
                name="to"
                aria-labelledby="to-station-label"
                options={stationOptions}
                placeholder={t('toStation')}
                value={stationOptions.find((option) => option.value === field.value) || null}
                onChange={(option: SingleValue<StationOption>) => field.onChange(option?.value || '')}
                formatOptionLabel={(option) => <StationOptionLabel option={option} />}
                styles={selectStyles}
                isSearchable={!disableSearch}
              />
            </div>
          )}
        />
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <button className='inline-flex h-11 items-center gap-2 rounded-full bg-[#009b50] px-4 text-sm font-semibold text-white transition hover:bg-[#007f42]'>
          <PlayIcon />
          {t('planJourney')}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={animationMode === 'smooth'}
          aria-label={t('useSmoothRouteAnimation')}
          onClick={toggleAnimationMode}
          className={`route-mode-switch ${animationMode === 'smooth' ? 'route-mode-switch-on' : 'route-mode-switch-off'}`}
          title={animationMode === 'smooth' ? t('smoothRouteAnimation') : t('stepRouteAnimation')}
        >
          <span className="route-mode-switch-label">
            {animationMode === 'smooth' ? t('smooth') : t('step')}
          </span>
          <span className="route-mode-switch-thumb" />
        </button>
        <div
          className="cinematic-zoom-control"
          role="radiogroup"
          aria-label={t('cinematicExportZoom')}
          title={t('cinematicExportZoom')}
        >
          {([1, 2, 3] as const).map((zoom) => (
            <button
              key={zoom}
              type="button"
              role="radio"
              aria-checked={cinematicZoom === zoom}
              onClick={() => onCinematicZoomChange?.(zoom)}
              className={cinematicZoom === zoom ? 'cinematic-zoom-option-active' : ''}
            >
              {zoom}x
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={t('swapFromAndToStations')}
          onClick={swapStations}
          title={t('swapStations')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:border-neutral-300 hover:bg-neutral-50 sm:h-12 sm:w-12"
        >
          <ToggleIcon />
        </button>
        <label className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 sm:h-12">
          <span className="sr-only">{t('language')}</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="bg-transparent text-sm font-semibold outline-none"
            aria-label={t('language')}
          >
            {availableLanguages.map((option) => (
              <option key={option} value={option}>
                {option === 'en'
                  ? t('english')
                  : option === 'hi'
                    ? t('hindi')
                    : option === 'mr'
                      ? t('marathi')
                      : t('bengali')}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}

export default SearchBox;
