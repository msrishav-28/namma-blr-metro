import { getLocalizedStationName, type Language } from '../i18n';
import type { RouteInterchange, RouteStationDetail, RouteSummary } from '../types/route';
import SVGPathUtils from './index';

import rawEdges from '../data/edge.json';
import rawStations from '../data/labels.json';

type Station = {
  id: string;
  text: string;
};

type MetroEdge = {
  from: string;
  to: string;
  stroke: string;
  path: string;
};

export const stations = (rawStations as Station[]).filter((station) => station.id && station.text);
export const edges = rawEdges as MetroEdge[];

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

  findShortestPath(start: string, end: string): { path: string[]; distance: number } | null {
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
    let currentNode: string | null = end;
    while (currentNode !== null) {
      path.unshift(currentNode);
      currentNode = previous.get(currentNode)!;
    }

    if (path.length === 1 && path[0] !== start) return null;
    return { path, distance: distances.get(end)! };
  }

  private getMinDistanceNode(distances: Map<string, number>, visited: Set<string>): GraphNode | null {
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

const uniqueColors = (colors: string[]) => [...new Set(colors.filter(Boolean))];

export const slugifyStationName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getStationSlug = (stationId: string) => {
  const station = stations.find((item) => item.id === stationId);
  return station ? slugifyStationName(station.text) : stationId.toLowerCase();
};

export const getStationBySlug = (slug: string) =>
  stations.find((station) => getStationSlug(station.id) === slug);

export const getStationById = (stationId: string | null | undefined) =>
  stationId ? stations.find((station) => station.id === stationId) : undefined;

export const isStationId = (stationId: string | null | undefined) =>
  Boolean(getStationById(stationId));

export const getRoutePathname = (from: string, to: string) =>
  `/routes/${getStationSlug(from)}-to-${getStationSlug(to)}/`;

export const getStationPathname = (stationId: string) =>
  `/stations/${getStationSlug(stationId)}/`;

export const parseRoutePathname = (pathname: string) => {
  const match = pathname.match(/^\/routes\/(.+)-to-(.+)\/?$/);
  if (!match) return null;

  const from = getStationBySlug(match[1]);
  const to = getStationBySlug(match[2]);
  if (!from || !to) return null;

  return { from: from.id, to: to.id };
};

export const estimateFare = (stops: number) => {
  if (stops <= 2) return 10;
  if (stops <= 5) return 20;
  if (stops <= 12) return 30;
  if (stops <= 21) return 40;
  if (stops <= 32) return 50;
  return 60;
};

export const getStationLineColors = (stationId: string) =>
  uniqueColors(edges
    .filter((edge) => edge.from === stationId || edge.to === stationId)
    .map((edge) => edge.stroke));

const stationName = (id: string, language: Language) => {
  const fallbackName = stations.find((station) => station.id === id)?.text || id;
  return getLocalizedStationName(id, fallbackName, language);
};

const getRouteEdge = (from: string, to: string) =>
  edges.find((edge) => edge.from === from && edge.to === to) ||
  edges.find((edge) => edge.from === to && edge.to === from);

const getRouteStationDetails = (routePath: string[], language: Language): RouteStationDetail[] =>
  routePath.map((stationId, index) => {
    const previousEdge = index > 0 ? getRouteEdge(routePath[index - 1], stationId) : undefined;
    const nextEdge = index < routePath.length - 1 ? getRouteEdge(stationId, routePath[index + 1]) : undefined;

    return {
      id: stationId,
      name: stationName(stationId, language),
      lineColors: uniqueColors([previousEdge?.stroke || '', nextEdge?.stroke || '']),
    };
  });

const getRouteInterchanges = (routePath: string[], language: Language): RouteInterchange[] =>
  routePath.slice(1, -1).flatMap((stationId, index) => {
    const routeIndex = index + 1;
    const previousEdge = getRouteEdge(routePath[routeIndex - 1], stationId);
    const nextEdge = getRouteEdge(stationId, routePath[routeIndex + 1]);

    if (!previousEdge || !nextEdge || previousEdge.stroke === nextEdge.stroke) return [];

    return [{
      id: stationId,
      name: stationName(stationId, language),
      fromColor: previousEdge.stroke,
      toColor: nextEdge.stroke,
    }];
  });

export const buildRoute = (from: string, to: string, language: Language): { svgPath: string; route: RouteSummary } | null => {
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
      )?.path || '';

      return SVGPathUtils.inversePath(reverseEdge);
    })
    .filter((pathSegment) => pathSegment !== undefined);

  const combinedPath = newPath.reverse().join('');
  const svgPath = SVGPathUtils.inversePath(combinedPath);

  return {
    svgPath,
    route: {
      from,
      to,
      fromName: stationName(from, language),
      toName: stationName(to, language),
      stops: shortedPath.path.map((stationId) => stationName(stationId, language)),
      stationDetails: getRouteStationDetails(shortedPath.path, language),
      interchanges: getRouteInterchanges(shortedPath.path, language),
      distance: shortedPath.distance,
      fare: estimateFare(shortedPath.distance),
      estimatedMinutes: Math.max(2, shortedPath.distance * 2),
    },
  };
};
