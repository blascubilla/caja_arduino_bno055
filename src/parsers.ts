import type { PartialPoint, TrackPoint } from './types';

/*
 * Parsers for the data produced by the iTrip box (Arduino + GPS + BNO055).
 *
 * Supported inputs:
 *  - GPX (trkpt / rtept / wpt, with <time>, <course>, <speed> and
 *    <extensions> heading/pitch/roll)
 *  - CSV with header (lat, lon, time, heading, pitch, roll, sog, cog ... see ALIASES)
 *    or without header in the order: lat,lon,heading[,sog,pitch,roll]
 *  - NMEA 0183 log ($--RMC, $--GGA, $--HDG/HDT/HDM, $--XDR pitch/roll)
 *  - JSON: array of points, { points: [...] }, a single point, or GeoJSON LineString
 */

const num = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === '') {
        return undefined;
    }
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
};

const parseTime = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === '') {
        return undefined;
    }
    if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v))) {
        const n = Number(v);
        // seconds vs. milliseconds
        return n < 1e11 ? n * 1000 : n;
    }
    const t = Date.parse(String(v));
    return Number.isFinite(t) ? t : undefined;
};

const isValidPos = (p: PartialPoint): p is TrackPoint =>
    typeof p.lat === 'number' &&
    typeof p.lon === 'number' &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lon) <= 180 &&
    !(p.lat === 0 && p.lon === 0);

/* ------------------------------------------------------------------ */
/* Generic object (JSON / CSV row) */

const ALIASES: Record<keyof TrackPoint, string[]> = {
    lat: ['lat', 'latitude', 'latitud', 'y'],
    lon: ['lon', 'lng', 'long', 'longitude', 'longitud', 'x'],
    t: ['t', 'time', 'timestamp', 'ts', 'datetime', 'date', 'fecha', 'hora', 'utc'],
    heading: ['heading', 'hdg', 'yaw', 'rumbo', 'head', 'compass', 'euler_x', 'ex'],
    pitch: ['pitch', 'cabeceo', 'euler_z', 'ez'],
    roll: ['roll', 'heel', 'escora', 'alabeo', 'euler_y', 'ey'],
    sog: ['sog', 'speed', 'velocidad', 'vel', 'kn', 'knots', 'nudos'],
    cog: ['cog', 'course', 'rumbo_fondo', 'track'],
};

const normKey = (k: string): string => k.trim().toLowerCase().replace(/[\s\-()[\]°]/g, '');

const findKey = (obj: Record<string, unknown>, field: keyof TrackPoint): unknown => {
    for (const key of Object.keys(obj)) {
        if (ALIASES[field].includes(normKey(key))) {
            return obj[key];
        }
    }
    return undefined;
};

export const objectToPoint = (obj: Record<string, unknown>): PartialPoint => {
    const p: PartialPoint = {
        lat: num(findKey(obj, 'lat')),
        lon: num(findKey(obj, 'lon')),
        t: parseTime(findKey(obj, 't')),
        heading: num(findKey(obj, 'heading')),
        pitch: num(findKey(obj, 'pitch')),
        roll: num(findKey(obj, 'roll')),
        sog: num(findKey(obj, 'sog')),
        cog: num(findKey(obj, 'cog')),
    };
    // Nested { gps: {lat, lon}, imu: {heading} } style
    for (const v of Object.values(obj)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const nested = objectToPoint(v as Record<string, unknown>);
            for (const k of Object.keys(nested) as (keyof TrackPoint)[]) {
                if (p[k] === undefined && nested[k] !== undefined) {
                    p[k] = nested[k];
                }
            }
        }
    }
    for (const k of Object.keys(p) as (keyof TrackPoint)[]) {
        if (p[k] === undefined) {
            delete p[k];
        }
    }
    return p;
};

/* ------------------------------------------------------------------ */
/* GPX */

