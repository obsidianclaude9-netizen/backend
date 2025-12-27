export declare class TwoFactorService {
    /**
     * Generate 2FA secret for user
     */
    generateSecret(userId: string): Promise<{
        secret: string;
        qrCode: string;
        manualEntry: string;
    }>;
    /**
     * Enable 2FA after verification
     */
    enableTwoFactor(userId: string, token: string): Promise<{
        message: string;
        backupCodes: string[];
    }>;
    /**
     * Verify 2FA token
     */
    verifyToken(userId: string, token: string, isBackupCode?: boolean): Promise<boolean>;
    /**
     * Disable 2FA
     */
    disableTwoFactor(userId: string, password: string): Promise<{
        message: string;
    }>;
    /**
     * Generate backup codes
     */
    private generateBackupCodes;
    /**
     * Regenerate backup codes
     */
    regenerateBackupCodes(userId: string, password: string): Promise<{
        backupCodes: string[];
    }>;
}
//# sourceMappingURL=twoFactor.service.d.ts.map