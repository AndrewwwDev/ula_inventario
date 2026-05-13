import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';

@Controller('public')
export class PublicController {
  constructor(private inventarioService: InventarioService) {}

  @Get('bienes-por-encargado')
  async getBienesByEncargado(@Query('cedula', ParseIntPipe) cedula: number) {
    return this.inventarioService.findBienesByEncargadoCedula(cedula);
  }
}