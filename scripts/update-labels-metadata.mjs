import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const labelsPath = path.join(rootDir, 'src/data/labels.json');
const distanceMetroPath = path.join(rootDir, 'src/data/distancemetro.json');
const metroPath = path.join(rootDir, 'src/data/metro.json');

const normalizeStationName = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/i\.?s\.?b\.?t\.?/g, 'isbt')
    .replace(/\bsec\b/g, 'sector')
    .replace(/\bigi\b/g, 'indira gandhi international')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const aliases = new Map(
  Object.entries({
    Pitampura: 'Pitam Pura',
    Pulbangash: 'Pul Bangash',
    'Rajendra Nagar': 'Rajendra Place',
    'Shaheed Sthal (New Bus Adda)': 'Shaheed Sthal',
    'Guru Teg Bahadur Nagar': 'Guru Tegh Bahadur Nagar',
    'Dilli Haat-INA': 'Dilli Haat INA',
    'Netaji Subhash Place': 'Netaji Subash Place',
    Jhilmil: 'Jhil Mil',
    Chhatarpur: 'Chhattarpur',
    'Janakpuri West': 'Janak Puri West',
    'Janakpuri East': 'Janak Puri East',
    'Ramakrishna Ashram Marg': 'R K Ashram Marg',
    Sikanderpur: 'Sikandarpur',
    'M.G. Road': 'MG Road',
    'Millennium City Centre Gurugram': 'Huda City Centre',
    'Barakhamba Road': ['Barakhambha Road', 'Barakhamba'],
    'Mayur Vihar-1': 'Mayur Vihar Phase-1',
    'Mayur Vihar Extension': 'Mayur Vihar Extention',
    'Noida City Centre': 'Noida City Center',
    'Anand Vihar I.S.B.T': 'Anand Vihar',
    'Bahadurgarh City': 'Bahdurgarh City',
    'Brig. Hoshiar Singh': 'Brigadier Hoshiar Singh',
    Peeragarhi: 'Peera Garhi',
    'JLN Stadium': 'Jawaharlal Nehru Stadium',
    'Ecorts Mujesar': 'Escorts Mujesar',
    'Raja Nahar Singh(Ballabgarh)': 'Raja Nahar Singh',
    'ESI-Basaidarapur': 'ESI BASAI DARAPUR',
    'Sir M.Vishweshwaraiah Moti Bagh': 'Sir Vishweshwaraiah Moti Bagh',
    'South Extention': 'South Extension',
    'Sarai Kale Khan Nizamuddin': 'Sarai Kale Khan Hazrat Nizamuddin',
    'Mayur Vihar Pocket-1': 'Mayur Vihar Pocket I',
    'Tughlakabad Station': 'Tughlakabad',
    'Sector-28': 'Sector 28 Faridabad',
    'Sant Surdas (Sihi)': 'Sant Surdas - Sihi',
    'East Vinod Nagar-Mayur Vihar -II': 'Vinod Nagar East',
    Jafrabad: 'Jaffrabad',
    'Maujpur-Babarpur': 'Maujpur',
    'Jasola Apollo': 'Jasola',
    Dashrathpuri: 'Dashrath Puri',
    'Sadar Bazar Cantonment': 'Sadar Bazaar Cantonment',
    IIT: 'IIT Delhi',
    'R K Puram': 'RK Puram',
    'Airport(T-3)': 'IGI Airport',
    'Phase-1': 'DLF Phase 1',
    'Phase-2': 'DLF Phase 2',
    'Phase-3': 'DLF Phase 3',
    'Sector 55-56': 'Sector 55-66',
  }).map(([labelName, sourceName]) => [
    normalizeStationName(labelName),
    (Array.isArray(sourceName) ? sourceName : [sourceName]).map((name) => normalizeStationName(name)),
  ])
);

