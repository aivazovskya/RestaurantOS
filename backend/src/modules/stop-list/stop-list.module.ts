import { Module } from '@nestjs/common';
import { StopListService } from './stop-list.service';
import { StopListController } from './stop-list.controller';
import { RecipeResolverService } from '../../common/services/recipe-resolver.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Module({
  controllers: [StopListController],
  providers: [StopListService, RecipeResolverService, EventsGateway],
  exports: [StopListService, RecipeResolverService, EventsGateway],
})
export class StopListModule {}
