/**
 * One-time script to generate a comprehensive US cities list from Census Bureau data.
 *
 * The US Census Bureau publishes "Gazetteer Files" — official lists of every named
 * place in the US (cities, towns, villages, and "census-designated places" or CDPs).
 * Think of it like the government's master address book for every community.
 *
 * This script:
 *   1. Downloads the Places gazetteer zip file from Census.gov
 *   2. Unzips it and extracts each place name and state abbreviation
 *   3. Cleans up the names (removes Census suffixes like "city", "town", "CDP")
 *   4. Formats them as "City, ST" strings and writes to constants/usCities.ts
 *
 * Run with: node scripts/generate-cities.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Census Bureau Gazetteer "Places" file — every named place in the US.
// The national file is only available as a .zip archive.
const GAZETTEER_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip';

// Suffixes the Census adds to distinguish place types.
// We strip these so "Lisle village" becomes just "Lisle".
// Ordered longest-first so "city and borough" is stripped before "city" alone.
const SUFFIXES_TO_STRIP = [
  ' municipality and borough',
  ' consolidated government',
  ' metropolitan government',
  ' unified government',
  ' city and borough',
  ' municipality',
  ' urban county',
  ' village',
  ' borough',
  ' town',
  ' city',
  ' CDP',
];

/**
 * Download the zip, extract the .txt file inside, and return its text content.
 *
 * Node 18+ has a built-in `fetch` but no built-in zip support, so we use the
 * `zlib` module to decompress. The Census zip contains a single .txt file.
 * We use the `AdmZip` approach via the `unzipper` pattern — but to keep it
 * dependency-free, we'll use Node's built-in `child_process` to call PowerShell
 * for unzipping on Windows, or we can parse the zip manually.
 *
 * Simplest cross-platform approach: download to a temp file, use Node's
 * built-in zlib with a minimal zip parser.
 */
async function downloadAndExtract(url) {
  console.log('Downloading Census Bureau Gazetteer zip file...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Minimal zip extraction — the zip format stores files with a "local file header"
  // starting with the bytes PK\x03\x04. We find the compressed data and inflate it.
  // Census gazetteer zips use DEFLATE compression (method 8).
  console.log(`Downloaded ${(buffer.length / 1024).toFixed(0)} KB, extracting...`);

  const { inflateRawSync } = await import('zlib');

  // Parse the zip's central directory to find our .txt file
  let offset = 0;
  while (offset < buffer.length) {
    // Look for local file header signature: PK\x03\x04
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString('utf-8', offset + 30, offset + 30 + fileNameLen);
    const dataStart = offset + 30 + fileNameLen + extraLen;

    if (fileName.endsWith('.txt')) {
      console.log(`Found: ${fileName} (${(uncompressedSize / 1024).toFixed(0)} KB)`);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return buffer.toString('utf-8', dataStart, dataStart + compressedSize);
      } else if (compressionMethod === 8) {
        // DEFLATE
        const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
        const decompressed = inflateRawSync(compressed);
        return decompressed.toString('utf-8');
      } else {
        throw new Error(`Unsupported compression method: ${compressionMethod}`);
      }
    }

    offset = dataStart + compressedSize;
  }

  throw new Error('No .txt file found in the zip archive');
}

function parsePlaces(text) {
  const lines = text.split('\n');

  // First line is the header row — tells us what each column means.
  // The columns we care about:
  //   USPS  = 2-letter state code (e.g. "IL")
  //   NAME  = place name (e.g. "Lisle village")
  const header = lines[0].split('\t').map((h) => h.trim());
  const uspsIndex = header.indexOf('USPS');
  const nameIndex = header.indexOf('NAME');

  if (uspsIndex === -1 || nameIndex === -1) {
    throw new Error(
      `Could not find expected columns. Header: ${header.join(', ')}`
    );
  }

  console.log(`Parsing ${lines.length - 1} rows...`);

  const citySet = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    const state = cols[uspsIndex]?.trim();
    let name = cols[nameIndex]?.trim();

    if (!state || !name) continue;

    // Strip Census suffixes from the name.
    for (const suffix of SUFFIXES_TO_STRIP) {
      if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
        name = name.slice(0, -suffix.length).trim();
        break; // Only strip one suffix
      }
    }

    // Some names have a trailing " (balance)" for independent cities
    name = name.replace(/\s*\(balance\)\s*$/i, '').trim();

    if (name) {
      citySet.add(`${name}, ${state}`);
    }
  }

  return citySet;
}

async function main() {
  const text = await downloadAndExtract(GAZETTEER_URL);
  const citySet = parsePlaces(text);

  // Sort alphabetically and convert to array
  const cities = [...citySet].sort((a, b) =>
    a.localeCompare(b, 'en-US', { sensitivity: 'base' })
  );

  console.log(`Generated ${cities.length} unique places.`);

  // Build the TypeScript file content
  const tsContent = `/**
 * ~${Math.round(cities.length / 1000)}K US places from the Census Bureau Gazetteer.
 * Includes every incorporated city, town, village, and census-designated place.
 * Pre-formatted as "City, ST" and sorted alphabetically.
 *
 * Generated by: node scripts/generate-cities.mjs
 * Source: US Census Bureau 2024 Gazetteer Places file
 */
export const US_CITIES: string[] = [
${cities.map((c) => `  '${c.replace(/'/g, "\\'")}',`).join('\n')}
];
`;

  const outPath = join(__dirname, '..', 'constants', 'usCities.ts');
  writeFileSync(outPath, tsContent, 'utf-8');
  console.log(`Wrote ${cities.length} cities to ${outPath}`);

  // Quick sanity checks
  const hasLisle = cities.some((c) => c.startsWith('Lisle'));
  const hasNewYork = cities.some((c) => c.startsWith('New York'));
  console.log(`Sanity check — "Lisle, IL" present: ${hasLisle}`);
  console.log(`Sanity check — "New York, NY" present: ${hasNewYork}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
