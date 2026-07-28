import { Module } from '@nestjs/common';
import { NexiumPosController } from './nexium-pos.controller';
import { AutoDeductionModule } from '../auto-deduction/auto-deduction.module';

@Module({
  imports: [AutoDeductionModule],
  controllers: [NexiumPosController],
})
export class NexiumPosModule {}
