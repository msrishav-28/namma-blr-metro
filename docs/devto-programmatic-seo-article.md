---
title: "I Built a Delhi Metro Route Planner and Added 57,840 SEO Pages"
description: "A practical walkthrough of turning a React/Vite route planner into a programmatic SEO site with static station-to-station pages, sitemap indexes, and hydrated app state."
tags: webdev, react, seo, javascript
cover_image: https://metro.coolhead.in/images/showcase.png
published: false
---

I recently built a free Delhi Metro route planner:

https://metro.coolhead.in/

The first version worked well as an interactive React app. You could pick a source station, pick a destination station, and see the route, estimated fare, stop count, travel time, interchanges, and line-color guidance on the metro map.

But there was a problem.

Most people do not search for "Delhi Metro route planner app". They search for very specific routes:

- Rajiv Chowk to Kashmere Gate metro route
- New Delhi to Airport T3 metro fare
- Hauz Khas to Botanical Garden metro travel time
- Dwarka Sector 21 to Rithala metro route

That meant a single-page app homepage was leaving a lot of useful search demand uncovered.

So I added programmatic SEO pages for every station-to-station combination.

## What I Wanted

I wanted both of these URLs to show the same useful route:

```txt
https://metro.coolhead.in/routes/rajiv-chowk-to-kashmere-gate/
https://metro.coolhead.in/?from=RCK&to=KG
```

The first URL is clean and search-friendly.

The second URL is simple for app state and sharing.

Both should hydrate into the same React planner state with:

- `from` auto-filled
- `to` auto-filled
- route searched automatically
- fare/time/stops/interchanges visible

## The Data Model

The app already had two useful datasets:

- `labels.json`: station IDs and names
- `edge.json`: graph edges between stations, with line colors and SVG paths

Each station has a compact ID:

```json
{
  "id": "RCK",
  "text": "Rajiv Chowk"
}
```

The route page slug comes from the station names:

```txt
Rajiv Chowk -> rajiv-chowk
Kashmere Gate -> kashmere-gate
```

So this:

```txt
RCK -> KG
```

becomes:

```txt
/routes/rajiv-chowk-to-kashmere-gate/
```

## Generating Every Route

There are 241 stations in the app data.

For every ordered source/destination pair, excluding same-station routes, the generator creates a static page:

```txt
241 * 240 = 57,840 route pages
```

Each generated route page includes:

- a route-specific `<title>`
- meta description
- Open Graph metadata
- Twitter metadata
- canonical URL
- JSON-LD
- prerendered route text in the HTML
- a hydration payload for the React app

For example:

```html
<script>
  window.__DELHI_METRO_ROUTE__ = { "from": "RCK", "to": "KG" };
</script>
```

Then the React app reads that payload on startup.

If it exists, it uses it. If not, it falls back to parsing the clean URL. If that is not available, it falls back to query params.

The priority looks like this:

```ts
const seoRouteParams = window.__DELHI_METRO_ROUTE__;
const routePathParams = parseRoutePathname(window.location.pathname);
const queryParams = new URLSearchParams(window.location.search);
```

That makes the static SEO page and the interactive app agree on the same route state.

## Static HTML That Still Becomes an App

A generated route page contains crawlable content like:

```html
<h1>Rajiv Chowk to Kashmere Gate Metro Route</h1>
<p>
  Plan the Delhi Metro route from Rajiv Chowk to Kashmere Gate.
  Estimated fare Rs 20, 8 minutes, 4 stops.
  No interchange is usually needed for this route.
</p>
```

Search engines can read that without running the app.

Users still get the full app after hydration.

That is the useful middle ground: static content for discovery, interactive UI for actual use.

## Sitemap Indexes Matter

Once I generated every route, the sitemap became too large for a single file.

The solution was a sitemap index:

```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://metro.coolhead.in/sitemap-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://metro.coolhead.in/sitemap-2.xml</loc>
  </sitemap>
</sitemapindex>
```

Then `robots.txt` points only to the index:

```txt
User-agent: *
Allow: /

Sitemap: https://metro.coolhead.in/sitemap.xml
```

That way Google Search Console only needs one submitted URL:

```txt
https://metro.coolhead.in/sitemap.xml
```

## Why This Works Better Than a Plain SPA

A plain SPA route planner is useful after the user lands on it.

Programmatic SEO helps users land on the exact route they were searching for.

For example, someone searching for:

```txt
Rajiv Chowk to Kashmere Gate metro route
```

can land directly here:

https://metro.coolhead.in/routes/rajiv-chowk-to-kashmere-gate/

The page is specific, readable, and immediately useful.

## Things I Tried to Avoid

Programmatic SEO can become spammy very quickly.

I tried to avoid that by making every generated page genuinely route-specific:

- real source and destination station names
- calculated fare estimate
- calculated travel time
- stop count
- interchange stations
- station sequence
- direct link into the planner

The goal is not to create thousands of empty pages.

The goal is to create thousands of useful entry points into the same tool.

## The App

You can try the route planner here:

https://metro.coolhead.in/

Example route page:

https://metro.coolhead.in/routes/rajiv-chowk-to-kashmere-gate/

If you are building a public utility, a calculator, a planner, or a search tool, programmatic SEO can be a good fit when each generated page answers a specific user intent.

The key is to generate pages from real data, not from keyword stuffing.

