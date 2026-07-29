import { Controller, Post, Body } from '@nestjs/common';
import { AutoDeductionService } from '../auto-deduction/auto-deduction.service';
import { ProcessPosReceiptDto } from '../auto-deduction/dto/process-receipt.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('api/v1/nexium')
export class NexiumPosController {
  constructor(private readonly autoDeductionService: AutoDeductionService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: ProcessPosReceiptDto) {
    return await this.autoDeductionService.processReceipt(payload);
  }

  @Post('simulate-receipt')
  async simulateReceipt(@Body() customPayload?: Partial<ProcessPosReceiptDto>) {
    const defaultPayload: ProcessPosReceiptDto = {
      eventId: `evt_${Date.now()}`,
      receiptId: `REC-KZ-${Math.floor(1000 + Math.random() * 9000)}`,
      totalAmount: 8500,
      tableNumber: `Стол ${Math.floor(1 + Math.random() * 15)}`,
      items: [
        {
          posItemId: 'NEX-DISH-001',
          name: 'Бургер Говяжий Классический',
          quantity: 2,
          price: 3500,
        },
        {
          posItemId: 'NEX-DISH-002',
          name: 'Лимонад Классический 0.5L',
          quantity: 1,
          price: 1500,
        },
      ],
    };

    const finalPayload = { ...defaultPayload, ...customPayload };
    return await this.autoDeductionService.processReceipt(finalPayload as ProcessPosReceiptDto);
  }
}
