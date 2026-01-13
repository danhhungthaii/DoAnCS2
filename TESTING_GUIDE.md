# Testing Guide - Login/Logout Fix

## Overview
This guide provides comprehensive testing instructions for the login/logout issue fix. The fix addresses a critical bug where users were automatically logged out immediately after successful login.

## Pre-requisites
- Android device or emulator with API level 24+
- Backend server running and accessible
- Valid student codes (MSSV) for testing

## Test Cases

### Test Case 1: Fresh Login (Clean State)
**Objective**: Verify that a new user can log in successfully and stay logged in

**Steps**:
1. Clean app data: Settings > Apps > Attendance QR > Storage > Clear Data
2. Open the app
3. Enter a valid student code (e.g., "SV001", "SV002", etc.)
4. Click "Đăng nhập" button
5. Observe the login process

**Expected Results**:
- ✅ Button shows "Đang đăng nhập..." during login
- ✅ Success toast appears: "Đăng nhập thành công! Chào [Student Name]"
- ✅ App navigates to Event List screen
- ✅ Welcome message shows: "Xin chào, [Student Name]"
- ✅ Student code displays: "MSSV: [Student Code]"
- ✅ **CRITICAL**: App DOES NOT redirect back to login screen

**Failure Indicators**:
- ❌ App redirects back to login screen after success message
- ❌ Toast shows "Vui lòng đăng nhập lại"
- ❌ Error message appears

---

### Test Case 2: Session Persistence Across App Restarts
**Objective**: Verify that login session persists when app is closed and reopened

**Steps**:
1. Complete Test Case 1 successfully (user is logged in)
2. Close the app completely (swipe away from recent apps)
3. Wait 5 seconds
4. Reopen the app from launcher

**Expected Results**:
- ✅ App opens directly to Event List screen
- ✅ Welcome message and student code still displayed
- ✅ **CRITICAL**: User is NOT prompted to log in again

**Failure Indicators**:
- ❌ App opens to login screen
- ❌ Session data is lost

---

### Test Case 3: Invalid Student Code
**Objective**: Verify proper error handling for invalid login attempts

**Steps**:
1. Clean app data
2. Open the app
3. Enter an invalid student code (e.g., "INVALID123")
4. Click "Đăng nhập"

**Expected Results**:
- ✅ Error toast appears: "Không tìm thấy sinh viên với mã INVALID123"
- ✅ User remains on login screen
- ✅ Login button resets to "Đăng nhập"
- ✅ User can try again

**Failure Indicators**:
- ❌ App crashes
- ❌ No error message shown
- ❌ Button stays disabled

---

### Test Case 4: Network Error Handling
**Objective**: Verify proper error handling when backend is unreachable

**Steps**:
1. Clean app data
2. Turn off backend server OR disable internet on device
3. Open the app
4. Enter a valid student code
5. Click "Đăng nhập"

**Expected Results**:
- ✅ Error toast appears with connection error message
- ✅ User remains on login screen
- ✅ Login button resets to "Đăng nhập"
- ✅ User can try again when network is restored

**Failure Indicators**:
- ❌ App crashes
- ❌ App hangs indefinitely
- ❌ No error feedback to user

---

### Test Case 5: Logout Functionality
**Objective**: Verify that logout clears session properly

**Steps**:
1. Log in successfully (Test Case 1)
2. On Event List screen, tap the 3-dot menu in toolbar
3. Select "Đăng xuất" (Logout)

**Expected Results**:
- ✅ App navigates to login screen
- ✅ Session is cleared
- ✅ User must log in again to access Event List

**Failure Indicators**:
- ❌ Logout option doesn't work
- ❌ Session persists after logout

---

### Test Case 6: Rapid Login/Logout Cycles
**Objective**: Verify stability under rapid state changes

**Steps**:
1. Log in successfully
2. Immediately logout
3. Immediately log in again
4. Repeat 3 times

**Expected Results**:
- ✅ Each login succeeds without errors
- ✅ Each logout clears session properly
- ✅ No crashes or unexpected behavior
- ✅ Session state is always consistent

**Failure Indicators**:
- ❌ App crashes
- ❌ Session state becomes corrupted
- ❌ Random logouts occur

---

### Test Case 7: Performance Testing
**Objective**: Verify login performance is acceptable

**Steps**:
1. Clean app data
2. Log in with valid credentials
3. Measure time from clicking login to Event List appearing

**Expected Results**:
- ✅ Login completes in < 3 seconds (with good network)
- ✅ No ANR (Application Not Responding) dialog
- ✅ UI remains responsive during login

**Failure Indicators**:
- ❌ Login takes > 5 seconds
- ❌ ANR dialog appears
- ❌ UI freezes

---

## Device Testing Matrix

Test on various device configurations:

| Device Type | Android Version | Status | Notes |
|-------------|-----------------|--------|-------|
| Emulator    | Android 14 (API 34) | ⬜ | Latest version |
| Emulator    | Android 11 (API 30) | ⬜ | Common version |
| Emulator    | Android 7 (API 24)  | ⬜ | Min SDK version |
| Physical    | [Your device]    | ⬜ | Real device test |

## Regression Testing

Ensure other features still work:

- ⬜ QR Code scanning functionality
- ⬜ Event list loading
- ⬜ Check-in functionality
- ⬜ GPS location verification
- ⬜ Camera permissions
- ⬜ Location permissions

## Logging and Debugging

### View Logs
```bash
# Filter app logs
adb logcat | grep attendance

# View DataStore operations
adb logcat | grep DataStore

# View errors only
adb logcat | grep -E "Error|Exception"
```

### Debug Build
```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Known Issues and Limitations

### Current Implementation
- Uses 500ms delay for Toast display (acceptable UX)
- Assumes single user per device (design choice)
- Requires internet connection for login (expected)

### Not Issues
- First login requires network - this is expected behavior
- Session persists indefinitely - this is by design
- No auto-logout timer - this is intentional

## Sign-Off Checklist

Before approving this fix:

- [ ] All test cases pass
- [ ] Tested on at least 2 different Android versions
- [ ] Tested on at least 1 physical device
- [ ] No crashes observed
- [ ] Performance is acceptable
- [ ] Regression testing complete
- [ ] Documentation reviewed
- [ ] Code review completed

## Rollback Procedure

If critical issues are found:

1. Revert to previous commit:
   ```bash
   git revert e2c7117
   ```

2. Or use legacy `saveStudent()` method:
   - Change `saveStudentAsync()` back to `saveStudent()`
   - Remove `suspend` from function call
   - The legacy method is still available for backward compatibility

## Contact

For issues or questions:
- Check logs first: `adb logcat | grep attendance`
- Review documentation: `FIX_LOGOUT_ISSUE.md`
- File an issue in the repository

## Success Criteria

This fix is considered successful when:
- ✅ Users can log in and stay logged in
- ✅ No automatic logouts occur
- ✅ Session persists across app restarts
- ✅ Login flow is fast (< 3 seconds)
- ✅ Error handling works properly
- ✅ No crashes or ANRs
- ✅ Works across different Android versions