const webSourcedMetadata = new Map(
  Object.entries({
    'Yashobhoomi Dwarka Sector - 25': {
      layout: 'Underground',
      Latitude: 28.550816,
      Longitude: 77.045253,
    },
    'Dhansa Bus Stand': {
      layout: 'Underground',
      Latitude: 28.611858,
      Longitude: 76.975426,
    },
    'Noida Electronic City': {
      layout: 'Elevated',
      Latitude: 28.6279412,
      Longitude: 77.37493,
    },
    Karkarduma: {
      layout: 'Elevated',
    },
    'Harkesh Nagar Okhla': {
      layout: 'Elevated',
    },
    'NHPC Chowk': {
      layout: 'Elevated',
      Latitude: 28.4578,
      Longitude: 77.3073,
    },
    Mayapuri: {
      layout: 'Elevated',
    },
  }).map(([stationName, metadata]) => [normalizeStationName(stationName), metadata])
);

const hasCoordinate = (value) => value !== '' && value !== null && value !== undefined;

const isValidCoordinatePair = (latitude, longitude) =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  latitude >= 27.5 &&
  latitude <= 29.5 &&
  longitude >= 76 &&
  longitude <= 78.5;

const makeIndex = (records, getName) => {
  const index = new Map();

  for (const record of records) {
    const key = normalizeStationName(getName(record));
    if (!key || index.has(key)) continue;
    index.set(key, record);
  }

  return index;
};

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const stationLookupKeys = (stationName) => {
  const normalizedName = normalizeStationName(stationName);
  const keys = new Set([normalizedName, ...(aliases.get(normalizedName) || [])].filter(Boolean));
  const noidaSectorMatch = normalizedName.match(/^sector ([0-9]+) noida$/);

  if (noidaSectorMatch) {
    keys.add(`noida sector ${noidaSectorMatch[1]}`);
  }

  return [...keys];
};

const labels = await readJson(labelsPath);
const distanceMetro = await readJson(distanceMetroPath);
const metro = await readJson(metroPath);

const distanceByStation = makeIndex(distanceMetro, (station) => station['Station Names']);
const metroByStation = makeIndex(metro, (station) => station.Station);

const stats = {
  distanceMatches: 0,
  metroCoordinateFallbacks: 0,
  unmatched: [],
};

const enrichedLabels = labels.map((label) => {
  const lookupKeys = stationLookupKeys(label.text);
  const distanceRecord = lookupKeys.map((key) => distanceByStation.get(key)).find(Boolean);
  const metroRecord = lookupKeys.map((key) => metroByStation.get(key)).find(Boolean);
  const webRecord = webSourcedMetadata.get(normalizeStationName(label.text));

  if (distanceRecord) stats.distanceMatches += 1;

  const hasValidDistanceCoordinates = isValidCoordinatePair(distanceRecord?.Latitude, distanceRecord?.Longitude);
  const hasValidMetroCoordinates = isValidCoordinatePair(metroRecord?.Latitude, metroRecord?.Longitude);

  const latitude = hasCoordinate(webRecord?.Latitude)
    ? webRecord.Latitude
    : hasValidDistanceCoordinates
    ? distanceRecord.Latitude
    : hasValidMetroCoordinates
    ? metroRecord.Latitude
    : '';
  const longitude = hasCoordinate(webRecord?.Longitude)
    ? webRecord.Longitude
    : hasValidDistanceCoordinates
    ? distanceRecord.Longitude
    : hasValidMetroCoordinates
    ? metroRecord.Longitude
    : '';

  if (
    !hasValidDistanceCoordinates &&
    hasValidMetroCoordinates
  ) {
    stats.metroCoordinateFallbacks += 1;
  }

  if (!distanceRecord && !metroRecord && !webRecord) {
    stats.unmatched.push(label.text);
  }

  return {
    id: label.id,
    text: label.text,
    layout: webRecord?.layout ?? distanceRecord?.Layout ?? label.layout ?? '',
    Latitude: latitude,
    Longitude: longitude,
  };
});

await writeFile(labelsPath, `${JSON.stringify(enrichedLabels, null, 2)}\n`);

console.log(`Updated ${path.relative(rootDir, labelsPath)}`);
console.log(`Distance matches: ${stats.distanceMatches}/${labels.length}`);
console.log(`Metro coordinate fallbacks: ${stats.metroCoordinateFallbacks}`);
console.log(`Unmatched: ${stats.unmatched.length}`);

if (stats.unmatched.length > 0) {
  console.log(stats.unmatched.map((station) => `- ${station}`).join('\n'));
}
