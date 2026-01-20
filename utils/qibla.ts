export const KAABA_COORDS = {
    latitude: 21.422487,
    longitude: 39.826206,
};

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Calculates the Qibla direction (bearing) from a given location to the Kaaba.
 * Returns the angle in degrees relative to North (0-360).
 */
export function calculateQiblaDirection(
    latitude: number,
    longitude: number
): number {
    const phi1 = toRadians(latitude);
    const lambda1 = toRadians(longitude);
    const phi2 = toRadians(KAABA_COORDS.latitude);
    const lambda2 = toRadians(KAABA_COORDS.longitude);

    const deltaLambda = lambda2 - lambda1;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
        Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let qiblaAngle = toDegrees(Math.atan2(y, x));

    // Normalize to 0-360
    qiblaAngle = (qiblaAngle + 360) % 360;

    return qiblaAngle;
}