export const parseGpx = (text: string): TrackPoint[] => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const nodes = Array.from(doc.querySelectorAll('trkpt, rtept'));
    const list = nodes.length ? nodes : Array.from(doc.querySelectorAll('wpt'));

    const child = (el: Element, names: string[]): string | undefined => {
        for (const d of Array.from(el.getElementsByTagName('*'))) {
            if (names.includes(d.localName.toLowerCase())) {
                return d.textContent ?? undefined;
            }
        }
        return undefined;
    };

    const points: TrackPoint[] = [];
    for (const el of list) {
        const p: PartialPoint = {
            lat: num(el.getAttribute('lat')),
            lon: num(el.getAttribute('lon')),
            t: parseTime(child(el, ['time'])),
            heading: num(child(el, ['heading', 'hdg', 'yaw'])),
            pitch: num(child(el, ['pitch'])),
            roll: num(child(el, ['roll', 'heel'])),
            cog: num(child(el, ['course', 'cog'])),
        };
        const speedMs = num(child(el, ['speed']));
        if (speedMs !== undefined) {
            p.sog = speedMs * 1.943844; // GPX speed is m/s
        }
        if (isValidPos(p)) {
            points.push(p);
        }
    }
    return points;
};

/* ------------------------------------------------------------------ */
/* NMEA 0183 */

const nmeaCoord = (value: string, hemi: string): number | undefined => {
    const v = parseFloat(value);
    if (!Number.isFinite(v)) {
        return undefined;
    }
    const deg = Math.floor(v / 100);
    const dec = deg + (v - deg * 100) / 60;
    return hemi === 'S' || hemi === 'W' ? -dec : dec;
};

const nmeaChecksumOk = (line: string): boolean => {
    const star = line.indexOf('*');
    if (star < 0) {
        return true; // no checksum, accept
    }
    let sum = 0;
    for (let i = 1; i < star; i++) {
        sum ^= line.charCodeAt(i);
    }
    return sum === parseInt(line.slice(star + 1, star + 3), 16);
};

/**
 * Parse a single NMEA sentence into a partial point.
 * `dateHint` (epoch ms of 00:00 UTC of the day) is used for GGA, which has no date.
 */
export const parseNmeaSentence = (
    raw: string,
    dateHint?: number,
): { point: PartialPoint; hasPosition: boolean; dayStart?: number } | null => {
    const line = raw.trim();
    if (!/^[$!]/.test(line) || !nmeaChecksumOk(line)) {
        return null;
    }
    const f = line.split('*')[0].split(',');
    const type = f[0].slice(3).toUpperCase();

    const hmsToMs = (hms: string): number | undefined => {
        if (!/^\d{6}/.test(hms)) {
            return undefined;
        }
        const h = +hms.slice(0, 2);
        const m = +hms.slice(2, 4);
        const s = parseFloat(hms.slice(4));
        return ((h * 60 + m) * 60 + s) * 1000;
    };

    switch (type) {
        case 'RMC': {
            if (f[2] !== 'A') {
                return { point: {}, hasPosition: false };
            }
            let dayStart: number | undefined;
            if (/^\d{6}$/.test(f[9])) {
                const dd = +f[9].slice(0, 2);
                const mm = +f[9].slice(2, 4);
                const yy = +f[9].slice(4, 6);
                dayStart = Date.UTC(2000 + yy, mm - 1, dd);
            }
            const tod = hmsToMs(f[1]);
            const base = dayStart ?? dateHint;
            return {
                point: {
                    lat: nmeaCoord(f[3], f[4]),
                    lon: nmeaCoord(f[5], f[6]),
                    sog: num(f[7]),
                    cog: num(f[8]),
                    t: base !== undefined && tod !== undefined ? base + tod : undefined,
                },
                hasPosition: true,
                dayStart,
            };
        }
        case 'GGA': {
            if (!f[6] || f[6] === '0') {
                return { point: {}, hasPosition: false };
            }
            const tod = hmsToMs(f[1]);
            return {
                point: {
                    lat: nmeaCoord(f[2], f[3]),
                    lon: nmeaCoord(f[4], f[5]),
                    t: dateHint !== undefined && tod !== undefined ? dateHint + tod : undefined,
                },
                hasPosition: true,
            };
        }
        case 'HDG': {
            // magnetic heading + optional variation
            const h = num(f[1]);
            const varDeg = num(f[4]);
            if (h === undefined) {
                return null;
            }
            const variation = varDeg === undefined ? 0 : f[5] === 'W' ? -varDeg : varDeg;
            return { point: { heading: h + variation }, hasPosition: false };
        }
        case 'HDT':
        case 'HDM': {
            const h = num(f[1]);
            return h === undefined ? null : { point: { heading: h }, hasPosition: false };
        }
        case 'XDR': {
            // $IIXDR,A,-2.1,D,PTCH,A,5.4,D,ROLL*hh
            const point: PartialPoint = {};
            for (let i = 1; i + 3 < f.length; i += 4) {
                const name = (f[i + 3] || '').toUpperCase();
                const v = num(f[i + 1]);
                if (v === undefined) {
                    continue;
                }
                if (name.startsWith('PTCH') || name.startsWith('PITCH')) {
                    point.pitch = v;
                } else if (name.startsWith('ROLL') || name.startsWith('HEEL')) {
                    point.roll = v;
                } else if (name.startsWith('YAW') || name.startsWith('HEAD')) {
                    point.heading = v;
                }
            }
            return { point, hasPosition: false };
        }
        default:
            return null;
    }
};

