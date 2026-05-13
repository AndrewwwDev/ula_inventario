import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioController } from './inventario.controller';
import { PublicController } from './public.controller';
import { InventarioService } from './inventario.service';
import { Bien } from '../entities/Bien.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Dependencia } from '../entities/Dependencia.entity';
import { Encargado } from '../entities/Encargado.entity';
import { Mantenimiento } from '../entities/Mantenimiento.entity';
import { Bitacora } from '../entities/Bitacora.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bien, Categoria, Dependencia, Encargado, Mantenimiento, Bitacora])
  ],
  controllers: [InventarioController, PublicController],
  providers: [InventarioService]
})
export class InventarioModule {}
