import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('api/v1/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('items')
  async getMenuItems() {
    return await this.menuService.getMenuItems();
  }

  @Post('items')
  async createMenuItem(@Body() data: any) {
    return await this.menuService.createMenuItem(data);
  }

  @Post('items/:id/recipe')
  async saveRecipeCard(@Param('id') menuItemId: string, @Body() body: { recipeItems: any[] }) {
    return await this.menuService.saveRecipeCard(menuItemId, body.recipeItems);
  }
}
