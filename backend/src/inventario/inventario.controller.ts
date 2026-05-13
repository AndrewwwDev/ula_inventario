import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InventarioService } from './inventario.service';
import { AuthGuard } from '@nestjs/passport';
const multer = require('multer');
import { join } from 'path';

@Controller('inventario')
@UseGuards(AuthGuard('jwt'))
export class InventarioController {
  constructor(private inventarioService: InventarioService) { }

  @Get()
  async getBienes() {
    return this.inventarioService.findAllBienes();
  }


  @UseInterceptors(FileInterceptor('imagen', {
    storage: multer.memoryStorage(),
  }))
  @Post()
  async createBien(@UploadedFile() file: any, @Body() body: any, @Request() req: any) {
    if (file) {
      const sharp = require('sharp');
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const outputPath = join(process.cwd(), 'uploads', filename);

      await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      body.imagen_url = `/uploads/${filename}`;
    }
    console.log('Creando bien con datos:', body);
    console.log('Operador ID:', req.user.id);
    return this.inventarioService.createBien(body, req.user.id);
  }

  @UseInterceptors(FileInterceptor('imagen', {
    storage: multer.memoryStorage(),
  }))
  @Put(':id')
  async updateBien(@Param('id') id: string, @UploadedFile() file: any, @Body() body: any) {
    if (file) {
      const sharp = require('sharp');
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const outputPath = join(process.cwd(), 'uploads', filename);

      await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      body.imagen_url = `/uploads/${filename}`;
    }
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
