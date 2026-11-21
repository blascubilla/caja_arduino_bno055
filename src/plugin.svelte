<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content itrip">
    {#if !isMobileOrTablet}
        <div
            class="plugin__title plugin__title--chevron-back"
            on:click={() => bcast.emit('rqstOpen', 'menu')}
        >
            {title}
        </div>
    {/if}

    <!-- Fuente de datos -->
    <div class="tabs mb-10">
        <div class="tab clickable" class:active={source === 'file'} on:click={() => (source = 'file')}>
            Archivo
        </div>
        <div class="tab clickable" class:active={source === 'gps'} on:click={() => (source = 'gps')}>
            GPS tablet
        </div>
        <div
            class="tab clickable"
            class:active={source === 'serial'}
            on:click={() => (source = 'serial')}
        >
            USB
        </div>
        <div class="tab clickable" class:active={source === 'http'} on:click={() => (source = 'http')}>
            Wi‑Fi / URL
        </div>
    </div>

    {#if source === 'file'}
        <label class="button button--variant-orange size-s mb-10 file-btn">
            Cargar track (GPX, CSV, NMEA, JSON)
            <input type="file" on:change={onFile} />
        </label>
    {:else if source === 'gps'}
        {#if !geoSupported}
            <p class="size-xs warn">Este navegador no tiene acceso al GPS.</p>
        {:else}
            <p class="size-xs mb-5 hint">
                Usa el GPS de este dispositivo. El pronóstico se mantiene en la hora actual.
            </p>
            <label class="size-xs check mb-10">
                <input type="checkbox" bind:checked={useCompass} disabled={!!live} />
                Rumbo con la brújula (tablet alineada con la proa)
            </label>
        {/if}
    {:else if source === 'serial'}
        {#if !serialSupported}
            <p class="size-xs warn">
                Tu navegador no soporta Web Serial. Usa Chrome o Edge de escritorio.
            </p>
        {:else}
            <div class="row mb-10">
                <span class="size-xs">Baudios</span>
                <select bind:value={baudRate} disabled={!!live}>
                    {#each [4800, 9600, 19200, 38400, 57600, 115200] as b}
                        <option value={b}>{b}</option>
                    {/each}
                </select>
            </div>
        {/if}
    {:else}
        <input
            class="url-input mb-5"
            type="text"
            placeholder="https://mi-itrip.local/data.json"
            bind:value={httpUrl}
            disabled={!!live}
        />
        <div class="row mb-10">
            <span class="size-xs">Cada</span>
            <select bind:value={pollSeconds} disabled={!!live}>
                {#each [1, 2, 5, 10, 30, 60] as s}
                    <option value={s}>{s} s</option>
                {/each}
            </select>
        </div>
    {/if}

    {#if source !== 'file'}
        {#if live}
            <div class="button button--variant-red size-s mb-10" on:click={stopLive}>
                ■ Desconectar
            </div>
        {:else}
            <div
                class="button button--variant-orange size-s mb-10"
                class:disabled={(source === 'serial' && !serialSupported) ||
                    (source === 'gps' && !geoSupported)}
                on:click={startLive}
            >
                ● Conectar en vivo
            </div>
        {/if}
    {/if}

    {#if error}
        <p class="size-xs warn mb-10">{error}</p>
    {/if}

    {#if current}
        <!-- Datos del barco -->
        <div class="card mb-10">
            <div class="grid">
                <div><span class="lbl">Rumbo</span>{fmtDeg(current.heading)}</div>
                <div><span class="lbl">SOG</span>{fmt(current.sog, 1)} kn</div>
                <div><span class="lbl">COG</span>{fmtDeg(current.cog)}</div>
                <div><span class="lbl">Escora</span>{fmt(current.roll, 0)}°</div>
                <div><span class="lbl">Cabeceo</span>{fmt(current.pitch, 0)}°</div>
                <div>
                    <span class="lbl">Hora</span>{current.t
                        ? new Date(current.t).toLocaleTimeString()
                        : '—'}
                </div>
            </div>
        </div>

        <!-- Viento en la posición -->
        <div class="card mb-10 wind">
            {#if windInfo}
                <div class="grid">
                    <div><span class="lbl">TWS</span>{windInfo.speed}</div>
                    <div><span class="lbl">TWD</span>{Math.round(windInfo.dir)}°</div>
                    {#if windInfo.twa !== null}
                        <div>
                            <span class="lbl">TWA</span>{Math.abs(Math.round(windInfo.twa))}°
                            {windInfo.twa >= 0 ? 'Er' : 'Br'}
                        </div>
                        <div><span class="lbl">Rumbo vs viento</span>{pointOfSail(windInfo.twa)}</div>
                    {/if}
                </div>
            {:else}
                <span class="size-xs">{windMsg}</span>
            {/if}
        </div>
    {/if}

    {#if points.length > 1 && !live}
        <!-- Reproducción del track -->
        <div class="mb-10">
            <input
                class="slider"
                type="range"
                min="0"
                max={points.length - 1}
                bind:value={index}
                on:change={() => syncTimestamp(true)}
            />
            <div class="row">
                <div class="button size-xs" on:click={togglePlay}>{playing ? '❚❚' : '▶'}</div>
                <span class="size-xs">{index + 1} / {points.length}</span>
                <div class="button size-xs" on:click={fitTrack}>Encuadrar</div>
            </div>
        </div>
    {/if}

    {#if points.length > 1}
        <div class="size-xs mb-10 stats">
            {stats.distance.toFixed(1)} NM
            {#if stats.duration}· {fmtDuration(stats.duration)}{/if}
            · máx {stats.maxSog.toFixed(1)} kn
        </div>
    {/if}

    <label class="size-xs check">
        <input type="checkbox" bind:checked={syncTime} />
        Sincronizar hora del pronóstico con el track
    </label>
    <label class="size-xs check">
        <input type="checkbox" bind:checked={follow} />
        Seguir al barco
    </label>
    {#if points.length}
        <div class="button size-xs mt-10" on:click={clearTrack}>Borrar track</div>
    {/if}

    <!-- Ruta de referencia (no usa horas, no cambia el pronóstico) -->
    <div class="ref mt-15">
        <div class="size-xs lbl">Ruta de referencia</div>
        {#if refPoints.length}
            <div class="size-xs mb-5">
                <span class="ref-swatch"></span>
                {refName} · {refDistance.toFixed(1)} NM
            </div>
            {#if current && refInfo}
                <div class="size-xs mb-5">
                    Desvío {refInfo.xte.toFixed(2)} NM · Faltan {refInfo.remaining.toFixed(1)} NM
                </div>
            {/if}
            <div class="row">
                <div class="button size-xs" on:click={fitRef}>Encuadrar</div>
                <div class="button size-xs" on:click={clearRef}>Quitar</div>
            </div>
        {:else}
            <label class="button size-xs file-btn">
                Cargar ruta (GPX, CSV, NMEA, JSON)
                <input type="file" on:change={onRefFile} />
            </label>
            <div class="size-xs hint mt-5 mb-5">o pega un enlace al archivo:</div>
            <div class="row">
                <input
                    class="url-input"
                    type="text"
                    placeholder="https://…/ruta.gpx"
                    bind:value={refUrl}
                />
                <div class="button size-xs" on:click={loadRefUrl}>Cargar</div>
            </div>
        {/if}
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { map } from '@windy/map';
    import { isMobileOrTablet } from '@windy/rootScope';
    import { getLatLonInterpolator } from '@windy/interpolator';
    import store from '@windy/store';
    import { wind2obj } from '@windy/utils';
    import metrics from '@windy/metrics';

    import { onDestroy, onMount } from 'svelte';

    import config from './pluginConfig';
    import { parseFile } from './parsers';
    import {
        bearing,
        distanceNm,
        norm360,
        pointOfSail,
        routeLength,
        routeProgress,
        trueWindAngle,
    } from './geo';
    import { createBoatIcon, setBoatRotation, setWindArrow } from './boatIcon';
    import {
        isGeolocationSupported,
        isSerialSupported,
        startGeolocation,
        startHttpPolling,
        startSerial,
    } from './live';

    import type { LiveSource } from './live';
    import type { PartialPoint, TrackPoint } from './types';

    const { title } = config;
    const serialSupported = isSerialSupported();
    const geoSupported = isGeolocationSupported();

    /* ---------------- persisted settings ---------------- */
    const SETTINGS_KEY = 'windy-plugin-itrip-settings';
    const loadSettings = (): Record<string, unknown> => {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        } catch {
            return {};
        }
    };
    const saved = loadSettings();

    let source: 'file' | 'gps' | 'serial' | 'http' = (saved.source as 'file') || 'file';
    let baudRate = (saved.baudRate as number) || 9600;
    let httpUrl = (saved.httpUrl as string) || '';
    let pollSeconds = (saved.pollSeconds as number) || 2;
    let syncTime = saved.syncTime !== false;
    let follow = saved.follow !== false;
    let useCompass = saved.useCompass === true;

    $: try {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ source, baudRate, httpUrl, pollSeconds, syncTime, follow, useCompass }),
        );
    } catch {
        /* storage unavailable */
    }

    /* ---------------- reference route ---------------- */
    const REF_KEY = 'windy-plugin-itrip-ref';
    let refPoints: [number, number][] = [];
    let refName = '';
    let refLine: L.Polyline | null = null;

    $: refDistance = routeLength(refPoints);
    $: refInfo = current && refPoints.length > 1 ? routeProgress(current.lat, current.lon, refPoints) : null;

    function drawRef() {
        refLine?.remove();
        refLine = null;
        if (refPoints.length > 1) {
            refLine = new L.Polyline(refPoints, {
                color: '#00e5ff',
                weight: 2.5,
                opacity: 0.9,
                dashArray: '8 6',
            }).addTo(map);
        }
    }

    function fitRef() {
        if (refLine) {
            map.fitBounds(refLine.getBounds(), { padding: 40 } as never);
        }
    }

    function clearRef() {
        refPoints = [];
        refName = '';
        refLine?.remove();
        refLine = null;
        try {
            localStorage.removeItem(REF_KEY);
        } catch {
            /* ignore */
        }
    }

    let refUrl = '';

    function setRef(name: string, text: string) {
        // Times are ignored: the route is only a visual reference
        const pts = parseFile(name, text);
        if (pts.length < 2) {
            error = 'La ruta necesita al menos 2 posiciones.';
            return;
        }
        refPoints = pts.map(p => [p.lat, p.lon] as [number, number]);
        refName = decodeURIComponent(name.split('/').pop() || 'Ruta').replace(/\.[^.]+$/, '');
        drawRef();
        fitRef();
        try {
            localStorage.setItem(REF_KEY, JSON.stringify({ name: refName, points: refPoints }));
        } catch {
            /* too big for storage: it just won't be remembered */
        }
    }

    async function onRefFile(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }
        error = '';
        try {
            setRef(file.name, await file.text());
        } catch (err) {
            error = `Error leyendo la ruta: ${(err as Error).message}`;
        } finally {
            input.value = '';
        }
    }

    async function loadRefUrl() {
        error = '';
        const url = refUrl.trim();
        if (!/^https:\/\//.test(url)) {
            error = 'El enlace debe empezar por https://';
            return;
        }
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            setRef(url.split('?')[0], await res.text());
        } catch (err) {
            error = `No se pudo descargar la ruta: ${(err as Error).message}`;
        }
    }

    function restoreRef() {
        try {
            const data = JSON.parse(localStorage.getItem(REF_KEY) || 'null');
            if (data && Array.isArray(data.points)) {
                refPoints = data.points;
                refName = data.name || 'Ruta';
                drawRef();
            }
        } catch {
            /* ignore */
        }
    }

    /* ---------------- live helpers: clock + screen ---------------- */
    let nowTimer: ReturnType<typeof setInterval> | null = null;
    let wakeLock: { release: () => Promise<void> } | null = null;

    const setForecastNow = () => {
        if (syncTime) {
            store.set('timestamp', Date.now());
        }
    };

    async function keepScreenOn() {
        try {
            const nav = navigator as unknown as {
                wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> };
            };
            wakeLock = (await nav.wakeLock?.request('screen')) ?? null;
        } catch {
            wakeLock = null;
        }
    }

    /* ---------------- state ---------------- */
    let points: TrackPoint[] = [];
    let index = 0;
    let live: LiveSource | null = null;
    let liveAttitude: PartialPoint = {};
    let error = '';
    let playing = false;
    let playTimer: ReturnType<typeof setInterval> | null = null;

    let windInfo: { speed: string; dir: number; twa: number | null } | null = null;
    let windMsg = 'Calculando viento…';

    /* ---------------- map layers ---------------- */
    let trackShadow: L.Polyline | null = null;
    let trackLine: L.Polyline | null = null;
    let doneLine: L.Polyline | null = null;
    let marker: L.Marker | null = null;

    $: current = points[index] as TrackPoint | undefined;

    $: stats = computeStats(points);

    // Move boat whenever index / points change
    $: if (current) {
        updateBoat(current);
    }

    /* ---------------- helpers ---------------- */
    const fmt = (v: number | undefined, d: number): string =>
        v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(d);
    const fmtDeg = (v: number | undefined): string =>
        v === undefined ? '—' : `${Math.round(norm360(v))}°`;
    const fmtDuration = (ms: number): string => {
        const m = Math.round(ms / 60000);
        return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
    };

    function computeStats(pts: TrackPoint[]) {
        let distance = 0;
        let maxSog = 0;
        for (let i = 1; i < pts.length; i++) {
            distance += distanceNm(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
        }
        for (const p of pts) {
            if (p.sog !== undefined && p.sog > maxSog) {
                maxSog = p.sog;
            }
        }
        const first = pts[0]?.t;
        const last = pts[pts.length - 1]?.t;
        return {
            distance,
            maxSog,
            duration: first !== undefined && last !== undefined ? last - first : 0,
        };
    }

    /** Fill SOG/COG from positions when the device does not send them */
    function enrich(pts: TrackPoint[]): TrackPoint[] {
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            if (b.cog === undefined) {
                b.cog = bearing(a.lat, a.lon, b.lat, b.lon);
            }
            if (b.sog === undefined && a.t !== undefined && b.t !== undefined && b.t > a.t) {
                b.sog = distanceNm(a.lat, a.lon, b.lat, b.lon) / ((b.t - a.t) / 3600000);
            }
        }
        if (pts.length > 1 && pts[0].cog === undefined) {
            pts[0].cog = pts[1].cog;
        }
        return pts;
    }

    /** Heading of the bow: BNO055 heading, falling back to COG */
    const headingOf = (p: TrackPoint): number | undefined => p.heading ?? p.cog;

    /* ---------------- map drawing ---------------- */
    function drawTrack() {
        const latlngs = points.map(p => [p.lat, p.lon] as [number, number]);
        if (!trackLine) {
            trackShadow = new L.Polyline(latlngs, { color: '#000', weight: 5, opacity: 0.45 }).addTo(
                map,
            );
            trackLine = new L.Polyline(latlngs, { color: '#fff', weight: 2, opacity: 0.9 }).addTo(map);
            doneLine = new L.Polyline([], { color: '#ff2d6f', weight: 3, opacity: 1 }).addTo(map);
        } else {
            trackShadow?.setLatLngs(latlngs);
            trackLine.setLatLngs(latlngs);
        }
    }

    function updateBoat(p: TrackPoint) {
        if (!marker) {
            marker = new L.Marker([p.lat, p.lon], { icon: createBoatIcon() }).addTo(map);
        } else {
            marker.setLatLng([p.lat, p.lon]);
        }
        setBoatRotation(marker, headingOf(p));

        doneLine?.setLatLngs(points.slice(0, index + 1).map(q => [q.lat, q.lon] as [number, number]));

        if (follow) {
            map.panTo([p.lat, p.lon]);
        }
        updateWind();
    }

    function fitTrack() {
        if (trackLine && points.length > 1) {
            map.fitBounds(trackLine.getBounds(), { padding: 40 } as never);
        }
    }

    function removeMapFeatures() {
        trackShadow?.remove();
        trackLine?.remove();
        doneLine?.remove();
        marker?.remove();
        trackShadow = trackLine = doneLine = null;
        marker = null;
    }

    /* ---------------- wind at boat position ---------------- */
    let windRequest = 0;
    async function updateWind() {
        const p = current;
        if (!p) {
            return;
        }
        const req = ++windRequest;
        if (store.get('overlay') !== 'wind') {
            windInfo = null;
            windMsg = 'Activa la capa de viento para ver TWS / TWA.';
            setWindArrow(marker, null);
            return;
        }
        const interpolate = await getLatLonInterpolator();
        if (req !== windRequest) {
            return; // a newer request is running
        }
        const values = interpolate?.({ lat: p.lat, lon: p.lon });
        if (!Array.isArray(values)) {
            windInfo = null;
            windMsg = 'Sin datos de viento en esta posición.';
            setWindArrow(marker, null);
            return;
        }
        const { dir, wind } = wind2obj(values);
        const hdg = headingOf(p);
        windInfo = {
            speed: metrics.wind.convertValue(wind),
            dir,
            twa: hdg === undefined ? null : trueWindAngle(dir, hdg),
        };
        setWindArrow(marker, dir);
    }

    /* ---------------- forecast time sync ---------------- */
    let lastTsSet = 0;
    function syncTimestamp(force = false) {
        const t = current?.t;
        if (!syncTime || t === undefined || live) {
            return;
        }
        const now = Date.now();
        if (!force && now - lastTsSet < 1500) {
            return; // throttle while playing
        }
        lastTsSet = now;
        try {
            store.set('timestamp', t);
        } catch (e) {
            console.warn('iTrip: timestamp fuera del rango del pronóstico', e);
        }
    }

    /* ---------------- replay ---------------- */
    function togglePlay() {
        if (playing) {
            stopPlay();
            return;
        }
        if (index >= points.length - 1) {
            index = 0;
        }
        playing = true;
        const step = Math.max(1, Math.round(points.length / 600));
        playTimer = setInterval(() => {
            if (index >= points.length - 1) {
                stopPlay();
                syncTimestamp(true);
                return;
            }
            index = Math.min(points.length - 1, index + step);
            syncTimestamp();
        }, 150);
    }

    function stopPlay() {
        playing = false;
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
    }

    /* ---------------- data input ---------------- */
    function setTrack(pts: TrackPoint[]) {
        stopPlay();
        points = enrich(pts);
        index = 0;
        drawTrack();
        fitTrack();
        syncTimestamp(true);
    }

    async function onFile(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }
        error = '';
        try {
            const pts = parseFile(file.name, await file.text());
            if (!pts.length) {
                error = 'No se han encontrado posiciones válidas en el archivo.';
                return;
            }
            const wasFollow = follow;
            follow = false;
            setTrack(pts);
            follow = wasFollow;
        } catch (err) {
            error = `Error leyendo el archivo: ${(err as Error).message}`;
        } finally {
            input.value = '';
        }
    }

    function onLivePoint(p: PartialPoint, hasPosition: boolean) {
        if (!hasPosition) {
            liveAttitude = { ...liveAttitude, ...p };
            // Attitude only (e.g. $HCHDG): rotate the boat without adding a point
            const last = points[points.length - 1];
            if (last) {
                Object.assign(last, p);
                points = points;
            }
            return;
        }
        const pt = { ...liveAttitude, ...p, t: p.t ?? Date.now() } as TrackPoint;
        const prev = points[points.length - 1];
        if (prev && prev.lat === pt.lat && prev.lon === pt.lon && pt.heading === prev.heading) {
            return;
        }
        points.push(pt);
        enrich(points.slice(-2));
        points = points;
        index = points.length - 1;
        drawTrack();
    }

    async function startLive() {
        error = '';
        stopPlay();
        // A live session starts a fresh track (the reference route is kept)
        clearTrack();
        liveAttitude = {};
        try {
            if (source === 'gps') {
                live = await startGeolocation(useCompass, onLivePoint, msg => {
                    error = msg;
                });
            } else if (source === 'serial') {
                live = await startSerial(Number(baudRate), onLivePoint);
            } else {
                if (!/^https?:\/\//.test(httpUrl)) {
                    error = 'Introduce una URL válida (https://…).';
                    return;
                }
                live = startHttpPolling(httpUrl, Number(pollSeconds) * 1000, onLivePoint, msg => {
                    error = msg;
                });
            }
            // Live data is "now": keep the forecast at the device's current time
            setForecastNow();
            nowTimer = setInterval(setForecastNow, 5 * 60 * 1000);
            keepScreenOn();
        } catch (err) {
            error = `No se pudo conectar: ${(err as Error).message}`;
            live = null;
        }
    }

    async function stopLive() {
        const l = live;
        live = null;
        if (nowTimer) {
            clearInterval(nowTimer);
            nowTimer = null;
        }
        wakeLock?.release().catch(() => {});
        wakeLock = null;
        await l?.stop();
    }

    // The screen wake lock is dropped when the tab is hidden; take it again
    const onVisibility = () => {
        if (live && document.visibilityState === 'visible') {
            keepScreenOn();
            setForecastNow();
        }
    };

    function clearTrack() {
        stopPlay();
        points = [];
        index = 0;
        windInfo = null;
        removeMapFeatures();
    }

    /* ---------------- lifecycle ---------------- */
    const onRedraw = () => updateWind();
    const onOverlay = () => updateWind();

    export const onopen = (_params: unknown) => {
        // The iTrip is meant to be shown on top of the wind overlay
        if (store.get('overlay') !== 'wind') {
            store.set('overlay', 'wind');
        }
    };

    onMount(() => {
        bcast.on('redrawFinished', onRedraw);
        store.on('overlay', onOverlay);
        document.addEventListener('visibilitychange', onVisibility);
        restoreRef();
    });

    onDestroy(() => {
        stopPlay();
        stopLive();
        bcast.off('redrawFinished', onRedraw);
        store.off('overlay', onOverlay);
        document.removeEventListener('visibilitychange', onVisibility);
        removeMapFeatures();
        refLine?.remove();
        refLine = null;
    });
</script>

<style lang="less">
    .itrip {
        padding-top: 5px;
    }
    .tabs {
        display: flex;
        gap: 4px;
        .tab {
            flex: 1;
            text-align: center;
            padding: 5px 0;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.08);
            font-size: 12px;
            &.active {
                background: #ff2d6f;
                color: #fff;
            }
        }
    }
    .file-btn {
        display: block;
        text-align: center;
        position: relative;
        overflow: hidden;
        input {
            position: absolute;
            inset: 0;
            opacity: 0;
            cursor: pointer;
        }
    }
    .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }
    .url-input {
        width: 100%;
        box-sizing: border-box;
        padding: 5px;
    }
    .card {
        padding: 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.06);
        &.wind {
            border-left: 4px solid #ffd400;
        }
    }
    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 10px;
        font-size: 14px;
    }
    .lbl {
        display: block;
        font-size: 10px;
        opacity: 0.6;
        text-transform: uppercase;
    }
    .slider {
        width: 100%;
    }
    .check {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
    }
    .warn {
        color: #ffb347;
    }
    .stats {
        opacity: 0.8;
    }
    .hint {
        opacity: 0.75;
    }
    .ref {
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        padding-top: 8px;
    }
    .ref-swatch {
        display: inline-block;
        width: 18px;
        border-top: 3px dashed #00e5ff;
        vertical-align: middle;
        margin-right: 4px;
    }
    .disabled {
        opacity: 0.4;
        pointer-events: none;
    }
</style>
