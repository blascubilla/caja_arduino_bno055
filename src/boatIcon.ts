/**
 * Marker for the iTrip boat: a hull rotated with the BNO055 heading and an
 * outer arrow showing where the true wind comes from (rotated by TWD).
 *
 * Inline styles are used because the marker lives outside the plugin's DOM,
 * so scoped Svelte styles would not reach it.
 */
export const BOAT_SIZE = 64;

export const createBoatIcon = (): L.DivIcon =>
    L.divIcon({
        className: 'itrip-marker',
        html: `
<div style="position:relative;width:${BOAT_SIZE}px;height:${BOAT_SIZE}px;pointer-events:none;">
    <div class="itrip-wind" style="position:absolute;inset:0;transition:transform .4s;display:none;">
        <svg viewBox="0 0 64 64" width="${BOAT_SIZE}" height="${BOAT_SIZE}">
            <path d="M32 2 L39 14 L34 12 L34 20 L30 20 L30 12 L25 14 Z"
                fill="#ffd400" stroke="#000" stroke-width="1" stroke-linejoin="round"/>
        </svg>
    </div>
    <div class="itrip-boat" style="position:absolute;inset:0;transition:transform .4s;">
        <svg viewBox="0 0 64 64" width="${BOAT_SIZE}" height="${BOAT_SIZE}">
            <path d="M32 14 C38 22 40 32 39 50 L25 50 C24 32 26 22 32 14 Z"
                fill="#ff2d6f" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
            <line x1="32" y1="22" x2="32" y2="44" stroke="#fff" stroke-width="1.5"/>
        </svg>
    </div>
</div>`,
        iconSize: [BOAT_SIZE, BOAT_SIZE],
        iconAnchor: [BOAT_SIZE / 2, BOAT_SIZE / 2],
    });

export const setBoatRotation = (marker: L.Marker | null, heading: number | undefined): void => {
    const el = marker?.getElement()?.querySelector<HTMLElement>('.itrip-boat');
    if (el) {
        el.style.transform = `rotate(${heading ?? 0}deg)`;
    }
};

export const setWindArrow = (marker: L.Marker | null, windFrom: number | null): void => {
    const el = marker?.getElement()?.querySelector<HTMLElement>('.itrip-wind');
    if (el) {
        el.style.display = windFrom === null ? 'none' : 'block';
        el.style.transform = `rotate(${windFrom ?? 0}deg)`;
    }
};
