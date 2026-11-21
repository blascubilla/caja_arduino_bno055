import { parseJson, parseLiveLine } from './parsers';

import type { PartialPoint } from './types';

export type LiveCallback = (point: PartialPoint, hasPosition: boolean) => void;

export interface LiveSource {
    stop: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* USB: Web Serial API (Chrome / Edge desktop) */

interface SerialPortLike {
    open(opts: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
}

interface SerialLike {
    requestPort(): Promise<SerialPortLike>;
}

export const isSerialSupported = (): boolean => 'serial' in navigator;

/**
 * Connects to the iTrip box over USB and reads lines (NMEA, JSON or CSV).
 * Must be called from a user gesture (button click).
 */
export const startSerial = async (baudRate: number, onPoint: LiveCallback): Promise<LiveSource> => {
    const serial = (navigator as unknown as { serial: SerialLike }).serial;
    const port = await serial.requestPort();
    await port.open({ baudRate });

    let stopped = false;
    let reader: ReadableStreamDefaultReader<string> | null = null;
    const decoder = new TextDecoderStream();
    const pipeDone = port.readable
        ? port.readable.pipeTo(decoder.writable as WritableStream<Uint8Array>).catch(() => {})
        : Promise.resolve();

    const loop = async () => {
        reader = decoder.readable.getReader();
        let buffer = '';
        try {
            while (!stopped) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                buffer += value;
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    const res = parseLiveLine(line);
                    if (res) {
                        onPoint(res.point, res.hasPosition);
                    }
                }
            }
        } catch (e) {
            console.warn('iTrip serial read error', e);
        } finally {
            reader.releaseLock();
        }
    };
    loop();

    return {
        stop: async () => {
            stopped = true;
            try {
                await reader?.cancel();
            } catch {
                /* ignore */
            }
            await pipeDone;
            try {
                await port.close();
            } catch {
                /* ignore */
            }
        },
    };
};

/* ------------------------------------------------------------------ */
/* GPS (and optionally compass) of the tablet / phone running Windy */

export const isGeolocationSupported = (): boolean => 'geolocation' in navigator;

type OrientationEventIOS = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationCtorIOS = typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * Uses the device's own GPS. Position fixes give lat/lon/SOG/COG.
 * If `useCompass` is set, the device compass is used as heading (the tablet
 * must be mounted aligned with the bow); otherwise heading falls back to COG.
 * Must be called from a user gesture (iOS asks for compass permission).
 */
export const startGeolocation = async (
    useCompass: boolean,
    onPoint: LiveCallback,
    onError: (msg: string) => void,
): Promise<LiveSource> => {
    let removeCompass = () => {};

    if (useCompass) {
        const Ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtorIOS })
            .DeviceOrientationEvent;
        if (Ctor?.requestPermission) {
            const res = await Ctor.requestPermission().catch(() => 'denied');
            if (res !== 'granted') {
                onError('Permiso de brújula denegado: se usará el rumbo del GPS (COG).');
            }
        }
        const eventName =
            'ondeviceorientationabsolute' in window
                ? 'deviceorientationabsolute'
                : 'deviceorientation';
        let lastEmit = 0;
        const handler = (ev: Event) => {
            const e = ev as OrientationEventIOS;
            let h: number | undefined;
            if (typeof e.webkitCompassHeading === 'number') {
                h = e.webkitCompassHeading; // iOS, already compensated
            } else if (e.alpha !== null && (e.absolute || eventName === 'deviceorientationabsolute')) {
                h = 360 - e.alpha + (screen.orientation?.angle ?? 0);
            }
            const now = Date.now();
            if (h === undefined || now - lastEmit < 250) {
                return;
            }
            lastEmit = now;
            onPoint({ heading: ((h % 360) + 360) % 360 }, false);
        };
        window.addEventListener(eventName, handler);
        removeCompass = () => window.removeEventListener(eventName, handler);
    }

    const watchId = navigator.geolocation.watchPosition(
        pos => {
            const { latitude, longitude, speed, heading } = pos.coords;
            const p: PartialPoint = { lat: latitude, lon: longitude, t: pos.timestamp };
            if (speed !== null && Number.isFinite(speed)) {
                p.sog = speed * 1.943844;
            }
            if (heading !== null && Number.isFinite(heading) && (speed ?? 0) > 0.3) {
                p.cog = heading;
            }
            onPoint(p, true);
            onError('');
        },
        err => {
            onError(
                err.code === err.PERMISSION_DENIED
                    ? 'Permiso de ubicación denegado. Actívalo para windy.com en el navegador.'
                    : `GPS: ${err.message}`,
            );
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );

    return {
        stop: async () => {
            navigator.geolocation.clearWatch(watchId);
            removeCompass();
        },
    };
};

/* ------------------------------------------------------------------ */
/* HTTP polling (e.g. ESP32/ESP8266 web server in the box, or a cloud relay) */

/**
 * Polls `url` every `intervalMs`. The response can be:
 *  - a JSON object with the latest point  {lat, lon, heading, sog, pitch, roll, time}
 *  - a JSON array / {points:[...]} (the last element is used)
 *  - plain text with one or more NMEA / CSV lines
 */
export const startHttpPolling = (
    url: string,
    intervalMs: number,
    onPoint: LiveCallback,
    onError: (msg: string) => void,
): LiveSource => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
        if (stopped) {
            return;
        }
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const text = await res.text();
            const trimmed = text.trim();
            if (/^[[{]/.test(trimmed)) {
                const pts = parseJson(trimmed);
                const last = pts[pts.length - 1];
                if (last) {
                    onPoint(last, true);
                } else {
                    // object with only attitude data
                    const r = parseLiveLine(trimmed.replace(/\s+/g, ' '));
                    if (r) {
                        onPoint(r.point, r.hasPosition);
                    }
                }
            } else {
                for (const line of trimmed.split(/\r?\n/)) {
                    const r = parseLiveLine(line);
                    if (r) {
                        onPoint(r.point, r.hasPosition);
                    }
                }
            }
            onError('');
        } catch (e) {
            onError(
                `No se pudo leer ${url}: ${(e as Error).message}. ` +
                    'Recuerda que Windy es HTTPS: el servidor debe ser HTTPS y enviar CORS (Access-Control-Allow-Origin: *).',
            );
        }
        if (!stopped) {
            timer = setTimeout(tick, intervalMs);
        }
    };
    tick();

    return {
        stop: async () => {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
            }
        },
    };
};
