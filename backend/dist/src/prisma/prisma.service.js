"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let PrismaService = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger('DatabaseService');
    isFallbackMode = false;
    memoryDb = {
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
    dbFilePath = path.join(process.cwd(), 'data', 'db.json');
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Connected to Primary SQLite Database via Prisma ORM.');
        }
        catch (err) {
            this.logger.warn(`Prisma ORM engine connect failed: ${err.message}. Switching to persistent JSON Storage Engine.`);
            this.isFallbackMode = true;
            this.loadMemoryDb();
        }
    }
    async onModuleDestroy() {
        if (!this.isFallbackMode) {
            await this.$disconnect();
        }
        else {
            this.saveMemoryDb();
        }
    }
    loadMemoryDb() {
        try {
            const dir = path.dirname(this.dbFilePath);
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            if (fs.existsSync(this.dbFilePath)) {
                const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
                this.memoryDb = JSON.parse(raw);
                this.logger.log(`Loaded persisted JSON database from ${this.dbFilePath}`);
            }
        }
        catch (e) {
            this.logger.error('Error loading memory DB file:', e);
        }
    }
    saveMemoryDb() {
        if (!this.isFallbackMode)
            return;
        try {
            const dir = path.dirname(this.dbFilePath);
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.dbFilePath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
        }
        catch (e) {
            this.logger.error('Error saving memory DB file:', e);
        }
    }
    get store() {
        return this.memoryDb;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map