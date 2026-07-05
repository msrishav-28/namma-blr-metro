import { ArrowLeftIcon, ExternalLinkIcon, GitHubLogoIcon, GlobeIcon } from '@radix-ui/react-icons';
import type { ReactNode } from 'react';

import alternatives from '../data/open-source-alternatives.json';

type Alternative = (typeof alternatives)[number];

const sourceCodeUrl = 'https://github.com/biomathcode/delhi-metro-react';

const findAlternative = (slug: string): Alternative | undefined =>
    alternatives.find((alternative) => alternative.slug === slug);

function Pill({ children }: { children: string }) {
    return (
        <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {children}
        </span>
    );
}

function LinkButton({
    href,
    children,
    variant = 'primary',
}: {
    href: string;
    children: ReactNode;
    variant?: 'primary' | 'secondary';
}) {
    const className = variant === 'primary'
        ? 'bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
        : 'border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800';

    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${className}`}
        >
            {children}
        </a>
    );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
    return (
        <section className="grid gap-3">
            <h2 className="text-lg font-semibold text-neutral-950 dark:text-zinc-50">{title}</h2>
            <ul className="grid gap-2 text-sm leading-6 text-neutral-700 dark:text-zinc-300">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#009b50]" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function OpenSourceAlternativePage({ slug }: { slug: string }) {
    const alternative = findAlternative(slug);

    if (!alternative) {
        return (
            <main className="min-h-svh bg-[#f4f0e8] p-4 text-neutral-950 dark:bg-zinc-950 dark:text-zinc-50 sm:p-6">
                <div className="mx-auto grid max-w-3xl gap-4">
                    <LinkButton href="/" variant="secondary">
                        <ArrowLeftIcon />
                        Back to planner
                    </LinkButton>
                    <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                        <h1 className="text-2xl font-semibold">Alternative page not found</h1>
                        <p className="text-sm leading-6 text-neutral-700 dark:text-zinc-300">Open the planner or choose one of the published alternative pages.</p>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-svh bg-[#f4f0e8] text-neutral-950 dark:bg-zinc-950 dark:text-zinc-50">
            <div className="mx-auto grid max-w-5xl gap-8 px-4 py-5 sm:px-6 sm:py-8">
                <nav className="flex flex-wrap items-center justify-between gap-3">
                    <LinkButton href="/" variant="secondary">
                        <ArrowLeftIcon />
                        Back to planner
                    </LinkButton>
                    <LinkButton href={sourceCodeUrl} variant="secondary">
                        <GitHubLogoIcon />
                        Source code
                    </LinkButton>
                </nav>

                <header className="grid gap-5">
                    <div className="flex flex-wrap gap-2">
                        <Pill>Free web app</Pill>
                        <Pill>Open source</Pill>
                        <Pill>Apache-2.0</Pill>
                    </div>
                    <div className="grid gap-4">
                        <p className="text-xs font-semibold uppercase text-[#007a3d] dark:text-emerald-400">Delhi Metro Route Planner</p>
                        <h1 className="max-w-4xl text-3xl font-semibold tracking-normal sm:text-5xl">{alternative.headline}</h1>
                        <p className="max-w-3xl text-base leading-7 text-neutral-700 dark:text-zinc-300 sm:text-lg">{alternative.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <LinkButton href="/">
                            <GlobeIcon />
                            Open planner
                        </LinkButton>
                        <LinkButton href={alternative.competitorUrl} variant="secondary">
                            <ExternalLinkIcon />
                            {alternative.competitorLabel}
                        </LinkButton>
                    </div>
                </header>

                <section className="grid gap-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="grid gap-2">
                        <h2 className="text-xl font-semibold">What this alternative covers</h2>
                        <p className="text-sm leading-6 text-neutral-700 dark:text-zinc-300">
                            This project is built for route planning first: station search, map-based navigation, fare estimates,
                            stop count, interchange guidance, route sharing, and journey exports. It is independent from DMRC and
                            keeps the source code public for review and contribution.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <DetailList title={`Good alternative to ${alternative.name} for`} items={alternative.bestFor} />
                        <DetailList title="Important limits" items={alternative.limitations} />
                    </div>
                </section>

                <section className="grid gap-3">
                    <h2 className="text-xl font-semibold">How it compares</h2>
                    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-zinc-800 dark:text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Need</th>
                                    <th className="px-4 py-3 font-semibold">Delhi Metro Route Planner</th>
                                    <th className="px-4 py-3 font-semibold">{alternative.name}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 text-neutral-700 dark:divide-zinc-800 dark:text-zinc-300">
                                <tr>
                                    <td className="px-4 py-3 font-semibold text-neutral-950 dark:text-zinc-50">Route planning</td>
                                    <td className="px-4 py-3">Yes, with map, stops, fare estimate, distance, and interchanges.</td>
                                    <td className="px-4 py-3">Use the official app or site for authoritative passenger information.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-semibold text-neutral-950 dark:text-zinc-50">Source code</td>
                                    <td className="px-4 py-3">Public on GitHub under Apache-2.0.</td>
                                    <td className="px-4 py-3">Official services may not publish their app or website code.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-semibold text-neutral-950 dark:text-zinc-50">Tickets and official notices</td>
                                    <td className="px-4 py-3">Not provided.</td>
                                    <td className="px-4 py-3">Use official DMRC channels for tickets, notices, and support.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <h2 className="text-xl font-semibold">Official context</h2>
                    <p className="text-sm leading-6 text-neutral-700 dark:text-zinc-300">{alternative.officialContext}</p>
                    <p className="text-sm leading-6 text-neutral-700 dark:text-zinc-300">
                        For ticketing, official notices, account issues, refunds, virtual smart-card support, or operational updates,
                        use the official DMRC app or website. For everyday route planning, this open-source planner is designed to be
                        quick, transparent, and easy to share.
                    </p>
                </section>

                <section className="grid gap-3">
                    <h2 className="text-xl font-semibold">Related alternative pages</h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {alternatives.map((related) => (
                            <a
                                key={related.slug}
                                href={`/open-source-free-alternative-to-${related.slug}/`}
                                className="grid min-h-28 gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                                <span className="font-semibold text-neutral-950 dark:text-zinc-50">{related.name}</span>
                                <span className="leading-5 text-neutral-600 dark:text-zinc-400">Free open-source route planner alternative.</span>
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default OpenSourceAlternativePage;
