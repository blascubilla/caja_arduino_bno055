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

/** Initial bearing from point 1 to point 2, degrees */
export const bearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return norm360((Math.atan2(y, x) * 180) / Math.PI);
};
