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
