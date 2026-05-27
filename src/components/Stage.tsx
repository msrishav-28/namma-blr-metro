/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckIcon, ClipboardCopyIcon, DownloadIcon, ExternalLinkIcon, GitHubLogoIcon, InstagramLogoIcon, Link2Icon, LinkedInLogoIcon, Share2Icon, TwitterLogoIcon } from '@radix-ui/react-icons';
import { toPng } from 'html-to-image';
import { useMemo, useRef, useState } from 'react';
import { Drawer } from 'vaul';


import JourneyInfoPanel from './JourneyInfoPanel';
import JourneyTimeline from './JourneyTimeline';
import SvgComponent from './graphsvg';
import { SearchBox, type CinematicZoomLevel, type RouteSummary, usePath } from './SearchBox';
import { getLocalizedStationName, useI18n } from '../i18n';

const SUPPORT_EMAIL = 'sharma.pratik2016@gmail.com';
const LINKEDIN_URL = 'https://linkedin.com/in/biomathcode';
const GITHUB_URL = 'https://github.com/biomathcode';

const copyText = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

function CreatorLinks() {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);

    const copySupportEmail = async () => {
        await copyText(SUPPORT_EMAIL);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <section className="grid gap-2 border-t border-neutral-200 pt-3 sm:pt-4" aria-label={t('creatorLinks')}>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('createdBy')}</p>
            <div className="flex flex-wrap items-center gap-2">
                <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <LinkedInLogoIcon />
                    {t('linkedin')}
                </a>
                <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <GitHubLogoIcon />
                    {t('github')}
                </a>
                <button
                    type="button"
                    onClick={copySupportEmail}
                    title={SUPPORT_EMAIL}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    {copied ? <CheckIcon /> : <ClipboardCopyIcon />}
                    {copied ? t('supportEmailCopied') : t('copySupportEmail')}
                </button>
            </div>
        </section>
    );
}

function RouteSharePanel({
    route,
    fromName,
    toName,
}: {
    route: RouteSummary;
    fromName: string;
    toName: string;
}) {
    const { t } = useI18n();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [copiedMessage, setCopiedMessage] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const routeUrl = useMemo(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('from', route.from);
        url.searchParams.set('to', route.to);
        return url.toString();
    }, [route.from, route.to]);
    const shareText = t('shareRouteText', {
        from: fromName,
        to: toName,
        stops: route.distance,
        time: t('minutesShort', { count: route.estimatedMinutes }),
        fare: route.fare,
    });
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(routeUrl);
    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    };

    const showCopiedMessage = (message: string) => {
        setCopiedMessage(message);
        window.setTimeout(() => setCopiedMessage(''), 1600);
    };

    const copyRouteLink = async (message = t('routeLinkCopied')) => {
        await copyText(routeUrl);
        showCopiedMessage(message);
    };

    const shareRoute = async () => {
        if (navigator.share) {
            await navigator.share({
                title: t('routeTitle', { from: fromName, to: toName }),
                text: shareText,
                url: routeUrl,
            });
            return;
        }

        await copyRouteLink();
    };

    const downloadRoutePng = async () => {
        if (!cardRef.current || isDownloading) return;

        setIsDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `${route.from}-to-${route.to}-delhi-metro-route.png`.toLowerCase();
            link.href = dataUrl;
            link.click();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-3" aria-label={t('shareRoute')}>
            <div ref={cardRef} className="grid gap-3 rounded-md bg-white p-3 text-neutral-950">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#009b50]">{t('shareRoute')}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-tight">{t('routeTitle', { from: fromName, to: toName })}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-neutral-100 p-2">
                        <p className="text-[11px] font-medium text-neutral-500">{t('fare')}</p>
                        <p className="mt-1 text-base font-semibold">₹{route.fare}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2">
                        <p className="text-[11px] font-medium text-neutral-500">{t('stops')}</p>
                        <p className="mt-1 text-base font-semibold">{route.distance}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2">
                        <p className="text-[11px] font-medium text-neutral-500">{t('time')}</p>
                        <p className="mt-1 text-base font-semibold">{t('minutesShort', { count: route.estimatedMinutes })}</p>
                    </div>
                </div>
                <p className="text-xs font-medium text-neutral-500">metro.coolhead.in</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => copyRouteLink()}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <Link2Icon />
                    {t('copyRouteLink')}
                </button>
                <button
                    type="button"
                    onClick={shareRoute}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <Share2Icon />
                    {t('shareVia')}
                </button>
                <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <TwitterLogoIcon />
                    {t('shareOnTwitter')}
                </a>
                <a
                    href={shareLinks.reddit}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <ExternalLinkIcon />
                    {t('shareOnReddit')}
                </a>
                <button
                    type="button"
                    onClick={() => copyRouteLink(t('instagramLinkCopied'))}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <InstagramLogoIcon />
                    {t('shareOnInstagram')}
                </button>
                <button
                    type="button"
                    onClick={downloadRoutePng}
                    disabled={isDownloading}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <DownloadIcon />
                    {isDownloading ? t('routePngDownloading') : t('downloadRoutePng')}
                </button>
            </div>
            {copiedMessage ? <p className="text-xs font-semibold text-[#009b50]">{copiedMessage}</p> : null}
        </section>
    );
}


