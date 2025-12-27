/**
 * Storage configuration for local file system
 */
export declare const STORAGE_CONFIG: {
    uploads: string;
    qrcodes: string;
    tickets: string;
    customerDocuments: string;
    temp: string;
};
/**
 * Initialize storage directories
 */
export declare const initializeStorage: () => void;
/**
 * Get public URL for uploaded file
 */
export declare const getFileUrl: (relativePath: string) => string;
/**
 * Delete file from local storage
 */
export declare const deleteFile: (relativePath: string) => boolean;
/**
 * Check if file exists
 */
export declare const fileExists: (relativePath: string) => boolean;
/**
 * Get file size in bytes
 */
export declare const getFileSize: (relativePath: string) => number;
/**
 * Clean up old temporary files (older than 24 hours)
 */
export declare const cleanupTempFiles: () => void;
//# sourceMappingURL=storage.d.ts.map