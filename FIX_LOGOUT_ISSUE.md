# Fix for Login/Logout Issue

## Problem
Users were experiencing an issue where the app would automatically log them out immediately after successful login, preventing them from accessing the application.

## Root Cause
The issue was caused by a **race condition** in the session management:

1. When a user logged in, the app saved their session data using Android's DataStore (an asynchronous preference storage)
2. Immediately after saving, the app navigated to the EventListActivity
3. The EventListActivity's `onCreate()` method checked if the user was logged in
4. Due to the asynchronous nature of DataStore, the data might not have been fully persisted yet
5. The `isLoggedIn()` check would return `false`, causing the app to redirect back to the login screen

## Solution
The fix involves three key changes:

### 1. PreferenceManager.kt - Ensure Data Persistence
```kotlin
fun saveStudent(student: Student, deviceId: String) {
    runBlocking {
        context.dataStore.edit { prefs ->
            prefs[STUDENT_DATA] = gson.toJson(student)
            prefs[DEVICE_ID] = deviceId
            prefs[IS_LOGGED_IN] = "true"
        }
        // Đảm bảo dữ liệu đã được lưu vào disk
        kotlinx.coroutines.delay(100)
    }
}
```
- Added a 100ms delay after DataStore edit to ensure data is flushed to disk

### 2. MainActivity.kt - Verify Session Before Navigation
```kotlin
// Delay đủ lâu để đảm bảo DataStore hoàn tất việc lưu trữ
kotlinx.coroutines.delay(1000)

// Xác nhận lại session trước khi chuyển màn hình
if (prefManager.isLoggedIn()) {
    navigateToEventList()
} else {
    Toast.makeText(
        this@MainActivity,
        "Lỗi lưu phiên đăng nhập. Vui lòng thử lại.",
        Toast.LENGTH_LONG
    ).show()
    resetLoginButton()
}
```
- Increased delay from 500ms to 1000ms to allow DataStore to complete
- Added verification check before navigation
- Added error handling if session save fails

### 3. EventListActivity.kt - Remove Premature Session Check
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // ... initialization ...
    
    // Setup UI và load events
    // Session check đã được thực hiện ở MainActivity
    setupUI()
    loadEvents()
}
```
- Removed the immediate `isLoggedIn()` check that was causing false negatives
- Session validation now only happens in MainActivity before navigation

## Testing Instructions

### Manual Testing
1. Clean app data (Settings > Apps > Attendance QR > Storage > Clear Data)
2. Open the app
3. Enter a valid student code (MSSV)
4. Click "Đăng nhập" (Login)
5. Verify that you see the success message
6. Verify that the app navigates to the Event List screen
7. Verify that you are NOT redirected back to the login screen
8. Close the app completely
9. Reopen the app
10. Verify that you remain logged in and see the Event List screen

### Expected Behavior
- ✅ After successful login, user should see the Event List screen
- ✅ User should stay logged in even after closing and reopening the app
- ✅ No automatic logout should occur
- ✅ Session should persist across app restarts

### Rollback Plan
If issues persist:
1. Check device logs: `adb logcat | grep attendance`
2. Verify DataStore is working properly
3. Consider increasing the delay values if on slower devices
4. Check for any exceptions in the logs

## Technical Details

### Why DataStore?
- Modern replacement for SharedPreferences
- Type-safe and asynchronous
- Better error handling
- Uses Kotlin coroutines

### Why the Delays?
- DataStore operations are asynchronous by default
- Even with `runBlocking`, there can be timing issues
- The delays ensure data is fully persisted before reading
- 100ms in PreferenceManager ensures disk flush
- 1000ms in MainActivity ensures read consistency

### Alternative Solutions Considered
1. **Suspend functions instead of runBlocking**: Would require major refactoring
2. **SharedPreferences**: Works but deprecated in favor of DataStore
3. **Callback-based verification**: More complex code structure
4. **Event-based architecture**: Overkill for this simple use case

The current solution is minimal, effective, and maintains code simplicity.

## Related Files
- `/android/app/src/main/java/com/attendance/MainActivity.kt`
- `/android/app/src/main/java/com/attendance/EventListActivity.kt`
- `/android/app/src/main/java/com/attendance/utils/PreferenceManager.kt`
