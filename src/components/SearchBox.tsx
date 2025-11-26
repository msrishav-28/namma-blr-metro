/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import SVGPathUtils from '../utils/index';

import { useForm } from 'react-hook-form';
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


export const usePath = create((set) => {
  return {
    path: '',
    setPath: (newPath: string) => set(() => ({ path: newPath })),
    setInverse: (newPath: string) => set(() => ({ path: newPath })),
  };
});


export function SearchBox() {
  const { register, handleSubmit } = useForm();
  const setPath = usePath((state: any) => state.setPath);

  return (
    <form
      onSubmit={handleSubmit((e) => {
        const shortedPath = graph.findShortestPath(e.from, e.to);

        if (!shortedPath) return;

        shortedPath.path;

        const nPath = shortedPath.path;
        const newPath = nPath
          .map((i, num) => {
            if (i === e.to) return '';
            const toRoute = nPath[num + 1];

            const item = edges.find(
              (item) => item.from === i && item.to === toRoute
            )?.path;

            console.log(i, toRoute, item);
            if (item) return item;
            else {
              const second = edges.find(
                (item) => item.from === toRoute && item.to === i
              )?.path || "";
              const inversePath = utils.inversePath(second);
              return inversePath;
            }
          })
          .filter((e) => e !== undefined);

        const newpt = newPath.reverse().join('');
        const inversepath = utils.inversePath(newpt);
        setPath(inversepath);

        console.log(shortedPath.path, newPath, newpt);
      })}
      className='absolute top-2 z-20 flex w-full flex-row justify-center gap-3 bg-neutral-100 bg-transparent'
    >
      <div className='flex flex-row items-center gap-3 '>
        <label
          className=' rounded-full bg-neutral-900 px-4 py-2 text-lg text-white'
          htmlFor='from'
        >
          From
        </label>
        <select {...register('from')} className='rounded-full border-none'>
          {stations.map((e) => (
            <option key={e.id} value={e.id}>
              {e.text}
            </option>
          ))}
        </select>
        <label
          className=' rounded-full bg-neutral-900 px-4 py-2 text-lg text-white'
          htmlFor='from'
        >
          To:
        </label>

        <select {...register('to')} className='rounded-full border-none'>
          {stations.map((e) => (
            <option key={e.id} value={e.id}>
              {e.text}
            </option>
          ))}
        </select>
      </div>
      <button className='rounded-full bg-neutral-900 px-4 py-2 text-white'>
        Search
      </button>
    </form>
  );
}
