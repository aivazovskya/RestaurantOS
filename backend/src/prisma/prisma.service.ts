import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DatabaseService');
  public isFallbackMode = false;

  private memoryDb: {
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
  } = {
    organizations: [],
    branches: [],
    warehouses: [],
    ingredients: [],
    menuItems: [],
    recipeCards: [],
    recipeItems: [],
    stockBalances: [],
    stockMovements: [],
    stockMovementItems: [],
    deductionIncidents: [],
  };

  private readonly dbFilePath = path.join(process.cwd(), 'data', 'db.json');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to Primary SQLite Database via Prisma ORM.');
    } catch (err: any) {
      this.logger.warn(`Prisma ORM engine connect failed: ${err.message}. Switching to persistent JSON Storage Engine.`);
      this.isFallbackMode = true;
      this.loadMemoryDb();
    }
  }

  async onModuleDestroy() {
    if (!this.isFallbackMode) {
      await this.$disconnect();
    } else {
      this.saveMemoryDb();
    }
  }

  private loadMemoryDb() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.memoryDb = JSON.parse(raw);
        this.logger.log(`Loaded persisted JSON database from ${this.dbFilePath}`);
      }
    } catch (e) {
      this.logger.error('Error loading memory DB file:', e);
    }
  }

  public saveMemoryDb() {
    if (!this.isFallbackMode) return;
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Error saving memory DB file:', e);
    }
  }

  // Exposed getter for memoryDb in fallback mode
  public get store() {
    return this.memoryDb;
  }
}
