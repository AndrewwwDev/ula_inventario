import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Get('desincorporados')
  async getDesincorporados() {
    return this.inventarioService.findAllDesincorporados();
  }

  @Put(':id/desincorporar')
  @UseInterceptors(FileInterceptor('foto', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async desincorporarBien(@Param('id') id: string, @Body() body: any, @UploadedFile() file: any) {
    const fotoPath = file ? `/uploads/${file.filename}` : null;
    return this.inventarioService.desincorporarBien(+id, body.motivo, body.fecha, fotoPath);
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

  // --- MANTENIMIENTO ---
  @Get('mantenimiento/alertas')
  async getAlertasMantenimiento() {
    return this.inventarioService.getAlertasMantenimiento();
  }

  @Get('mantenimiento/reparacion')
  async getEnReparacion() {
    return this.inventarioService.getEnReparacion();
  }

  @Get('mantenimiento/historial')
  async getHistorialMantenimiento() {
    return this.inventarioService.getHistorialMantenimiento();
  }

  @Post('mantenimiento/:id/finalizar')
  async finalizarMantenimiento(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.inventarioService.finalizarMantenimiento(+id, body.trabajo, body.proximaFecha, req.user.id);
  }

  // --- BITACORA ---
  @Get('bitacora')
  async getBitacora() {
    return this.inventarioService.getBitacora();
  }
}
