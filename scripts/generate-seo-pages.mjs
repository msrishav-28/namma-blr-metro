import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const baseUrl = (process.env.SITE_URL || 'http://metro.coolhead.in').replace(/\/$/, '');
const routeLimit = Number.parseInt(process.env.SEO_ROUTE_LIMIT || '1200', 10);
const today = new Date().toISOString().slice(0, 10);

const stations = JSON.parse(await readFile(path.join(rootDir, 'src/data/labels.json'), 'utf8'))
  .filter((station) => station.id && station.text);
const edges = JSON.parse(await readFile(path.join(rootDir, 'src/data/edge.json'), 'utf8'));
const template = await readFile(indexPath, 'utf8');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugifyStationName = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stationById = new Map(stations.map((station) => [station.id, station]));
const stationSlug = (stationId) => slugifyStationName(stationById.get(stationId)?.text || stationId);
const stationPathname = (stationId) => `/stations/${stationSlug(stationId)}/`;
const routePathname = (from, to) => `/routes/${stationSlug(from)}-to-${stationSlug(to)}/`;
const stationName = (stationId) => stationById.get(stationId)?.text || stationId;

const adjacency = new Map(stations.map((station) => [station.id, []]));
for (const edge of edges) {
  adjacency.get(edge.from)?.push(edge.to);
  adjacency.get(edge.to)?.push(edge.from);
}

const findShortestPath = (from, to) => {
  const queue = [from];
  const previous = new Map([[from, null]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current === to) break;

    for (const next of adjacency.get(current) || []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }

  if (!previous.has(to)) return null;

  const path = [];
  let current = to;
  while (current) {
    path.unshift(current);
    current = previous.get(current);
  }

  return path;
};

const estimateFare = (stops) => {
  if (stops <= 2) return 10;
  if (stops <= 5) return 20;
  if (stops <= 12) return 30;
  if (stops <= 21) return 40;
  if (stops <= 32) return 50;
  return 60;
};

const edgeFor = (from, to) =>
  edges.find((edge) => edge.from === from && edge.to === to) ||
  edges.find((edge) => edge.from === to && edge.to === from);

const routeSummary = (from, to) => {
  const pathIds = findShortestPath(from, to);
  if (!pathIds) return null;

  const interchanges = pathIds.slice(1, -1).filter((stationId, index) => {
    const routeIndex = index + 1;
    const previousEdge = edgeFor(pathIds[routeIndex - 1], stationId);
    const nextEdge = edgeFor(stationId, pathIds[routeIndex + 1]);
    return previousEdge && nextEdge && previousEdge.stroke !== nextEdge.stroke;
  });

  const distance = Math.max(0, pathIds.length - 1);

  return {
    from,
    to,
    fromName: stationName(from),
    toName: stationName(to),
    pathIds,
    stops: distance,
    fare: estimateFare(distance),
    estimatedMinutes: Math.max(2, distance * 2),
    interchanges,
  };
};

const setTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const renderHtml = ({ title, description, keywords, canonicalPath, body, schema }) => {
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  let html = template;

  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  html = setTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<meta\s+name="keywords"[\s\S]*?\/>/, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = setTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = setTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json">${JSON.stringify(schema)}</script>\n  </head>`
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  return html;
};

const writePage = async (pathname, html) => {
  const outputDir = path.join(distDir, pathname);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html);
};

const stationPage = (station) => {
  const pathname = stationPathname(station.id);
  const title = `${station.text} Metro Station | Delhi Metro Route Planner`;
  const description = `Plan Delhi Metro routes from ${station.text} metro station. Check route options, estimated fare, travel time, stop count, and interchange details.`;
  const keywords = `${station.text} metro station, ${station.text} Delhi Metro route, metro from ${station.text}, Delhi Metro fare from ${station.text}`;
  const connectedStations = [...new Set((adjacency.get(station.id) || []).map(stationName))];
  const body = `
    <main class="seo-prerender">
      <h1>${escapeHtml(station.text)} Metro Station</h1>
      <p>${escapeHtml(description)}</p>
      <p>Connected stations: ${escapeHtml(connectedStations.join(', ') || 'Use the route planner to explore nearby stations')}.</p>
      <a href="/">Open Delhi Metro route planner</a>
    </main>`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TrainStation',
    name: `${station.text} Metro Station`,
    url: `${baseUrl}${pathname}`,
    containedInPlace: 'Delhi Metro',
  };

  return { pathname, html: renderHtml({ title, description, keywords, canonicalPath: pathname, body, schema }) };
};

