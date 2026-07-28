"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    common_1.Logger.log(`🚀 Restaurant OS Kazakhstan Backend is running on: http://localhost:${port}`, 'Bootstrap');
    common_1.Logger.log(`🔗 Nexium POS Webhook endpoint: http://localhost:${port}/api/v1/nexium/webhook`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map