function MetroMapStage() {
    const { language, t } = useI18n();
    const [play, setPlay] = useState(false);
    const [animationMode, setAnimationMode] = useState<'smooth' | 'step'>('smooth');
    const [cinematicZoom, setCinematicZoom] = useState<CinematicZoomLevel>(1);
    const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>('220px');
    const [activeRouteStationId, setActiveRouteStationId] = useState<string | null>(null);


    const path = usePath((state: any) => state.path);
    const route = usePath((state: any) => state.route);
    const selectedFrom = usePath((state: any) => state.selectedFrom);
    const routeStationIds = useMemo(
        () => route?.stationDetails.map((station: { id: string }) => station.id) || [],
        [route]
    );
    const routeFromName = route ? getLocalizedStationName(route.from, route.fromName, language) : '';
    const routeToName = route ? getLocalizedStationName(route.to, route.toName, language) : '';
    const cockpitBody = (
        <>
            <SearchBox
                animationMode={animationMode}
                cinematicZoom={cinematicZoom}
                onAnimationModeChange={setAnimationMode}
                onCinematicZoomChange={setCinematicZoom}
                onFromChange={() => setPlay(false)}
                onRoutePlan={() => {
                    setActiveSnapPoint('100px');
                    setPlay(true);
                }}
            />
            <section className="grid gap-3 border-t border-neutral-200 pt-3 sm:gap-4 sm:pt-5">
                <div>
                    <h2 className="text-lg font-semibold sm:mt-2 sm:text-xl">
                        {route ? t('routeTitle', { from: routeFromName, to: routeToName }) : t('chooseRoute')}
                    </h2>
                </div>
                <JourneyTimeline route={route} activeStationId={activeRouteStationId} />


                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">{t('fare')}</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? `₹${route.fare}` : '—'}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">{t('stops')}</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? route.distance : '—'}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">{t('time')}</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? t('minutesShort', { count: route.estimatedMinutes }) : '—'}</p>
                    </div>
                </div>


                <JourneyInfoPanel route={route} />
                {route ? <RouteSharePanel route={route} fromName={routeFromName} toName={routeToName} /> : null}
                <CreatorLinks />
            </section>
        </>
    );

    return (
        <div className="min-h-svh overflow-hidden bg-[#f4f0e8] p-2 text-neutral-950 sm:p-4 lg:overflow-visible lg:p-6">
            <div className="grid min-h-[calc(100svh-1.5rem)] gap-4 sm:min-h-[calc(100svh-2rem)] lg:min-h-[calc(100svh-3rem)] lg:grid-cols-2">
                <main className="relative min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-lg border border-neutral-200 shadow-sm sm:min-h-[calc(100svh-2rem)] lg:min-h-0">
                    <SvgComponent
                        path={path}
                        selectedStationId={selectedFrom}
                        routeStationIds={routeStationIds}
                        onActiveStationChange={setActiveRouteStationId}
                        animationMode={animationMode}
                        cinematicZoom={cinematicZoom}
                        setPlay={setPlay}
                        play={play}
                    />
                </main>

                <Drawer.Root
                    activeSnapPoint={activeSnapPoint}
                    setActiveSnapPoint={setActiveSnapPoint}
                    defaultOpen
                    dismissible={false}
                    modal={false}
                    snapPoints={['100px', '220px', 1]}
                    handleOnly
                >
                    <Drawer.Portal>
                        <Drawer.Content
                            className="fixed inset-x-2 bottom-2 z-30 flex flex-col gap-2 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-3 shadow-2xl outline-none sm:inset-x-4 sm:bottom-4 sm:gap-4 sm:rounded-[28px] sm:p-5 lg:hidden"
                            style={{
                                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                                height: 'calc(100svh - env(safe-area-inset-bottom, 0px) - 16px)',
                                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'
                            }}
                        >
                            <Drawer.Title className="sr-only">{t('routePlanner')}</Drawer.Title>
                            <div className="-mx-3 -mt-3 flex shrink-0 justify-center px-3 pb-2 pt-3 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pb-3 sm:pt-5">
                                <Drawer.Handle className="h-1 w-20 rounded-full bg-neutral-200 sm:w-24" />
                            </div>
                            <div className="min-h-0 overflow-y-auto pr-1">
                                <div className="grid gap-3 sm:gap-5">
                                    {cockpitBody}
                                </div>
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>

                <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 lg:flex lg:max-h-[calc(100vh-3rem)]">
                    <div>
                        <h1 className="mt-2 text-md font-semibold uppercase  text-red-700">{t('delhiMetro')}</h1>
                    </div>

                    {cockpitBody}
                </aside>
            </div>
        </div>

    )
}

export default MetroMapStage;
