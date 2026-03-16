package com.attendance.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import kotlin.math.min

/**
 * ImageCompressor - Utility để nén ảnh trước khi upload
 * 
 * Tối ưu:
 * - Resize ảnh xuống max 1024x1024
 * - Compress JPEG với quality 80%
 * - Giảm kích thước từ 4-5MB → 200-400KB
 * - Upload time giảm từ 10s → 1-2s
 */
object ImageCompressor {
    
    private const val MAX_WIDTH = 1024
    private const val MAX_HEIGHT = 1024
    private const val JPEG_QUALITY = 80
    
    /**
     * Compress ảnh từ URI
     * @param context Context
     * @param uri URI của ảnh
     * @return File ảnh đã nén
     */
    fun compressImage(context: Context, uri: Uri): File? {
        try {
            // Đọc ảnh từ URI
            val originalBitmap = context.contentResolver.openInputStream(uri)?.use { inputStream ->
                BitmapFactory.decodeStream(inputStream)
            } ?: return null
            
            // Fix rotation từ EXIF
            val rotatedBitmap = fixRotation(context, uri, originalBitmap)
            
            // Resize ảnh
            val resizedBitmap = resizeBitmap(rotatedBitmap, MAX_WIDTH, MAX_HEIGHT)
            
            // Compress và lưu vào file
            val compressedFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
            FileOutputStream(compressedFile).use { outputStream ->
                resizedBitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, outputStream)
            }
            
            // Cleanup
            if (rotatedBitmap != originalBitmap) {
                originalBitmap.recycle()
            }
            resizedBitmap.recycle()
            
            return compressedFile
            
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Compress ảnh từ File
     * @param file File ảnh gốc
     * @return File ảnh đã nén
     */
    fun compressImage(file: File): File? {
        try {
            // Đọc ảnh từ file
            val originalBitmap = BitmapFactory.decodeFile(file.absolutePath) ?: return null
            
            // Fix rotation từ EXIF
            val rotatedBitmap = fixRotation(file, originalBitmap)
            
            // Resize ảnh
            val resizedBitmap = resizeBitmap(rotatedBitmap, MAX_WIDTH, MAX_HEIGHT)
            
            // Compress và lưu vào file mới
            val compressedFile = File(file.parent, "compressed_${System.currentTimeMillis()}.jpg")
            FileOutputStream(compressedFile).use { outputStream ->
                resizedBitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, outputStream)
            }
            
            // Cleanup
            if (rotatedBitmap != originalBitmap) {
                originalBitmap.recycle()
            }
            resizedBitmap.recycle()
            
            return compressedFile
            
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Compress bitmap thành ByteArray
     * @param bitmap Bitmap cần compress
     * @return ByteArray đã compress
     */
    fun compressBitmapToByteArray(bitmap: Bitmap): ByteArray {
        val resizedBitmap = resizeBitmap(bitmap, MAX_WIDTH, MAX_HEIGHT)
        val stream = ByteArrayOutputStream()
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, stream)
        
        if (resizedBitmap != bitmap) {
            resizedBitmap.recycle()
        }
        
        return stream.toByteArray()
    }
    
    /**
     * Resize bitmap về kích thước tối đa
     */
    private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        // Nếu ảnh đã nhỏ hơn max size, return nguyên bản
        if (width <= maxWidth && height <= maxHeight) {
            return bitmap
        }
        
        // Tính scale ratio
        val scale = min(maxWidth.toFloat() / width, maxHeight.toFloat() / height)
        val newWidth = (width * scale).toInt()
        val newHeight = (height * scale).toInt()
        
        // Resize
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
    
    /**
     * Fix rotation của ảnh dựa trên EXIF data
     */
    private fun fixRotation(context: Context, uri: Uri, bitmap: Bitmap): Bitmap {
        try {
            context.contentResolver.openInputStream(uri)?.use { inputStream ->
                val exif = ExifInterface(inputStream)
                val rotation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
                
                return rotateBitmap(bitmap, rotation)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return bitmap
    }
    
    /**
     * Fix rotation của ảnh dựa trên EXIF data từ File
     */
    private fun fixRotation(file: File, bitmap: Bitmap): Bitmap {
        try {
            val exif = ExifInterface(file.absolutePath)
            val rotation = exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )
            
            return rotateBitmap(bitmap, rotation)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return bitmap
    }
    
    /**
     * Rotate bitmap theo EXIF orientation
     */
    private fun rotateBitmap(bitmap: Bitmap, orientation: Int): Bitmap {
        val matrix = Matrix()
        
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            else -> return bitmap
        }
        
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }
    
    /**
     * Lấy kích thước file theo MB
     */
    fun getFileSizeInMB(file: File): Double {
        return file.length().toDouble() / (1024 * 1024)
    }
    
    /**
     * Format kích thước file thành string dễ đọc
     */
    fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            else -> String.format("%.2f MB", bytes.toDouble() / (1024 * 1024))
        }
    }
}
