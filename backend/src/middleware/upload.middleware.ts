import multer from 'multer';

// Configure Storage
// Use memory storage to process the image in-memory and then upload directly to InsForge
const storage = multer.memoryStorage();

// Configure multer
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

export default upload;
