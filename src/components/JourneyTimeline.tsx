import { DownloadIcon } from '@radix-ui/react-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';

import edges from '../data/edge.json';
import stations from '../data/labels.json';
import RouteDirectionCard from './RouteDirectionCard';
import type { RouteSummary, RouteStationDetail } from './SearchBox';

interface JourneyTimelineProps {
    route: RouteSummary | null;
    activeStationId: string | null;
}

const stationName = (id: string) =>
    stations.find((station) => station.id === id)?.text || id;

const getRouteEdge = (from: string, to: string) =>
    edges.find((edge) => edge.from === from && edge.to === to) ||
    edges.find((edge) => edge.from === to && edge.to === from);

const getSegmentColor = (stationsList: RouteStationDetail[], index: number) => {
    const currentStation = stationsList[index];
    const nextStation = stationsList[index + 1];
    if (!currentStation || !nextStation) return currentStation?.lineColors[0] || '#f5d618';

    return getRouteEdge(currentStation.id, nextStation.id)?.stroke || currentStation.lineColors[0] || '#f5d618';
};

const getLineTerminal = (fromStationId: string, nextStationId: string, color: string) => {
    let previousStationId = fromStationId;
    let currentStationId = nextStationId;
    const visited = new Set([fromStationId]);

    while (!visited.has(currentStationId)) {
        visited.add(currentStationId);

        const nextEdge = edges.find((edge) =>
            edge.stroke === color &&
            (edge.from === currentStationId || edge.to === currentStationId) &&
            edge.from !== previousStationId &&
            edge.to !== previousStationId
        );

        if (!nextEdge) break;

        previousStationId = currentStationId;
        currentStationId = nextEdge.from === currentStationId ? nextEdge.to : nextEdge.from;
    }

    return stationName(currentStationId);
};

function JourneyTimeline({ route, activeStationId }: JourneyTimelineProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const captureRef = useRef<HTMLDivElement | null>(null);
    const stationRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [isDownloading, setIsDownloading] = useState(false);

    const timelineItems = useMemo(() => {
        const routeStations = route?.stationDetails || [];

        return routeStations.map((station, index) => {
            const previousColor = index > 0 ? getSegmentColor(routeStations, index - 1) : '';
            const nextColor = getSegmentColor(routeStations, index);
            const isInterchange = Boolean(previousColor && nextColor && previousColor !== nextColor);
            const nextStation = routeStations[index + 1];
            const terminalName = nextStation ? getLineTerminal(station.id, nextStation.id, nextColor) : route?.toName;

            return {
                station,
                previousColor,
                nextColor,
                isInterchange,
                showDirection: Boolean(nextStation && (index === 0 || isInterchange)),
                terminalName,
                isFirst: index === 0,
                isLast: index === routeStations.length - 1,
            };
        });
    }, [route]);

    useEffect(() => {
        if (!activeStationId) return;

        stationRefs.current[activeStationId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }, [activeStationId]);

    const downloadTimeline = async () => {
        if (!route || !captureRef.current || isDownloading) return;

        setIsDownloading(true);

        try {
            const node = captureRef.current;
            const dataUrl = await toPng(node, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 2,
                width: node.scrollWidth,
                height: node.scrollHeight,
                style: {
                    width: `${node.scrollWidth}px`,
                    height: `${node.scrollHeight}px`,
                },
            });
            const link = document.createElement('a');
            const filename = `${route.fromName}-to-${route.toName}-timeline`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } finally {
            setIsDownloading(false);
        }
    };

    if (!route) {
        return (
            <section className="rounded-lg bg-white p-3 text-sm text-neutral-500">
                Plan a journey to see the station timeline.
            </section>
        );
    }

    return (
        <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-neutral-950">Journey timeline</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-500">{route.stationDetails.length} stations</span>
                    <button
                        type="button"
                        aria-label="Download journey timeline as PNG"
                        title="Download timeline"
                        disabled={isDownloading}
                        onClick={downloadTimeline}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <DownloadIcon />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="-mx-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div ref={captureRef} className="flex min-w-max snap-x snap-mandatory items-center bg-white px-3 py-2">
                    {timelineItems.map(({ station, previousColor, nextColor, isInterchange, showDirection, terminalName, isFirst, isLast }) => {
                        const isActive = station.id === activeStationId;
                        const dotColor = isLast ? previousColor || nextColor : nextColor;
                        const placeAbove = showDirection || isFirst;
                        const label = showDirection ? (
                            <RouteDirectionCard
                                fromName={station.name}
                                toName={terminalName}
                                lineColor={nextColor}
                                label="Toward"
                                className={`rounded-lg ${isActive ? 'ring-2 ring-neutral-950/10' : ''}`}
                                compact
                            />
                        ) : (
                            <span className={`block max-w-full whitespace-normal text-center text-sm font-semibold leading-tight transition-colors ${isActive ? 'text-neutral-950' : 'text-neutral-500'}`}>
                                {station.name}
                            </span>
                        );

                        return (
                            <div
                                key={station.id}
                                ref={(element) => {
                                    stationRefs.current[station.id] = element;
                                }}
                                className="grid w-36 shrink-0 snap-center grid-rows-[72px_34px_72px] justify-items-center"
                            >
                                <div className="flex h-full w-full items-end justify-center px-1 pb-2">
                                    {placeAbove ? label : null}
                                </div>

                                <div className="relative flex h-[34px] w-full items-center justify-center">
                                    <span
                                        className={`absolute left-0 top-1/2 h-3 -translate-y-1/2 ${isFirst ? 'w-1/2 translate-x-full' : 'w-1/2'}`}
                                        style={{ backgroundColor: isFirst ? nextColor : previousColor || nextColor }}
                                    />
                                    <span
                                        className={`absolute right-0 top-1/2 h-3 -translate-y-1/2 ${isLast ? 'hidden' : 'w-1/2'}`}
                                        style={{ backgroundColor: nextColor }}
                                    />
                                    <span
                                        className={`relative z-10 h-6 w-6 rounded-full border-[7px] border-white shadow-sm transition-transform ${isActive ? 'scale-110 ring-4 ring-neutral-900/15' : ''}`}
                                        style={{ backgroundColor: dotColor }}
                                    />
                                </div>

                                <div className="flex h-full w-full flex-col items-center justify-start px-1 pt-2">
                                    {placeAbove ? null : label}
                                    <span className={`mt-1 text-[11px] font-semibold ${isInterchange ? 'text-neutral-400' : 'text-transparent'}`}>
                                        Change
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default JourneyTimeline;
