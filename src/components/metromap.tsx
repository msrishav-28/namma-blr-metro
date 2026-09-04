import React, { forwardRef } from 'react';
import edges from '../data/edge.json';
import stations from '../data/stations-lite.json';

export interface MapTransform {
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
}

export interface MapControls {
    transform: MapTransform;
    isDragging: boolean;
    dragStart: (event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
    dragMove: (event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
    dragEnd: (event?: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => void;
    zoomAt: (scale: number, event: React.MouseEvent<SVGSVGElement>) => void;
    wheelZoom: (event: WheelEvent) => void;
}

interface MapProps {
    style: React.CSSProperties;
    mapGroupRef: React.RefObject<SVGGElement | null>;
    zoomFunction: MapControls;
    train: React.ReactNode;
    onMapClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
}

interface NetworkEdge {
    from: string;
    to: string;
    stroke: string;
    path: string;
    status?: string;
    line?: string;
}

interface LiteStation {
    id: string;
    text: string;
}

const transformToString = ({ scaleX, scaleY, translateX, translateY }: MapTransform) =>
    `matrix(${scaleX} 0 0 ${scaleY} ${translateX} ${translateY})`;

const coordinatePattern = /[-+]?\d*\.?\d+/g;

const stationPoints = (() => {
    const points: Record<string, { x: number; y: number }> = {};
    for (const edge of edges as NetworkEdge[]) {
        const coords = [...edge.path.matchAll(coordinatePattern)].map(Number);
        if (coords.length >= 4) {
            points[edge.from] = { x: coords[0], y: coords[1] };
            points[edge.to] = { x: coords[coords.length - 2], y: coords[coords.length - 1] };
        }
    }
    return points;
})();

const interchangeIds = (() => {
    const count: Record<string, Set<string>> = {};
    for (const edge of edges as NetworkEdge[]) {
        const line = edge.line || edge.stroke;
        (count[edge.from] ??= new Set()).add(line);
        (count[edge.to] ??= new Set()).add(line);
    }
    return new Set(Object.entries(count).filter(([, lines]) => lines.size > 1).map(([id]) => id));
})();

const dashForStatus = (status?: string) => {
    if (status === 'construction') return '10 7';
    if (status === 'planned' || status === 'suburban') return '6 6';
    return undefined;
};

const SvgComponent = forwardRef<SVGSVGElement, MapProps>(
    ({ style, mapGroupRef, zoomFunction, train, onMapClick }: MapProps, ref) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="metro-map"
            viewBox="0 0 1500 1450"
            preserveAspectRatio="xMidYMid meet"
            ref={ref}
            style={style}
            onTouchStart={zoomFunction.dragStart}
            onTouchMove={zoomFunction.dragMove}
            onTouchEnd={zoomFunction.dragEnd}
            onMouseDown={zoomFunction.dragStart}
            onMouseMove={zoomFunction.dragMove}
            onMouseUp={zoomFunction.dragEnd}
            onMouseLeave={zoomFunction.dragEnd}
            onClick={onMapClick}
            onDoubleClick={(event) => zoomFunction.zoomAt(1.18, event)}
        >
            <g ref={mapGroupRef} transform={transformToString(zoomFunction.transform)}>
                <rect x={0} y={0} width={1500} height={1450} fill="#f4f0e8" />
                {(edges as NetworkEdge[]).map((edge, index) => (
                    <path
                        key={`${edge.from}-${edge.to}-${index}`}
                        d={edge.path}
                        fill="none"
                        stroke={edge.stroke}
                        strokeWidth={edge.status === 'operational' ? 6.5 : 5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={dashForStatus(edge.status)}
                        opacity={edge.status === 'operational' ? 1 : 0.82}
                    />
                ))}
                {(stations as LiteStation[]).map((station) => {
                    const point = stationPoints[station.id];
                    if (!point) return null;
                    const interchange = interchangeIds.has(station.id);
                    return (
                        <g key={station.id}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={interchange ? 7 : 4.4}
                                fill="#fff"
                                stroke={interchange ? '#111111' : '#333333'}
                                strokeWidth={interchange ? 2.4 : 1.6}
                            />
                            <text
                                x={point.x + 8}
                                y={point.y - 7}
                                fontSize={interchange ? 9.5 : 8}
                                fontFamily="Inter, system-ui, sans-serif"
                                fill="#222222"
                                style={{ userSelect: 'none', pointerEvents: 'none' }}
                            >
                                {station.text}
                            </text>
                        </g>
                    );
                })}
                {train}
            </g>
        </svg>
    )
);

export default SvgComponent;
