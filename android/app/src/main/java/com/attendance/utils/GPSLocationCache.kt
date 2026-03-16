package com.attendance.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/**
 * GPSLocationCache - Utility để cache GPS location
 * 
 * Tối ưu:
 * - Lấy GPS trước khi user click button
 * - User không phải đợi GPS loading khi check-in
 * - Tính distance sẵn và hiện feedback ngay
 */
object GPSLocationCache {
    
    private const val TAG = "GPSLocationCache"
    private var cachedLocation: Location? = null
    private var cacheTimestamp: Long = 0
    private const val CACHE_DURATION = 30000L // 30 seconds
    
    /**
     * Fetch và cache GPS location
     */
    fun fetchLocation(
        context: Context,
        onSuccess: (Location) -> Unit,
        onFailure: (String) -> Unit
    ) {
        // Check if cache is still valid
        if (cachedLocation != null && (System.currentTimeMillis() - cacheTimestamp) < CACHE_DURATION) {
            Log.d(TAG, "📍 Using cached location (${System.currentTimeMillis() - cacheTimestamp}ms old)")
            onSuccess(cachedLocation!!)
            return
        }
        
        // Check permission
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "⚠️ Location permission not granted")
            onFailure("Location permission not granted")
            return
        }
        
        try {
            val fusedLocationClient: FusedLocationProviderClient = 
                LocationServices.getFusedLocationProviderClient(context)
            
            Log.d(TAG, "📍 Fetching current location...")
            
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                null
            ).addOnSuccessListener { location ->
                if (location != null) {
                    cachedLocation = location
                    cacheTimestamp = System.currentTimeMillis()
                    Log.d(TAG, "✅ Location cached: ${location.latitude}, ${location.longitude}")
                    onSuccess(location)
                } else {
                    Log.w(TAG, "⚠️ Location is null, trying last known location")
                    tryLastKnownLocation(fusedLocationClient, onSuccess, onFailure)
                }
            }.addOnFailureListener { e ->
                Log.e(TAG, "❌ Failed to get location: ${e.message}")
                tryLastKnownLocation(fusedLocationClient, onSuccess, onFailure)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error fetching location: ${e.message}")
            onFailure("Error: ${e.message}")
        }
    }
    
    /**
     * Try to get last known location as fallback
     */
    private fun tryLastKnownLocation(
        fusedLocationClient: FusedLocationProviderClient,
        onSuccess: (Location) -> Unit,
        onFailure: (String) -> Unit
    ) {
        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    cachedLocation = location
                    cacheTimestamp = System.currentTimeMillis()
                    Log.d(TAG, "✅ Using last known location: ${location.latitude}, ${location.longitude}")
                    onSuccess(location)
                } else {
                    Log.e(TAG, "❌ No location available")
                    onFailure("No location available")
                }
            }.addOnFailureListener { e ->
                Log.e(TAG, "❌ Failed to get last known location: ${e.message}")
                onFailure("Failed: ${e.message}")
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "❌ Security exception: ${e.message}")
            onFailure("Permission denied")
        }
    }
    
    /**
     * Get cached location (may be null)
     */
    fun getCachedLocation(): Location? = cachedLocation
    
    /**
     * Calculate distance between two locations (in meters)
     */
    fun calculateDistance(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return results[0].toDouble()
    }
    
    /**
     * Calculate distance from cached location to target
     */
    fun calculateDistanceFromCache(targetLat: Double, targetLon: Double): Double? {
        val cached = cachedLocation ?: return null
        return calculateDistance(cached.latitude, cached.longitude, targetLat, targetLon)
    }
    
    /**
     * Check if within radius
     */
    fun isWithinRadius(
        currentLat: Double, currentLon: Double,
        targetLat: Double, targetLon: Double,
        radius: Int
    ): Boolean {
        val distance = calculateDistance(currentLat, currentLon, targetLat, targetLon)
        return distance <= radius
    }
    
    /**
     * Clear cache
     */
    fun clearCache() {
        cachedLocation = null
        cacheTimestamp = 0
        Log.d(TAG, "🧹 Location cache cleared")
    }
    
    /**
     * Format distance for display
     */
    fun formatDistance(meters: Double): String {
        return when {
            meters < 1000 -> "${meters.toInt()} m"
            else -> String.format("%.1f km", meters / 1000)
        }
    }
}
