import { Module } from '@nestjs/common';
import { StopListService } from './stop-list.service';
import { StopListController } from './stop-list.controller';
import { RecipeResolverService } from '../../common/services/recipe-resolver.service';

@Module({
  controllers: [StopListController],
  providers: [StopListService, RecipeResolverService],
  exports: [StopListService, RecipeResolverService],
})
export class StopListModule {}
