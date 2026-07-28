import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    isFallbackMode: boolean;
    private memoryDb;
    private readonly dbFilePath;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private loadMemoryDb;
    saveMemoryDb(): void;
    get store(): {
        organizations: any[];
        branches: any[];
        warehouses: any[];
        ingredients: any[];
        menuItems: any[];
        recipeCards: any[];
        recipeItems: any[];
        stockBalances: any[];
        stockMovements: any[];
        stockMovementItems: any[];
        deductionIncidents: any[];
    };
}
