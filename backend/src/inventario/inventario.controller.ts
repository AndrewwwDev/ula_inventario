import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inventario')
@UseGuards(AuthGuard('jwt'))
export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  @Get()
  async getBienes() {
    return this.inventarioService.findAllBienes();
  }

  @Post()
  async createBien(@Body() body: any, @Request() req: any) {
    return this.inventarioService.createBien(body, req.user.id);
  }

  @Put(':id')
  async updateBien(@Param('id') id: string, @Body() body: any) {
    return this.inventarioService.updateBien(+id, body);
  }

  @Get('categorias')
  async getCategorias() {
    return this.inventarioService.getCategorias();
  }

  @Get('dependencias')
  async getDependencias() {
    return this.inventarioService.getDependencias();
  }

  @Get('encargados')
  async getEncargados() {
    return this.inventarioService.getEncargados();
  }
}
