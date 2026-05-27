/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */

import SVGPathUtils from '../utils/index';

import { PlayIcon } from '@radix-ui/react-icons';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select, { type SingleValue, type StylesConfig } from 'react-select';
import { create } from 'zustand';

import edges from '../data/edge.json';
import stations from '../data/labels.json';




const utils = SVGPathUtils;

class GraphNode {
  value: string;
  edges: Map<GraphNode, number>;

  constructor(value: string) {
    this.value = value;
    this.edges = new Map();
  }

  addEdge(node: GraphNode, weight: number) {
    this.edges.set(node, weight);
  }

  getEdges() {
    return this.edges;
  }
}

class WeightedGraph {
  nodes: Map<string, GraphNode>;

  constructor() {
    this.nodes = new Map();
  }

  addNode(value: string) {
    this.nodes.set(value, new GraphNode(value));
  }

  getNode(value: string) {
    return this.nodes.get(value);
  }

  addEdge(source: string, destination: string, weight: number) {
    const sourceNode = this.getNode(source);
    const destinationNode = this.getNode(destination);
    if (sourceNode && destinationNode) {
      sourceNode.addEdge(destinationNode, weight);
      destinationNode.addEdge(sourceNode, weight);
    }
  }

  getNodes() {
    return this.nodes;
  }

  findShortestPath(
    start: string,
    end: string
  ): { path: string[]; distance: number } | null {
    const distances: Map<string, number> = new Map();
    const previous: Map<string, string | null> = new Map();
    const visited: Set<string> = new Set();

    for (const [key] of this.nodes) {
      distances.set(key, Infinity);
      previous.set(key, null);
    }
    distances.set(start, 0);

    while (visited.size !== this.nodes.size) {
      const currentNode = this.getMinDistanceNode(distances, visited);
      if (!currentNode) break;

      visited.add(currentNode.value);

      for (const [neighbor, weight] of currentNode.getEdges()) {
        const totalDistance = distances.get(currentNode.value)! + weight;
        if (totalDistance < distances.get(neighbor.value)!) {
          distances.set(neighbor.value, totalDistance);
          previous.set(neighbor.value, currentNode.value);
        }
      }
    }

    const path: string[] = [];
    let currentNode = end;
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = previous.get(currentNode)!;
    }

    if (path.length === 1 && path[0] !== start) return null; // No path found
    return { path, distance: distances.get(end)! };
  }

  private getMinDistanceNode(
    distances: Map<string, number>,
    visited: Set<string>
  ): GraphNode | null {
    let minDistance = Infinity;
    let minNode: GraphNode | null = null;
    for (const [key, value] of distances) {
      if (!visited.has(key) && value < minDistance) {
        minDistance = value;
        minNode = this.getNode(key)!;
      }
    }
    return minNode;
  }
}

const graph = new WeightedGraph();

for (const station of stations) {
  graph.addNode(station.id);
}

for (const edge of edges) {
  graph.addEdge(edge.from, edge.to, 1);
}

const isStationId = (stationId: string | null) =>
  Boolean(stationId && stations.some((station) => station.id === stationId));

