import { Module } from '@nestjs/common';
import { AutoDeductionService } from './auto-deduction.service';
import { StopListModule } from '../stop-list/stop-list.module';

@Module({
  imports: [StopListModule],
  providers: [AutoDeductionService],
  exports: [AutoDeductionService],
})
export class AutoDeductionModule {}
