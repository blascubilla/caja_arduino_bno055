/** One sample of the iTrip box: GPS position plus BNO055 orientation. */
export interface TrackPoint {
    lat: number;
    lon: number;
    /** Epoch milliseconds (UTC), if known */
    t?: number;
    /** Heading (yaw) in degrees, 0 = North, clockwise. From BNO055. */
    heading?: number;
    /** Pitch in degrees (BNO055) */
    pitch?: number;
    /** Roll / heel in degrees (BNO055) */
    roll?: number;
    /** Speed over ground in knots */
    sog?: number;
    /** Course over ground in degrees */
    cog?: number;
}

/** Partial update coming from a live stream (NMEA sentences can carry only heading, etc.) */
export type PartialPoint = Partial<TrackPoint>;