const getInitialRouteParams = () => {
  if (typeof window === 'undefined') {
    return {
      from: stations[0]?.id || '',
      to: stations[1]?.id || stations[0]?.id || '',
      hasRouteQuery: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const to = params.get('to');

  return {
    from: isStationId(from) ? from! : stations[0]?.id || '',
    to: isStationId(to) ? to! : stations[1]?.id || stations[0]?.id || '',
    hasRouteQuery: isStationId(from) && isStationId(to),
  };
};


export const usePath = create((set) => {
  const initialRouteParams = getInitialRouteParams();

  return {
    path: '',
    route: null,
    selectedFrom: initialRouteParams.from,
    setSelectedFrom: (stationId: string) => set(() => ({ selectedFrom: stationId })),
    setRoute: (newPath: string, route: RouteSummary) =>
      set(() => ({ path: newPath, route })),
    setPath: (newPath: string) => set(() => ({ path: newPath })),
    setInverse: (newPath: string) => set(() => ({ path: newPath })),
  };
});

export interface RouteSummary {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  stops: string[];
  stationDetails: RouteStationDetail[];
  interchanges: RouteInterchange[];
  distance: number;
  fare: number;
  estimatedMinutes: number;
}

export interface RouteStationDetail {
  id: string;
  name: string;
  lineColors: string[];
}

export interface RouteInterchange {
  id: string;
  name: string;
  fromColor: string;
  toColor: string;
}

export type RouteAnimationMode = 'smooth' | 'step';
export type CinematicZoomLevel = 1 | 2 | 3;

const stationName = (id: string) =>
  stations.find((station) => station.id === id)?.text || id;

const estimateFare = (stops: number) => {
  if (stops <= 2) return 10;
  if (stops <= 5) return 20;
  if (stops <= 12) return 30;
  if (stops <= 21) return 40;
  if (stops <= 32) return 50;
  return 60;
};

interface StationOption {
  label: string;
  value: string;
  lineColors: string[];
}

const getRouteEdge = (from: string, to: string) =>
  edges.find((edge) => edge.from === from && edge.to === to) ||
  edges.find((edge) => edge.from === to && edge.to === from);

const uniqueColors = (colors: string[]) => [...new Set(colors.filter(Boolean))];

const getRouteStationDetails = (routePath: string[]): RouteStationDetail[] =>
  routePath.map((stationId, index) => {
    const previousEdge = index > 0 ? getRouteEdge(routePath[index - 1], stationId) : undefined;
    const nextEdge = index < routePath.length - 1 ? getRouteEdge(stationId, routePath[index + 1]) : undefined;

    return {
      id: stationId,
      name: stationName(stationId),
      lineColors: uniqueColors([previousEdge?.stroke || '', nextEdge?.stroke || '']),
    };
  });

const getRouteInterchanges = (routePath: string[]): RouteInterchange[] =>
  routePath.slice(1, -1).flatMap((stationId, index) => {
    const routeIndex = index + 1;
    const previousEdge = getRouteEdge(routePath[routeIndex - 1], stationId);
    const nextEdge = getRouteEdge(stationId, routePath[routeIndex + 1]);

    if (!previousEdge || !nextEdge || previousEdge.stroke === nextEdge.stroke) return [];

    return [{
      id: stationId,
      name: stationName(stationId),
      fromColor: previousEdge.stroke,
      toColor: nextEdge.stroke,
    }];
  });

const buildRoute = (from: string, to: string) => {
  const shortedPath = graph.findShortestPath(from, to);

  if (!shortedPath) return null;

  const routePath = shortedPath.path;
  const newPath = routePath
    .map((stationId, index) => {
      if (stationId === to) return '';

      const nextStationId = routePath[index + 1];
      const forwardEdge = edges.find(
        (edge) => edge.from === stationId && edge.to === nextStationId
      )?.path;

      if (forwardEdge) return forwardEdge;

      const reverseEdge = edges.find(
        (edge) => edge.from === nextStationId && edge.to === stationId
      )?.path || "";

      return utils.inversePath(reverseEdge);
    })
    .filter((pathSegment) => pathSegment !== undefined);

  const combinedPath = newPath.reverse().join('');
  const svgPath = utils.inversePath(combinedPath);

  return {
    svgPath,
    route: {
      from,
      to,
      fromName: stationName(from),
      toName: stationName(to),
      stops: shortedPath.path.map(stationName),
      stationDetails: getRouteStationDetails(shortedPath.path),
      interchanges: getRouteInterchanges(shortedPath.path),
      distance: shortedPath.distance,
      fare: estimateFare(shortedPath.distance),
      estimatedMinutes: Math.max(2, shortedPath.distance * 2),
    },
  };
};

const updateRouteUrl = (from: string, to: string) => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  window.history.pushState({ from, to }, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
};

const getStationLineColors = (stationId: string) =>
  uniqueColors(edges
    .filter((edge) => edge.from === stationId || edge.to === stationId)
    .map((edge) => edge.stroke));

const stationOptions: StationOption[] = stations.map((station) => ({
  label: station.text,
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  return isMobile;
}


export function SearchBox({
  animationMode = 'smooth',
  cinematicZoom = 1,
  onAnimationModeChange,
  onCinematicZoomChange,
  onFromChange,
  onRoutePlan,
}: {
  animationMode?: RouteAnimationMode;
  cinematicZoom?: CinematicZoomLevel;
  onAnimationModeChange?: (mode: RouteAnimationMode) => void;
  onCinematicZoomChange?: (zoom: CinematicZoomLevel) => void;
  onFromChange?: () => void;
  onRoutePlan?: () => void;
}) {
  const initialRouteParams = getInitialRouteParams();
  const { control, getValues, handleSubmit, setValue } = useForm({
    defaultValues: {
      from: initialRouteParams.hasRouteQuery ? initialRouteParams.from : '',
      to: initialRouteParams.hasRouteQuery ? initialRouteParams.to : '',
    },
  });
  const setRoute = usePath((state: any) => state.setRoute);
  const setSelectedFrom = usePath((state: any) => state.setSelectedFrom);
  const hydratedRouteRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (hydratedRouteRef.current || !initialRouteParams.hasRouteQuery) return;
    hydratedRouteRef.current = true;

    const plannedRoute = buildRoute(initialRouteParams.from, initialRouteParams.to);
    if (!plannedRoute) return;

    const animationFrame = requestAnimationFrame(() => {
      setSelectedFrom(initialRouteParams.from);
      setRoute(plannedRoute.svgPath, plannedRoute.route);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [initialRouteParams.from, initialRouteParams.hasRouteQuery, initialRouteParams.to, setRoute, setSelectedFrom]);

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

        const plannedRoute = buildRoute(e.from, e.to);
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
            <Select
              instanceId="from-station"
              options={stationOptions}
              placeholder="From station"
              value={stationOptions.find((option) => option.value === field.value) || null}
              onChange={(option: SingleValue<StationOption>) => {
                const nextValue = option?.value || '';
                field.onChange(nextValue);
                setSelectedFrom(nextValue);
                onFromChange?.();
              }}
              formatOptionLabel={(option) => <StationOptionLabel option={option} />}
              styles={selectStyles}
              isSearchable={!isMobile}
            />
          )}
        />

        <Controller
          control={control}
          name="to"
          render={({ field }) => (
            <Select
              instanceId="to-station"
              options={stationOptions}
              placeholder="To station"
              value={stationOptions.find((option) => option.value === field.value) || null}
              onChange={(option: SingleValue<StationOption>) => field.onChange(option?.value || '')}
              formatOptionLabel={(option) => <StationOptionLabel option={option} />}
              styles={selectStyles}
              isSearchable={!isMobile}
            />
          )}
        />
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <button className='inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:h-12'>
          <PlayIcon />
          Plan journey
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={animationMode === 'smooth'}
          aria-label="Use smooth route animation"
          onClick={toggleAnimationMode}
          className={`route-mode-switch ${animationMode === 'smooth' ? 'route-mode-switch-on' : 'route-mode-switch-off'}`}
          title={animationMode === 'smooth' ? 'Smooth route animation' : 'Step route animation'}
        >
          <span className="route-mode-switch-label">
            {animationMode === 'smooth' ? 'Smooth' : 'Step'}
          </span>
          <span className="route-mode-switch-thumb" />
        </button>
        <div
          className="cinematic-zoom-control"
          role="radiogroup"
          aria-label="Cinematic export zoom"
          title="Cinematic export zoom"
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
          aria-label="Swap from and to stations"
          onClick={swapStations}
          title="Swap stations"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:border-neutral-300 hover:bg-neutral-50 sm:h-12 sm:w-12"
        >
          <ToggleIcon />
        </button>
      </div>
    </form>
  );
}
