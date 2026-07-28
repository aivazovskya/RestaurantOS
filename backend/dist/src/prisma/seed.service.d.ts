import { PrismaService } from './prisma.service';
export declare class SeedService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    seedDemoData(): Promise<void>;
}
