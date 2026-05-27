'use client';
import {
  DiscIcon,
  EnterFullScreenIcon,
  ResetIcon,
  UpdateIcon,
  VideoIcon,
} from '@radix-ui/react-icons';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import edges from '../data/edge.json';
import stationLabels from '../data/labels.json';
import MetroTrain from '../assets/metro.svg?react';
import Map, { type MapControls, type MapTransform } from './metromap';
import { getLocalizedStationName, useI18n } from '../i18n';
import type { CinematicZoomLevel, RouteAnimationMode } from '../types/route';

gsap.registerPlugin(useGSAP);

const VIEWBOX_WIDTH = 1500;
const VIEWBOX_HEIGHT = 1450;
const ROUTE_CAMERA_SCALE = 12.6;
const MIN_MAP_SCALE = 1.8;
const MAX_MAP_SCALE = ROUTE_CAMERA_SCALE;
const WHEEL_ZOOM_IN_SCALE = 1.1625;
const WHEEL_ZOOM_OUT_SCALE = 0.9125;
const STATION_DWELL_SECONDS = 0.55;
const EXPORT_FONT_STACK = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif';

const fitTransform: MapTransform = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
};

const transformToString = ({ scaleX, scaleY, translateX, translateY }: MapTransform) =>
  `matrix(${scaleX} 0 0 ${scaleY} ${translateX} ${translateY})`;

const coordinatePattern = /[-+]?\d*\.?\d+/g;

const extractEdgePoints = (path: string) => {
  const coordinates = [...path.matchAll(coordinatePattern)].map(Number);
  return {
    first: { x: coordinates[0], y: coordinates[1] },
    last: {
      x: coordinates[coordinates.length - 2],
      y: coordinates[coordinates.length - 1],
    },
  };
};

const pointKey = ({ x, y }: { x: number; y: number }) => `${x.toFixed(3)},${y.toFixed(3)}`;

const resolveStationCoordinates = () => {
  const incidentPoints: Record<string, Array<{ x: number; y: number }>> = {};
  const edgePoints = edges.map((edge) => {
    const points = extractEdgePoints(edge.path);
    incidentPoints[edge.from] = [...(incidentPoints[edge.from] || []), points.first, points.last];
    incidentPoints[edge.to] = [...(incidentPoints[edge.to] || []), points.first, points.last];

    return { ...edge, ...points };
  });

  const coordinates: Record<string, { x: number; y: number }> = {};

  for (const [stationId, points] of Object.entries(incidentPoints)) {
    const counts = points.reduce<Record<string, { count: number; point: { x: number; y: number } }>>((acc, point) => {
      const key = pointKey(point);
      acc[key] = { count: (acc[key]?.count || 0) + 1, point };
      return acc;
    }, {});

    const sharedPoint = Object.values(counts).sort((a, b) => b.count - a.count)[0];
    if (sharedPoint && sharedPoint.count > 1) {
      coordinates[stationId] = sharedPoint.point;
    }
  }

  for (const edge of edgePoints) {
    const fromCoordinate = coordinates[edge.from];
    const toCoordinate = coordinates[edge.to];

    if (!fromCoordinate && toCoordinate) {
      coordinates[edge.from] = pointKey(edge.first) === pointKey(toCoordinate) ? edge.last : edge.first;
    }

    if (!toCoordinate && fromCoordinate) {
      coordinates[edge.to] = pointKey(edge.first) === pointKey(fromCoordinate) ? edge.last : edge.first;
    }
  }

  return coordinates;
};

const stationCoordinates = resolveStationCoordinates();

const normalizeLabelText = (text: string) => text.replace(/\s+/g, ' ').trim();

