package com.attendance.utils

import android.content.Context
import android.media.MediaPlayer
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.animation.AnimationUtils
import androidx.core.content.ContextCompat

/**
 * UIFeedback - Utility cho haptic feedback, sound effects, và animations
 * 
 * Tối ưu UX:
 * - Haptic feedback khi click button
 * - Sound beep khi scan QR thành công
 * - Button press animations
 * - Success/error vibrations
 */
object UIFeedback {
    
    /**
     * Vibrate với haptic feedback
     */
    fun vibrate(context: Context, durationMs: Long = 50) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(
                    VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(durationMs)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    /**
     * Success vibration pattern
     */
    fun vibrateSuccess(context: Context) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Pattern: short-pause-short (success feel)
                val timings = longArrayOf(0, 50, 50, 50)
                val amplitudes = intArrayOf(0, 100, 0, 100)
                vibrator.vibrate(
                    VibrationEffect.createWaveform(timings, amplitudes, -1)
                )
            } else {
                @Suppress("DEPRECATION")
                val pattern = longArrayOf(0, 50, 50, 50)
                vibrator.vibrate(pattern, -1)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    /**
     * Error vibration pattern
     */
    fun vibrateError(context: Context) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Pattern: long single vibration (error feel)
                vibrator.vibrate(
                    VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(200)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    /**
     * Play beep sound
     */
    fun playBeep(context: Context) {
        try {
            // Use system notification sound as beep
            val mediaPlayer = MediaPlayer.create(context, android.provider.Settings.System.DEFAULT_NOTIFICATION_URI)
            mediaPlayer?.apply {
                setVolume(0.3f, 0.3f)
                start()
                setOnCompletionListener { mp ->
                    mp.release()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    /**
     * Button press animation với scale effect
     */
    fun animateButtonPress(view: View, onComplete: (() -> Unit)? = null) {
        view.animate()
            .scaleX(0.95f)
            .scaleY(0.95f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .withEndAction {
                        onComplete?.invoke()
                    }
                    .start()
            }
            .start()
    }
    
    /**
     * Pulse animation for FAB button
     */
    fun animatePulse(view: View) {
        view.animate()
            .scaleX(1.1f)
            .scaleY(1.1f)
            .setDuration(300)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(300)
                    .start()
            }
            .start()
    }
    
    /**
     * Shake animation for error feedback
     */
    fun animateShake(view: View) {
        view.animate()
            .translationX(-25f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .translationX(25f)
                    .setDuration(100)
                    .withEndAction {
                        view.animate()
                            .translationX(-25f)
                            .setDuration(100)
                            .withEndAction {
                                view.animate()
                                    .translationX(0f)
                                    .setDuration(100)
                                    .start()
                            }
                            .start()
                    }
                    .start()
            }
            .start()
    }
    
    /**
     * Fade in animation
     */
    fun animateFadeIn(view: View, duration: Long = 300) {
        view.alpha = 0f
        view.visibility = View.VISIBLE
        view.animate()
            .alpha(1f)
            .setDuration(duration)
            .start()
    }
    
    /**
     * Fade out animation
     */
    fun animateFadeOut(view: View, duration: Long = 300, onComplete: (() -> Unit)? = null) {
        view.animate()
            .alpha(0f)
            .setDuration(duration)
            .withEndAction {
                view.visibility = View.GONE
                view.alpha = 1f
                onComplete?.invoke()
            }
            .start()
    }
    
    /**
     * Slide up animation
     */
    fun animateSlideUp(view: View, duration: Long = 300) {
        view.translationY = view.height.toFloat()
        view.visibility = View.VISIBLE
        view.animate()
            .translationY(0f)
            .setDuration(duration)
            .start()
    }
    
    /**
     * Slide down animation
     */
    fun animateSlideDown(view: View, duration: Long = 300, onComplete: (() -> Unit)? = null) {
        view.animate()
            .translationY(view.height.toFloat())
            .setDuration(duration)
            .withEndAction {
                view.visibility = View.GONE
                view.translationY = 0f
                onComplete?.invoke()
            }
            .start()
    }
}
