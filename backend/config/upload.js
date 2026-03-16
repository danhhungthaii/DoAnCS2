const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const bannerDir = 'uploads/banners';
const evidenceDir = 'uploads/evidence';

if (!fs.existsSync(bannerDir)) {
    fs.mkdirSync(bannerDir, { recursive: true });
    console.log('📁 Created uploads/banners directory');
}

if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
    console.log('📁 Created uploads/evidence directory');
}

/**
 * Multer storage configuration for event banners
 */
const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bannerDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'banner-' + uniqueSuffix + ext);
    }
});

/**
 * Multer storage configuration for evidence photos
 */
const evidenceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, evidenceDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `evidence-${uniqueSuffix}-${sanitizedName}${ext}`);
    }
});

/**
 * File filter for images only
 */
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

/**
 * Multer upload middleware for event banners
 * - Max file size: 5MB
 * - Allowed: Image files only
 */
const uploadBanner = multer({
    storage: bannerStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: imageFilter
});

/**
 * Multer upload middleware for evidence photos
 * - Max file size: 10MB
 * - Allowed: Image files only
 */
const uploadEvidence = multer({
    storage: evidenceStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: imageFilter
});

/**
 * Upload single evidence photo with error handling
 */
const uploadEvidenceWithErrorHandling = (req, res, next) => {
    const upload = uploadEvidence.single('evidencePhoto');
    
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File quá lớn. Kích thước tối đa là 10MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: `Lỗi upload: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        // No error, continue
        next();
    });
};

/**
 * Utility: Delete file
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Deleted file: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting file: ${error.message}`);
        return false;
    }
};

module.exports = { 
    uploadBanner,
    uploadEvidence,
    uploadEvidenceWithErrorHandling,
    deleteFile,
    bannerDir,
    evidenceDir
};