const stationByEnglishName = new globalThis.Map(stationLabels.map((station) => [station.text, station]));
const stationBySvgLabel = new globalThis.Map([
  ['Major Mohit Sharma Rajendra Nagar', 'RJNM'],
  ['Vishweshwaraiah Moti', 'SVMB'],
  ['Sadar Bazar Cantonment', 'SABR'],
  ['Terminal-1 IGI Airport', 'IGDA'],
]);
const stationBySvgClass = new globalThis.Map([
  ['SABR-PALM IGDA-SABR', 'SABR'],
  ['IGDA-SABR SKVR-IGDA', 'IGDA'],
]);

const createFocusTransform = (point: { x: number; y: number }, scale = ROUTE_CAMERA_SCALE): MapTransform => ({
  scaleX: scale,
  scaleY: scale,
  translateX: VIEWBOX_WIDTH / 2 - point.x * scale,
  translateY: VIEWBOX_HEIGHT / 2 - point.y * scale,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getEventPoint = (
  event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
) => {
  const source = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event;
  return { x: source.clientX, y: source.clientY };
};

const toSvgPoint = (
  event: React.MouseEvent<SVGSVGElement> | React.WheelEvent<SVGSVGElement>,
  svg: SVGSVGElement
) => {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT,
  };
};

const makePathElement = (path: string) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  element.setAttribute('d', path);
  return element;
};

const distanceSquared = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

const findClosestProgressOnPath = (
  measure: SVGPathElement,
  pathLength: number,
  point: { x: number; y: number }
) => {
  const sampleCount = 180;
  let bestLength = 0;
  let bestDistance = Infinity;

  for (let index = 0; index <= sampleCount; index += 1) {
    const sampleLength = (pathLength * index) / sampleCount;
    const samplePoint = measure.getPointAtLength(sampleLength);
    const sampleDistance = distanceSquared(samplePoint, point);

    if (sampleDistance < bestDistance) {
      bestDistance = sampleDistance;
      bestLength = sampleLength;
    }
  }

  let low = clamp(bestLength - pathLength / sampleCount, 0, pathLength);
  let high = clamp(bestLength + pathLength / sampleCount, 0, pathLength);

  for (let index = 0; index < 16; index += 1) {
    const left = low + (high - low) / 3;
    const right = high - (high - low) / 3;
    const leftDistance = distanceSquared(measure.getPointAtLength(left), point);
    const rightDistance = distanceSquared(measure.getPointAtLength(right), point);

    if (leftDistance < rightDistance) {
      high = right;
    } else {
      low = left;
    }
  }

  return clamp((low + high) / 2 / pathLength, 0, 1);
};

const getRouteStops = (
  measure: SVGPathElement,
  pathLength: number,
  routeStationIds: string[]
) => {
  const stationProgresses = routeStationIds
    .map((stationId) => {
      const point = stationCoordinates[stationId];
      if (!point) return null;

      return {
        stationId,
        progress: findClosestProgressOnPath(measure, pathLength, point),
      };
    })
    .filter((stop): stop is { stationId: string; progress: number } => Boolean(stop))
    .sort((a, b) => a.progress - b.progress);

  return stationProgresses.filter((stop, index) => (
    index === 0 || Math.abs(stop.progress - stationProgresses[index - 1].progress) > 0.001
  ));
};