export const parseNmea = (text: string): TrackPoint[] => {
    const points: TrackPoint[] = [];
    let attitude: PartialPoint = {};
    let dayStart: number | undefined;
    let current: PartialPoint | null = null;

    const flush = () => {
        if (current && isValidPos(current)) {
            points.push({ ...attitude, ...current } as TrackPoint);
        }
        current = null;
    };

    for (const line of text.split(/\r?\n/)) {
        const res = parseNmeaSentence(line, dayStart);
        if (!res) {
            continue;
        }
        if (res.dayStart !== undefined) {
            dayStart = res.dayStart;
        }
        if (!res.hasPosition) {
            attitude = { ...attitude, ...res.point };
            if (current) {
                Object.assign(current, res.point);
            }
            continue;
        }
        // Merge GGA + RMC of the same fix (same time), otherwise start a new point
        if (current && res.point.t !== undefined && current.t === res.point.t) {
            Object.assign(current, res.point);
        } else {
            flush();
            current = { ...attitude, ...res.point };
        }
    }
    flush();
    return points;
};

/* ------------------------------------------------------------------ */
/* CSV */

const splitCsv = (line: string, sep: string): string[] =>
    line.split(sep).map(s => s.trim().replace(/^"(.*)"$/, '$1'));

const detectSep = (line: string): string => {
    const candidates = ['\t', ';', ','];
    let best = ',';
    let bestCount = 0;
    for (const c of candidates) {
        const n = line.split(c).length;
        if (n > bestCount) {
            best = c;
            bestCount = n;
        }
    }
    return best;
};

/** Positional CSV without header: lat,lon,heading[,sog,pitch,roll] */
export const positionalCsvToPoint = (cols: string[]): PartialPoint => {
    const [lat, lon, heading, sog, pitch, roll] = cols.map(c => num(c));
    const p: PartialPoint = { lat, lon, heading, sog, pitch, roll };
    for (const k of Object.keys(p) as (keyof TrackPoint)[]) {
        if (p[k] === undefined) {
            delete p[k];
        }
    }
    return p;
};

export const parseCsv = (text: string): TrackPoint[] => {
    const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
    if (!lines.length) {
        return [];
    }
    const sep = detectSep(lines[0]);
    const first = splitCsv(lines[0], sep);
    const hasHeader = first.some(c => !Number.isFinite(parseFloat(c)));

    const points: TrackPoint[] = [];
    if (hasHeader) {
        for (const line of lines.slice(1)) {
            const cols = splitCsv(line, sep);
            const obj: Record<string, string> = {};
            first.forEach((h, i) => (obj[h] = cols[i]));
            const p = objectToPoint(obj);
            if (isValidPos(p)) {
                points.push(p);
            }
        }
    } else {
        for (const line of lines) {
            const p = positionalCsvToPoint(splitCsv(line, sep));
            if (isValidPos(p)) {
                points.push(p);
            }
        }
    }
    return points;
};

