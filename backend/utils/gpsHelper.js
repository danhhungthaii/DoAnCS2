/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {Number} lat1 - Latitude 1
 * @param {Number} lon1 - Longitude 1
 * @param {Number} lat2 - Latitude 2
 * @param {Number} lon2 - Longitude 2
 * @returns {Number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  return Math.round(distance); // Round to nearest meter
};

/**
 * Check if location is within allowed radius
 * @param {Object} eventLocation - Event coordinates {latitude, longitude}
 * @param {Object} checkInLocation - Check-in coordinates {latitude, longitude}
 * @param {Number} radius - Allowed radius in meters
 * @returns {Boolean} True if within radius
 */
const isWithinRadius = (eventLocation, checkInLocation, radius) => {
  const distance = calculateDistance(
    eventLocation.latitude,
    eventLocation.longitude,
    checkInLocation.latitude,
    checkInLocation.longitude
  );

  return distance <= radius;
};

module.exports = { calculateDistance, isWithinRadius };