function SvgComponent({
  setPlay,
  play,
  path,
  selectedStationId,
  routeStationIds,
  onActiveStationChange,
  animationMode,
  cinematicZoom,
}: {
  setPlay: React.Dispatch<React.SetStateAction<boolean>>;
  play: boolean;
  path: string;
  selectedStationId: string;
  routeStationIds: string[];
  onActiveStationChange?: (stationId: string | null) => void;
  animationMode: RouteAnimationMode;
  cinematicZoom: CinematicZoomLevel;
}) {
  const { language } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [canExportVideo, setCanExportVideo] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapGroupRef = useRef<SVGGElement | null>(null);
  const trainRef = useRef<SVGGElement | null>(null);
  const routePathRef = useRef<SVGPathElement | null>(null);
  const pathMeasureRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef(0);
  const transformRef = useRef<MapTransform>(fitTransform);
  const pendingTransformRef = useRef<MapTransform | null>(null);
  const transformFrameRef = useRef<number | null>(null);
  const routeProgressRef = useRef(0);
  const dragRef = useRef({
    x: 0,
    y: 0,
    translateX: 0,
    translateY: 0,
  });
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const playRef = useRef(play);
  const routeCameraScale = ROUTE_CAMERA_SCALE * (cinematicZoom / 3);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.querySelectorAll<SVGTextElement>('g.label text').forEach((label) => {
      const stationId = label.dataset.stationId;
      const fallbackName = label.dataset.stationName || normalizeLabelText(label.textContent || '');
      const svgLabelStationId = stationBySvgLabel.get(fallbackName);
      const svgClassStationId = stationBySvgClass.get(label.getAttribute('class') || '');
      const station = stationId
        ? stationLabels.find((item) => item.id === stationId)
        : svgLabelStationId ? stationLabels.find((item) => item.id === svgLabelStationId)
        : svgClassStationId ? stationLabels.find((item) => item.id === svgClassStationId)
        : stationByEnglishName.get(fallbackName);

      if (!station) return;

      label.dataset.stationId = station.id;
      label.dataset.stationName = station.text;

      const localizedName = getLocalizedStationName(station.id, station.text, language);
      const tspans = Array.from(label.querySelectorAll('tspan'));

      if (!tspans.length) {
        label.textContent = localizedName;
        return;
      }

      tspans.forEach((tspan, index) => {
        tspan.textContent = index === 0 ? localizedName : '';
      });
    });
  }, [language]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    setCanExportVideo(typeof VideoEncoder !== 'undefined');
  }, []);

  useEffect(() => () => {
    if (transformFrameRef.current !== null) {
      cancelAnimationFrame(transformFrameRef.current);
    }
  }, []);

  const applyTransform = React.useCallback((nextTransform: MapTransform, immediate = false) => {
    transformRef.current = nextTransform;
    pendingTransformRef.current = nextTransform;

    if (immediate) {
      if (transformFrameRef.current !== null) {
        cancelAnimationFrame(transformFrameRef.current);
        transformFrameRef.current = null;
      }

      mapGroupRef.current?.setAttribute('transform', transformToString(nextTransform));
      pendingTransformRef.current = null;
      return;
    }

    if (transformFrameRef.current !== null) return;

    transformFrameRef.current = requestAnimationFrame(() => {
      transformFrameRef.current = null;
      const pendingTransform = pendingTransformRef.current;
      if (!pendingTransform) return;

      mapGroupRef.current?.setAttribute('transform', transformToString(pendingTransform));
      pendingTransformRef.current = null;
    });
  }, []);

  const setCameraForProgress = React.useCallback((progress: number, cameraScale = routeCameraScale) => {
    const measure = pathMeasureRef.current;
    const train = trainRef.current;
    const pathLength = pathLengthRef.current;
    if (!measure || !train || !pathLength) return;

    const distance = pathLength * progress;
    const point = measure.getPointAtLength(distance);
    const nextPoint = measure.getPointAtLength(clamp(distance + 4, 0, pathLength));
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
    const targetScale = cameraScale;

    routeProgressRef.current = progress;
    train.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    applyTransform({
      scaleX: targetScale,
      scaleY: targetScale,
      translateX: VIEWBOX_WIDTH / 2 - point.x * targetScale,
      translateY: VIEWBOX_HEIGHT / 2 - point.y * targetScale,
    }, true);
  }, [applyTransform, routeCameraScale]);

  useLayoutEffect(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    pathMeasureRef.current = null;
    pathLengthRef.current = 0;

    if (!path) {
      onActiveStationChange?.(null);
      return;
    }

    const measure = makePathElement(path);
    pathMeasureRef.current = measure;
    const length = measure.getTotalLength();
    pathLengthRef.current = length;

    const firstPoint = measure.getPointAtLength(0);
    routeProgressRef.current = 0;
    trainRef.current?.setAttribute('transform', `translate(${firstPoint.x} ${firstPoint.y})`);
    onActiveStationChange?.(routeStationIds[0] || null);
    requestAnimationFrame(() => {
      applyTransform({
        scaleX: routeCameraScale,
        scaleY: routeCameraScale,
        translateX: VIEWBOX_WIDTH / 2 - firstPoint.x * routeCameraScale,
        translateY: VIEWBOX_HEIGHT / 2 - firstPoint.y * routeCameraScale,
      }, true);
    });
  }, [path, routeStationIds, applyTransform, onActiveStationChange, routeCameraScale]);

  useEffect(() => {
    if (!pathLengthRef.current) return;
    setCameraForProgress(routeProgressRef.current);
  }, [routeCameraScale, setCameraForProgress]);

  useGSAP(() => {
    const focusPoint = stationCoordinates[selectedStationId];
    if (!focusPoint || play) return;

    const proxy = { ...transformRef.current };
    const focusedTransform = createFocusTransform(focusPoint, routeCameraScale);
    const tween = gsap.to(proxy, {
      ...focusedTransform,
      duration: 1,
      ease: 'power3.out',
      onUpdate: () =>
        applyTransform({
          scaleX: proxy.scaleX,
          scaleY: proxy.scaleY,
          translateX: proxy.translateX,
          translateY: proxy.translateY,
        }),
      onComplete: () => applyTransform(focusedTransform, true),
    });

    return () => tween.kill();
  }, { dependencies: [selectedStationId, applyTransform, routeCameraScale], revertOnUpdate: true });

  useGSAP(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    const pathLength = pathLengthRef.current;
    if (!path || !pathLength) return;

    const proxy = { progress: 0 };
    const routeStops = getRouteStops(
      pathMeasureRef.current!,
      pathLength,
      routeStationIds
    );
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        applyTransform(transformRef.current, true);
        setPlay(false);
      },
    });

    setCameraForProgress(0);

    if (animationMode === 'smooth') {
      const firstStop = routeStops[0];
      const lastStop = routeStops[routeStops.length - 1];

      if (firstStop && lastStop) {
        proxy.progress = firstStop.progress;
        setCameraForProgress(firstStop.progress);
        timeline.to(proxy, {
          progress: lastStop.progress,
          duration: clamp(Math.abs(lastStop.progress - firstStop.progress) * pathLength / 95, 0.7, 8),
          ease: 'power1.inOut',
          onUpdate: () => setCameraForProgress(proxy.progress),
        });
        timeline.call(() => onActiveStationChange?.(lastStop.stationId));
      }
    } else {
      for (let index = 1; index < routeStops.length; index += 1) {
        const previousStop = routeStops[index - 1];
        const nextStop = routeStops[index];
        const segmentLength = (nextStop.progress - previousStop.progress) * pathLength;

        timeline.to(proxy, {
          progress: nextStop.progress,
          duration: clamp(segmentLength / 95, 0.35, 5),
          ease: 'power2.inOut',
          onUpdate: () => setCameraForProgress(proxy.progress),
        });

        timeline.call(() => {
          onActiveStationChange?.(nextStop.stationId);
        });

        if (index < routeStops.length - 1) {
          timeline.to(proxy, {
            progress: nextStop.progress,
            duration: STATION_DWELL_SECONDS,
            ease: 'none',
          });
        }
      }
    }

    tweenRef.current = timeline;

    if (playRef.current) tweenRef.current.play(0);

    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, { dependencies: [path, routeStationIds, setCameraForProgress, setPlay, applyTransform, onActiveStationChange, animationMode], revertOnUpdate: true });

  useEffect(() => {
    if (!tweenRef.current) return;
    if (play) tweenRef.current.play();
    else tweenRef.current.pause();
  }, [play]);

  const mapControls = useMemo<MapControls>(() => ({
    transform: fitTransform,
    isDragging,
    dragStart: (event) => {
      const point = getEventPoint(event);
      dragRef.current = {
        x: point.x,
        y: point.y,
        translateX: transformRef.current.translateX,
        translateY: transformRef.current.translateY,
      };
      setIsDragging(true);
    },
    dragMove: (event) => {
      if (!isDragging) return;
      const point = getEventPoint(event);
      const rect = svgRef.current?.getBoundingClientRect();
      const scaleX = rect ? VIEWBOX_WIDTH / rect.width : 1;
      const scaleY = rect ? VIEWBOX_HEIGHT / rect.height : 1;

      applyTransform({
        ...transformRef.current,
        translateX: dragRef.current.translateX + (point.x - dragRef.current.x) * scaleX,
        translateY: dragRef.current.translateY + (point.y - dragRef.current.y) * scaleY,
      });
    },
    dragEnd: () => {
      setIsDragging(false);
      applyTransform(transformRef.current, true);
    },
    zoomAt: (scale, event) => {
      if (!svgRef.current) return;
      const point = toSvgPoint(event, svgRef.current);
      const current = transformRef.current;
      const nextScale = clamp(current.scaleX * scale, MIN_MAP_SCALE, MAX_MAP_SCALE);
      const factor = nextScale / current.scaleX;

      applyTransform({
        scaleX: nextScale,
        scaleY: nextScale,
        translateX: point.x - (point.x - current.translateX) * factor,
        translateY: point.y - (point.y - current.translateY) * factor,
      }, true);
    },
    wheelZoom: (event) => {
      event.preventDefault();
      if (!svgRef.current) return;

      const point = toSvgPoint(event, svgRef.current);
      const wheelScale = event.deltaY < 0 ? WHEEL_ZOOM_IN_SCALE : WHEEL_ZOOM_OUT_SCALE;

      const current = transformRef.current;
      const nextScale = clamp(current.scaleX * wheelScale, MIN_MAP_SCALE, MAX_MAP_SCALE);
      const factor = nextScale / current.scaleX;

      applyTransform({
        scaleX: nextScale,
        scaleY: nextScale,
        translateX: point.x - (point.x - current.translateX) * factor,
        translateY: point.y - (point.y - current.translateY) * factor,
      });
    },
  }), [applyTransform, isDragging]);

  const zoomBy = (scale: number) => {
    const current = transformRef.current;
    const nextScale = clamp(current.scaleX * scale, MIN_MAP_SCALE, MAX_MAP_SCALE);

    applyTransform({
      scaleX: nextScale,
      scaleY: nextScale,
      translateX: VIEWBOX_WIDTH / 2 - (VIEWBOX_WIDTH / 2 - current.translateX) * (nextScale / current.scaleX),
      translateY: VIEWBOX_HEIGHT / 2 - (VIEWBOX_HEIGHT / 2 - current.translateY) * (nextScale / current.scaleY),
    }, true);
  };

  const focusSelectedStation = () => {
    const focusPoint = stationCoordinates[selectedStationId];
    applyTransform(focusPoint ? createFocusTransform(focusPoint, routeCameraScale) : fitTransform, true);
  };

  const selectedStationPoint = stationCoordinates[selectedStationId];

  const drawSvgToCanvas = React.useCallback(async (
    canvas: HTMLCanvasElement | OffscreenCanvas,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!svgRef.current) return;

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('width', String(width));
    svgClone.setAttribute('height', String(height));
    svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      text,
      tspan {
        font-family: ${EXPORT_FONT_STACK};
      }
    `;
    svgClone.insertBefore(style, svgClone.firstChild);

    const svgText = new XMLSerializer().serializeToString(svgClone);
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));

    try {
      const image = new Image();
      image.decoding = 'sync';
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Could not render map frame.'));
        image.src = url;
      });
      context.fillStyle = '#f4f0e8';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const downloadRouteVideo = React.useCallback(async () => {
    const svg = svgRef.current;
    const measure = pathMeasureRef.current;
    const pathLength = pathLengthRef.current;

    if (!path || !svg || !measure || !pathLength || isExportingVideo) return;

    setIsExportingVideo(true);
    tweenRef.current?.pause();
    setPlay(false);

    const previousTrainTransform = trainRef.current?.getAttribute('transform');
    const previousMapTransform = transformRef.current;

    try {
      const {
        BufferTarget,
        CanvasSource,
        Mp4OutputFormat,
        Output,
        QUALITY_HIGH,
        canEncodeVideo,
      } = await import('mediabunny');

      const rect = svg.getBoundingClientRect();
      const aspectRatio = rect.width && rect.height ? rect.height / rect.width : VIEWBOX_HEIGHT / VIEWBOX_WIDTH;
      const width = 1280;
      const height = Math.round(width * aspectRatio);
      const frameRate = 30;
      const frameDuration = 1 / frameRate;
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');

      if (canvas instanceof HTMLCanvasElement) {
        canvas.width = width;
        canvas.height = height;
      }

      const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

      if (!context) throw new Error('Canvas export is not supported in this browser.');

      await document.fonts?.ready;

      const codec = await canEncodeVideo('avc', { width, height, bitrate: QUALITY_HIGH })
        ? 'avc'
        : null;

      if (!codec) throw new Error('This browser cannot encode MP4 video.');

      const target = new BufferTarget();
      const output = new Output({
        format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
        target,
      });
      const source = new CanvasSource(canvas, {
        codec,
        bitrate: QUALITY_HIGH,
      });

      output.addVideoTrack(source);
      await output.start();

      const routeStops = getRouteStops(measure, pathLength, routeStationIds);
      const firstStop = routeStops[0];
      const lastStop = routeStops[routeStops.length - 1];
      if (!firstStop || !lastStop) throw new Error('Route animation is not ready to export.');

      const smoothDuration = clamp(Math.abs(lastStop.progress - firstStop.progress) * pathLength / 95, 0.7, 8);
      const stepSegments = routeStops.slice(1).map((stop, index) => {
        const previousStop = routeStops[index];
        return {
          from: previousStop.progress,
          to: stop.progress,
          travelDuration: clamp((stop.progress - previousStop.progress) * pathLength / 95, 0.35, 5),
          dwellDuration: index < routeStops.length - 2 ? STATION_DWELL_SECONDS : 0,
        };
      });
      const stepDuration = stepSegments.reduce(
        (duration, segment) => duration + segment.travelDuration + segment.dwellDuration,
        0
      );
      const duration = animationMode === 'smooth' ? smoothDuration : stepDuration;
      const frameCount = Math.max(2, Math.ceil(duration * frameRate));
      const exportCameraScale = routeCameraScale;

      for (let frame = 0; frame <= frameCount; frame += 1) {
        const timestamp = frame * frameDuration;
        let progress = firstStop.progress;

        if (animationMode === 'smooth') {
          const linearProgress = clamp(timestamp / smoothDuration, 0, 1);
          const easedProgress = linearProgress < 0.5
            ? 2 * linearProgress * linearProgress
            : 1 - Math.pow(-2 * linearProgress + 2, 2) / 2;
          progress = firstStop.progress + (lastStop.progress - firstStop.progress) * easedProgress;
        } else {
          let remainingTime = timestamp;
          for (const segment of stepSegments) {
            if (remainingTime <= segment.travelDuration) {
              const segmentProgress = clamp(remainingTime / segment.travelDuration, 0, 1);
              const easedProgress = segmentProgress < 0.5
                ? 2 * segmentProgress * segmentProgress
                : 1 - Math.pow(-2 * segmentProgress + 2, 2) / 2;
              progress = segment.from + (segment.to - segment.from) * easedProgress;
              break;
            }

            remainingTime -= segment.travelDuration;
            progress = segment.to;

            if (remainingTime <= segment.dwellDuration) break;
            remainingTime -= segment.dwellDuration;
          }
        }

        setCameraForProgress(progress, exportCameraScale);
        await drawSvgToCanvas(canvas, context, width, height);
        await source.add(timestamp, frameDuration, { keyFrame: frame % frameRate === 0 });
      }

      await output.finalize();
      if (!target.buffer) throw new Error('Video export did not produce a file.');

      const blob = new Blob([target.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delhi-metro-route-${animationMode}.mp4`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : 'Could not export route video.');
    } finally {
      if (previousTrainTransform) {
        trainRef.current?.setAttribute('transform', previousTrainTransform);
      } else {
        trainRef.current?.removeAttribute('transform');
      }
      applyTransform(previousMapTransform, true);
      setIsExportingVideo(false);
    }
  }, [
    animationMode,
    applyTransform,
    drawSvgToCanvas,
    isExportingVideo,
    path,
    routeCameraScale,
    routeStationIds,
    setCameraForProgress,
    setPlay,
  ]);

  return (
    <div className="absolute inset-0">
      <Map
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        mapGroupRef={mapGroupRef}
        train={
          <>
            {selectedStationPoint ? (
              <g transform={`translate(${selectedStationPoint.x} ${selectedStationPoint.y})`} pointerEvents="none">
                <circle r={16} fill="#dc2626" opacity={0.16}>
                  <animate attributeName="r" values="10;24;10" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.28;0.04;0.28" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle r={7} fill="#dc2626" stroke="#fff" strokeWidth={2.5} />
              </g>
            ) : null}
            {path ? (
              <>
                <path ref={routePathRef} stroke="transparent" d={path} />
                <path stroke="white" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" d={path} />
                <path stroke="#111827" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d={path} />
                <g
                  ref={trainRef}
                  style={{ willChange: 'auto' }}
                  className={animationMode === 'step' ? 'route-train-step' : 'route-train-smooth'}
                >
                  <MetroTrain
                    width={34}
                    height={30}
                    x={-17}
                    y={-15}
                    aria-hidden="true"
                    focusable="false"
                  />
                </g>
              </>
            ) : null}


          </>
        }
        ref={svgRef}
        zoomFunction={mapControls}
      />

      <div className="absolute right-0 top-0">
        <div className="flex flex-col gap-2 rounded-md border border-white/15  p-2 shadow-lg backdrop-blur">
          <button
            onClick={() => path && setPlay((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded bg-white text-sm font-semibold text-neutral-950 disabled:opacity-40"
            disabled={!path}
            title={play ? 'Pause route' : 'Play route'}
          >
            {play ? 'II' : '▶'}
          </button>
          <button onClick={() => zoomBy(1.2)} className="h-9 w-9 rounded bg-white text-lg font-semibold text-neutral-950" title="Zoom in">
            +
          </button>
          <button onClick={() => zoomBy(0.8)} className="h-9 w-9 rounded bg-white text-lg font-semibold text-neutral-950" title="Zoom out">
            -
          </button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded bg-white text-neutral-950" onClick={focusSelectedStation} title="Center map">
            <DiscIcon />
          </button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded bg-white text-neutral-950" onClick={() => {
            tweenRef.current?.restart().pause();
            setPlay(false);
            onActiveStationChange?.(routeStationIds[0] || null);
            if (pathLengthRef.current) setCameraForProgress(0);
          }} title="Reset route">
            <ResetIcon />
          </button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded bg-white text-neutral-950" onClick={focusSelectedStation} title="Reset map">
            <UpdateIcon />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded bg-white text-neutral-950"
            title="Fullscreen"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
          >
            <EnterFullScreenIcon />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded bg-white text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
            title={canExportVideo ? 'Download route video' : 'Video export is not supported in this browser'}
            aria-label="Download route video"
            aria-busy={isExportingVideo}
            disabled={!path || !canExportVideo || isExportingVideo}
            onClick={downloadRouteVideo}
          >
            {isExportingVideo ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950" />
            ) : (
              <VideoIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SvgComponent);