/* ------------------------------------------------------------------ */
/* JSON */

export const parseJson = (text: string): TrackPoint[] => {
    const data = JSON.parse(text);

    // GeoJSON
    if (data && (data.type === 'FeatureCollection' || data.type === 'Feature')) {
        const features = data.type === 'Feature' ? [data] : data.features;
        const pts: TrackPoint[] = [];
        for (const f of features) {
            const g = f.geometry;
            const coords: number[][] =
                g?.type === 'LineString'
                    ? g.coordinates
                    : g?.type === 'MultiLineString'
                    ? g.coordinates.flat()
                    : g?.type === 'Point'
                    ? [g.coordinates]
                    : [];
            const times: unknown[] = f.properties?.coordTimes || f.properties?.times || [];
            coords.forEach((c, i) => {
                const p: PartialPoint = { lon: c[0], lat: c[1], t: parseTime(times[i]) };
                if (g?.type === 'Point') {
                    Object.assign(p, objectToPoint(f.properties || {}), { lon: c[0], lat: c[1] });
                }
                if (p.t === undefined) {
                    delete p.t;
                }
                if (isValidPos(p)) {
                    pts.push(p);
                }
            });
        }
        return pts;
    }

    const arr: unknown[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.points)
        ? data.points
        : Array.isArray(data?.track)
        ? data.track
        : [data];

    const points: TrackPoint[] = [];
    for (const item of arr) {
        const p = Array.isArray(item)
            ? positionalCsvToPoint(item.map(String))
            : objectToPoint(item as Record<string, unknown>);
        if (isValidPos(p)) {
            points.push(p);
        }
    }
    return points;
};

/* ------------------------------------------------------------------ */

/** Parse a whole file, guessing its format from name and content. */
export const parseFile = (name: string, text: string): TrackPoint[] => {
    const lower = name.toLowerCase();
    const trimmed = text.trimStart();

    let points: TrackPoint[];
    if (lower.endsWith('.gpx') || trimmed.startsWith('<')) {
        points = parseGpx(text);
    } else if (lower.endsWith('.json') || lower.endsWith('.geojson') || /^[[{]/.test(trimmed)) {
        points = parseJson(text);
    } else if (lower.endsWith('.nmea') || /^[$!]/.test(trimmed)) {
        points = parseNmea(text);
    } else {
        points = parseCsv(text);
    }

    // Sort by time when every point has one
    if (points.length && points.every(p => p.t !== undefined)) {
        points.sort((a, b) => (a.t as number) - (b.t as number));
    }
    return points;
};

/**
 * Parses one line of a live stream (USB serial or HTTP response).
 * Accepts NMEA sentences, JSON objects or positional CSV.
 */
export const parseLiveLine = (line: string): { point: PartialPoint; hasPosition: boolean } | null => {
    const l = line.trim();
    if (!l) {
        return null;
    }
    if (/^[$!]/.test(l)) {
        const today = new Date();
        const res = parseNmeaSentence(
            l,
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
        );
        return res ? { point: res.point, hasPosition: res.hasPosition } : null;
    }
    if (l.startsWith('{')) {
        try {
            const p = objectToPoint(JSON.parse(l));
            return { point: p, hasPosition: isValidPos(p) };
        } catch {
            return null;
        }
    }
    const sep = detectSep(l);
    const cols = splitCsv(l, sep);
    if (cols.some(c => !Number.isFinite(parseFloat(c)))) {
        return null; // header or debug text
    }
    const p = positionalCsvToPoint(cols);
    return { point: p, hasPosition: isValidPos(p) };
};

export { isValidPos };
