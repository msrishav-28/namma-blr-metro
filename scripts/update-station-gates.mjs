import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const labelsPath = path.join(rootDir, 'src/data/labels.json');
const cachePath = path.join(rootDir, 'node_modules/.cache/dmrc-station-api.json');
const stationApiBaseUrl = 'https://backend.delhimetrorail.com/api/v2/en/station';

const requestHeaders = {
  accept: 'application/json, text/plain, */*',
  origin: 'https://delhimetrorail.com',
  referer: 'https://delhimetrorail.com/',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
};

const sleep = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const normalizeText = (value) =>
  String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasCoordinate = (value) => value !== '' && value !== null && value !== undefined;

const toNumberOrEmpty = (value) => {
  if (!hasCoordinate(value)) return '';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : '';
};

const fetchStation = async (stationCode, cache) => {
  if (cache[stationCode]) return cache[stationCode];

  const response = await fetch(`${stationApiBaseUrl}/${stationCode}`, {
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw new Error(`DMRC station API failed for ${stationCode}: ${response.status} ${response.statusText}`);
  }

  const station = await response.json();
  cache[stationCode] = station;
  await writeJson(cachePath, cache);
  await sleep(120);

  return station;
};

const mapGates = (station) =>
  [...(station.gates || [])]
    .sort((left, right) => {
      const leftNumber = Number(String(left.gate_name || '').replace(/\D+/g, ''));
      const rightNumber = Number(String(right.gate_name || '').replace(/\D+/g, ''));
      return (Number.isFinite(leftNumber) ? leftNumber : 999) - (Number.isFinite(rightNumber) ? rightNumber : 999);
    })
    .map((gate) => ({
      gate: normalizeText(gate.gate_name),
      gateCode: normalizeText(gate.gate_code),
      access: 'Entry / Exit',
      towards: normalizeText(gate.location),
      status: normalizeText(gate.status),
      divyangFriendly: Boolean(gate.divyang_friendly),
      Latitude: toNumberOrEmpty(gate.gate_latitude),
      Longitude: toNumberOrEmpty(gate.gate_longitude),
    }))
    .filter((gate) => gate.gate && gate.towards);

const mapStationFacilities = (station) =>
  (station.station_facility || []).map((facility) => normalizeText(facility.name)).filter(Boolean);

const mapDetailedFacilities = (station) =>
  (station.stations_facilities || []).map((facilityGroup) => ({
    kind: normalizeText(facilityGroup.kind),
    details: (facilityGroup.detail_list || []).map((facility) => ({
      name: normalizeText(facility.facility_name),
      purpose: normalizeText(facility.purpose),
      location: normalizeText(facility.location_description),
      nearestGate: normalizeText(facility.nearest_gate_name),
      nearestGateCode: normalizeText(facility.nearest_gate_code),
    })),
  })).filter((facilityGroup) => facilityGroup.kind || facilityGroup.details.length);

const mapPlatforms = (station) =>
  (station.platforms || []).map((platform) => ({
    name: normalizeText(platform.platform_name),
    code: normalizeText(platform.platform_code),
    towards: normalizeText(platform.train_towards?.station_name),
    towardsCode: normalizeText(platform.train_towards?.station_code),
    secondTowards: normalizeText(platform.train_towards_second?.station_name),
    secondTowardsCode: normalizeText(platform.train_towards_second?.station_code),
  })).filter((platform) => platform.name);

const mapParking = (station) =>
  (station.parkings || []).map((parking) => ({
    provider: normalizeText(parking.provider),
    location: normalizeText(parking.location),
    carCapacity: parking.capacity_car ?? '',
    motorcycleCapacity: parking.capacity_motorcycle ?? '',
    cycleCapacity: parking.capacity_cycle ?? '',
  })).filter((parking) => parking.provider || parking.location);

const mapLifts = (station) =>
  (station.lifts || []).map((lift) => ({
    type: normalizeText(lift.lift_type),
    name: normalizeText(lift.name),
    code: normalizeText(lift.code),
    location: normalizeText(lift.description_location),
    insideOutside: normalizeText(lift.available_outside_inside),
    divyangFriendly: Boolean(lift.divyang_friendly),
    status: Boolean(lift.status),
  })).filter((lift) => lift.name);

const mapNearbyPlaces = (station) => {
  const places = [];

  for (const categoryGroup of station.nearby_places || []) {
    for (const [category, placeTypes] of Object.entries(categoryGroup)) {
      for (const [type, entries] of Object.entries(placeTypes || {})) {
        for (const entry of entries || []) {
          if (!entry?.name) continue;
          places.push({
            category: normalizeText(category),
            type: normalizeText(type),
            name: normalizeText(entry.name),
            connectedWithMetro: Boolean(entry.connected_with_metro),
            distanceKm: entry.distance_from_metro ?? '',
            nearestGate: normalizeText(entry.nearest_gate_name),
            nearestGateCode: normalizeText(entry.nearest_gate_code),
            estimatedWalkingMinutes: entry.estimated_walking_time_min ?? '',
            estimatedPublicTransportMinutes: entry.estimated_pub_transport_time_min ?? '',
          });
        }
      }
    }
  }

  return places;
};

const applyDmrcStationData = (label, station) => ({
  ...label,
  text: label.text,
  dmrcName: normalizeText(station.station_name) || label.dmrcName || '',
  description: normalizeText(station.station_description) || label.description || '',
  layout: normalizeText(station.station_type) || label.layout || '',
  interchange: Boolean(station.interchange),
  Latitude: toNumberOrEmpty(station.latitude) || label.Latitude || '',
  Longitude: toNumberOrEmpty(station.longitude) || label.Longitude || '',
  contact: {
    mobile: normalizeText(station.mobile),
    landline: normalizeText(station.landline),
  },
  gates: mapGates(station),
  stationFacilities: mapStationFacilities(station),
  facilities: mapDetailedFacilities(station),
  platforms: mapPlatforms(station),
  parking: mapParking(station),
  lifts: mapLifts(station),
  nearbyPlaces: mapNearbyPlaces(station),
});

const labels = await readJson(labelsPath, []);
const cache = await readJson(cachePath, {});
const updatedLabels = [];
const failures = [];

for (const [index, label] of labels.entries()) {
  try {
    const station = await fetchStation(label.id, cache);
    const updatedLabel = applyDmrcStationData(label, station);

    updatedLabels.push(updatedLabel);
    console.log(`${index + 1}/${labels.length} ${label.id} ${label.text}: ${updatedLabel.gates.length} gates`);
  } catch (error) {
    failures.push(`${label.id} ${label.text}: ${error.message}`);
    updatedLabels.push(label);
    console.warn(`${index + 1}/${labels.length} ${label.id} ${label.text}: ${error.message}`);
  }
}

await writeJson(labelsPath, updatedLabels);

const missingGates = updatedLabels.filter((station) => !Array.isArray(station.gates) || station.gates.length === 0);
const blankTowards = updatedLabels.flatMap((station) =>
  (station.gates || [])
    .filter((gate) => !gate.towards)
    .map((gate) => `${station.id} ${station.text} ${gate.gate}`)
);

console.log(`Updated ${path.relative(rootDir, labelsPath)}`);
console.log(`Stations with gates: ${updatedLabels.length - missingGates.length}/${updatedLabels.length}`);
console.log(`Blank gate directions: ${blankTowards.length}`);
console.log(`Failures: ${failures.length}`);

if (missingGates.length > 0) {
  console.log('Stations without gates:');
  console.log(missingGates.map((station) => `- ${station.id} ${station.text}`).join('\n'));
}

if (failures.length > 0) {
  console.log('Failed requests:');
  console.log(failures.map((failure) => `- ${failure}`).join('\n'));
}