const routePage = (route) => {
  const pathname = routePathname(route.from, route.to);
  const title = `${route.fromName} to ${route.toName} Metro Route | Fare, Time & Stops`;
  const interchangeText = route.interchanges.length
    ? ` Interchange at ${route.interchanges.map(stationName).join(', ')}.`
    : ' No interchange is usually needed for this route.';
  const description = `Plan the Delhi Metro route from ${route.fromName} to ${route.toName}. Estimated fare Rs ${route.fare}, ${route.estimatedMinutes} minutes, ${route.stops} stops.${interchangeText}`;
  const keywords = `${route.fromName} to ${route.toName} metro route, ${route.fromName} to ${route.toName} metro fare, Delhi Metro ${route.fromName} ${route.toName}, ${route.fromName} to ${route.toName} travel time`;
  const body = `
    <main class="seo-prerender">
      <h1>${escapeHtml(route.fromName)} to ${escapeHtml(route.toName)} Metro Route</h1>
      <p>${escapeHtml(description)}</p>
      <dl>
        <dt>Fare</dt><dd>Rs ${route.fare}</dd>
        <dt>Travel time</dt><dd>${route.estimatedMinutes} minutes</dd>
        <dt>Stops</dt><dd>${route.stops}</dd>
      </dl>
      <p>Stations on this route: ${escapeHtml(route.pathIds.map(stationName).join(' -> '))}.</p>
      <a href="/?from=${encodeURIComponent(route.from)}&amp;to=${encodeURIComponent(route.to)}">Open this route in the planner</a>
    </main>`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: `${route.fromName} to ${route.toName} Delhi Metro route`,
    url: `${baseUrl}${pathname}`,
    departureStation: {
      '@type': 'TrainStation',
      name: route.fromName,
    },
    arrivalStation: {
      '@type': 'TrainStation',
      name: route.toName,
    },
    itinerary: route.pathIds.map((stationId) => stationName(stationId)),
  };

  return { pathname, html: renderHtml({ title, description, keywords, canonicalPath: pathname, body, schema }) };
};

const priorityIds = [
  'RCK',
  'KG',
  'NDI',
  'CTST',
  'MDHS',
  'KJMD',
  'HKS',
  'LJPN',
  'AZU',
  'NSHP',
  'ILOK',
  'DW21',
  'DW',
  'JAMW',
  'BOTA',
  'ANVR',
  'N18',
  'APOT',
  'DACY',
  'ITO',
].filter((stationId) => stationById.has(stationId));

const highDegreeIds = stations
  .map((station) => ({ id: station.id, degree: adjacency.get(station.id)?.length || 0 }))
  .sort((a, b) => b.degree - a.degree)
  .slice(0, 20)
  .map((item) => item.id);
const routeOrigins = [...new Set([...priorityIds, ...highDegreeIds])];

const routes = [];
const seenRoutes = new Set();
for (const origin of routeOrigins) {
  for (const destination of stations.map((station) => station.id)) {
    if (origin === destination || routes.length >= routeLimit) continue;

    for (const [from, to] of [[origin, destination], [destination, origin]]) {
      const key = `${from}:${to}`;
      if (from === to || seenRoutes.has(key) || routes.length >= routeLimit) continue;
      seenRoutes.add(key);

      const route = routeSummary(from, to);
      if (route) routes.push(route);
    }
  }
}

const pages = [
  ...stations.map(stationPage),
  ...routes.map(routePage),
];

for (const page of pages) {
  await writePage(page.pathname, page.html);
}

const sitemapUrls = [
  { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
  ...stations.map((station) => ({
    loc: `${baseUrl}${stationPathname(station.id)}`,
    priority: '0.8',
    changefreq: 'monthly',
  })),
  ...routes.map((route) => ({
    loc: `${baseUrl}${routePathname(route.from, route.to)}`,
    priority: '0.7',
    changefreq: 'monthly',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

await writeFile(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`Generated ${stations.length} station pages, ${routes.length} route pages, and sitemap.xml.`);
