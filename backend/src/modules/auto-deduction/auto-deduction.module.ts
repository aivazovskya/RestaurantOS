import { Module } from '@nestjs/common';
import { AutoDeductionService } from './auto-deduction.service';

@Module({
  providers: [AutoDeductionService],
  exports: [AutoDeductionService],
})
export class AutoDeductionModule {}
