import { LoginInput, CreateUserInput, UpdateUserInput, ChangePasswordInput } from './auth.schema';
export declare class AuthService {
    login(data: LoginInput): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
    createUser(data: CreateUserInput): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
    }>;
    updateUser(userId: string, data: UpdateUserInput): Promise<{
        id: string;
        updatedAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    changePassword(userId: string, data: ChangePasswordInput): Promise<{
        message: string;
    }>;
    listUsers(page?: number, limit?: number): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    deactivateUser(userId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map