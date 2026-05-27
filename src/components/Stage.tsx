/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Drawer } from 'vaul';


import JourneyInfoPanel from './JourneyInfoPanel';
import SvgComponent from './graphsvg';
import { SearchBox, usePath } from './SearchBox';


function MetroMapStage() {
    const [play, setPlay] = useState(false);
    const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>('220px');


    const path = usePath((state: any) => state.path);
    const route = usePath((state: any) => state.route);
    const selectedFrom = usePath((state: any) => state.selectedFrom);
    const cockpitBody = (
        <>
            <SearchBox
                onFromChange={() => setPlay(false)}
                onRoutePlan={() => {
                    setActiveSnapPoint('128px');
                    setPlay(true);
                }}
            />
            <section className="grid gap-3 border-t border-neutral-200 pt-3 sm:gap-4 sm:pt-5">
                <div>
                    <h2 className="text-lg font-semibold sm:mt-2 sm:text-xl">
                        {route ? `${route.fromName} to ${route.toName}` : 'Choose a route'}
                    </h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">Fare</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? `₹${route.fare}` : '—'}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">Stops</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? route.distance : '—'}</p>
                    </div>
                    <div className="rounded-md bg-neutral-100 p-2 sm:p-3">
                        <p className="text-xs text-neutral-500">Time</p>
                        <p className="mt-1 text-base font-semibold sm:text-lg">{route ? `${route.estimatedMinutes}m` : '—'}</p>
                    </div>
                </div>

                <JourneyInfoPanel route={route} />
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
                            <Drawer.Title className="sr-only">Route planner</Drawer.Title>
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Delhi Metro</p>
                        <h1 className="mt-2 text-2xl font-semibold">Route cockpit</h1>
                    </div>

                    {cockpitBody}
                </aside>
            </div>
        </div>

    )
}

export default MetroMapStage;
