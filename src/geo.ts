/** Normalize angle to [0, 360) */
export const norm360 = (a: number): number => ((a % 360) + 360) % 360;

/** Normalize angle to (-180, 180] */
export const norm180 = (a: number): number => {
    const n = norm360(a);
    return n > 180 ? n - 360 : n;
};

/**
 * True wind angle relative to the bow.
 * @param windFrom direction the wind blows FROM (meteorological), degrees
 * @param heading boat heading, degrees
 * @returns signed angle: positive = starboard (estribor), negative = port (babor)
 */
export const trueWindAngle = (windFrom: number, heading: number): number =>
    norm180(windFrom - heading);

/** Point of sail in Spanish for a given |TWA| */
export const pointOfSail = (twa: number): string => {
    const a = Math.abs(twa);
    if (a < 35) {
        return 'Proa al viento';
    }
    if (a < 60) {
        return 'Ceñida';
    }
    if (a < 80) {
        return 'Descuartelar';
    }
    if (a < 100) {
        return 'Través';
    }
    if (a < 150) {
        return 'Largo';
    }
    if (a < 170) {
        return 'Aleta';
    }
    return 'Popa';
};

const toRad = (d: number): number => (d * Math.PI) / 180;

/** Great circle distance in nautical miles */
export const distanceNm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3440.065;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

/**
 * Position relative to a reference route (list of [lat, lon]).
 * Uses a local flat projection, accurate enough for a few hundred NM.
 * @returns xte: distance to the route (NM), remaining: distance along the
 *          route from the closest point to its end (NM)
 */
export const routeProgress = (
    lat: number,
    lon: number,
    route: [number, number][],
): { xte: number; remaining: number } | null => {
    if (route.length < 2) {
        return null;
    }
    const kx = 60 * Math.cos(toRad(lat)); // NM per degree of longitude
    const ky = 60;
    let best = Infinity;
    let bestIdx = 0;
    let bestT = 0;
    for (let i = 0; i < route.length - 1; i++) {
        const ax = (route[i][1] - lon) * kx;
        const ay = (route[i][0] - lat) * ky;
        const bx = (route[i + 1][1] - lon) * kx;
        const by = (route[i + 1][0] - lat) * ky;
        const dx = bx - ax;
        const dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
        const px = ax + t * dx;
        const py = ay + t * dy;
        const d = Math.hypot(px, py);
        if (d < best) {
            best = d;
            bestIdx = i;
            bestT = t;
        }
    }
    const [aLat, aLon] = route[bestIdx];
    const [bLat, bLon] = route[bestIdx + 1];
    let remaining = (1 - bestT) * distanceNm(aLat, aLon, bLat, bLon);
    for (let i = bestIdx + 1; i < route.length - 1; i++) {
        remaining += distanceNm(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
    }
    return { xte: best, remaining };
};

/** Total length of a route in NM */
export const routeLength = (route: [number, number][]): number => {
    let d = 0;
    for (let i = 1; i < route.length; i++) {
        d += distanceNm(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1]);
    }
    return d;
};

/** Initial bearing from point 1 to point 2, degrees */
export const bearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return norm360((Math.atan2(y, x) * 180) / Math.PI);
};
