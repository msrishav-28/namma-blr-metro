/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';
import {
  DiscIcon,
  EnterFullScreenIcon,
  ResetIcon,
  UpdateIcon,
} from '@radix-ui/react-icons';
import { a, useSpring } from '@react-spring/web';
import { Zoom } from '@visx/zoom';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { useWindowSize } from 'react-use';

import Map from './metromap';

// -----------------------------------------

const extractFirstAndLastPoints = (path: string, transform: any) => {
  const coordinates = [...path.matchAll(/[-+]?\d*\.?\d+/g)].map(Number);

  const first = { x: coordinates[0], y: coordinates[1] };
  const last = {
    x: coordinates[coordinates.length - 2],
    y: coordinates[coordinates.length - 1],
  };

  return {
    first: applyInitialTransform(first, transform),
    last: applyInitialTransform(last, transform),
  };
};

const applyInitialTransform = (
  point: { x: number; y: number },
  transform: any
) => {
  return {
    x: point.x * transform.scaleX + transform.translateX,
    y: point.y * transform.scaleY + transform.translateY,
  };
};




function SvgComponent({
  setPlay,
  play,
  path,

}: {
  setPlay: React.Dispatch<React.SetStateAction<boolean>>;
  play: boolean;
  path: any

}) {
  const [pathLength, setPathLength] = useState(0);

  const [points, setPoints] = useState({
    first: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
  });


  const initialTransform = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
  };

  // For camera-follow getPointAtLength
  const tempPathRef = React.useRef<SVGPathElement | null>(null);

  React.useLayoutEffect(() => {
    if (!path) return;

    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('d', path);
    tempSvg.appendChild(tempPath);
    document.body.appendChild(tempSvg);

    const length = tempPath.getTotalLength();
    const pts = extractFirstAndLastPoints(path, initialTransform);

    tempSvg.remove();

    setPathLength(length);
    setPoints(pts);
  }, [path]);

  const duration = pathLength * 10;

  const { width, height } = useWindowSize();


  // -----------------------------------------
  // 🔥 Spring with camera follow
  // -----------------------------------------
  const { offsetDistance, scale } = useSpring({
    from: { offsetDistance: '0%', scale: 1 },
    to: { offsetDistance: '100%', scale: 1 },
    pause: !play,
    reset: false,

    immediate: false,
    loop: false,

    config: {
      duration,
      easing: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    },

    // 🚆 CINEMATIC CAMERA FOLLOW HERE
    onChange: ({ value }) => {
      const val = value.offsetDistance;
      if (!val) return;

      const percent = parseFloat(val) / 100;
      if (!tempPathRef.current) return;

      const pt = tempPathRef.current.getPointAtLength(pathLength * percent);
      if (!pt) return;

      // ---- cinematic interpolation start → end ----
      const camX = points.first.x + (points.last.x - points.first.x) * percent;
      const camY = points.first.y + (points.last.y - points.first.y) * percent;

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      // Move camera a bit ahead of the train for better composition
      const smoothCamX = lerp(camX, pt.x, 0.75);
      const smoothCamY = lerp(camY, pt.y, 0.75);

      const targetScale = lerp(1.5, 1.5, percent); // zoom-out slightly as we move

      const tx = -smoothCamX + width / 2;
      const ty = -smoothCamY + height / 2;

      // if (percent === 0) {
      //   const clamped = clampCamera(tx, ty, targetScale, width, height);
      //   tx = clamped.x;
      //   ty = clamped.y;
      // }

      zoomRef.current?.setTransformMatrix({
        ...initialTransform,
        translateX: tx,
        translateY: ty,
        scaleX: targetScale,
        scaleY: targetScale,
      });
    },

    onRest(result) {
      if (result.finished) {
        setPlay(false);
      }
    },
  });

  // On path change → restart animation
  useEffect(() => {
    if (!path) return;

  }, [path]);

  // visx zoom reference
  const zoomRef = React.useRef<any>(null);



  return (
    <div className="absolute h-full w-full">
      <Zoom<SVGSVGElement>
        width={width}
        height={height}

        initialTransformMatrix={initialTransform}
      >
        {(zoom) => {
          zoomRef.current = zoom;

          return (
            <div className="relative">
              <Map
                style={{
                  cursor: zoom.isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                }}
                train={
                  <>
                    {/* ACTUAL path with ref for camera follow */}
                    <path
                      stroke="transparent"
                      d={path}
                      ref={tempPathRef}
                    />

                    <path stroke="white" strokeWidth={4} d={path} />
                    <path stroke="black" strokeWidth={2} d={path} />

                    <a.g
                      style={{
                        offsetDistance,
                        scale,
                        offsetPath: `path("${path}")`,
                      }}
                      transform="translate(23.301 51.05)"
                    >
                      <image
                        width={30}
                        height={28}
                        xlinkHref="/images/metro.png"
                        transform="translate(-15 -14)"
                      />
                    </a.g>
                  </>
                }
                ref={zoom.containerRef}
                zoomFunction={zoom}
              />

              {/* UI CONTROLS */}
              <div className="absolute right-4 top-20">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setPlay((p) => !p)}
                    className="h-8 w-8 border bg-neutral-200"
                  >
                    {play ? "⏸️" : "▶️"}
                  </button>

                  <button
                    onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}
                    className="h-8 w-8 border bg-neutral-200"
                  >
                    +
                  </button>

                  <button
                    onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })}
                    className="h-8 w-8 border bg-neutral-200"
                  >
                    -
                  </button>

                  <button
                    onClick={() =>
                      zoom.setTransformMatrix({
                        ...initialTransform,
                        translateX: -points.first.x,
                        translateY: -points.first.y,

                      })
                    }
                    className="h-8 w-8 border bg-neutral-200"
                  >
                    🚝--
                  </button>

                  <button
                    onClick={() =>
                      zoom.setTransformMatrix({
                        ...initialTransform,
                        translateX: -points.last.x,
                        translateY: -points.last.y,

                      })
                    }
                    className="h-8 w-8 border bg-neutral-200"
                  >
                    --🛤️
                  </button>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center border bg-neutral-200"
                    onClick={zoom.center}
                  >
                    <DiscIcon />
                  </button>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center border bg-neutral-200"
                    onClick={zoom.reset}
                  >
                    <ResetIcon />
                  </button>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center bg-neutral-200"
                    onClick={zoom.clear}
                  >
                    <UpdateIcon />
                  </button>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center bg-neutral-200"
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
                </div>
              </div>
            </div>
          );
        }}
      </Zoom>
    </div>
  );
}

export default SvgComponent;
