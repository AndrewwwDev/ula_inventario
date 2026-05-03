import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bien } from '../entities/Bien.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Dependencia } from '../entities/Dependencia.entity';
import { Encargado } from '../entities/Encargado.entity';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Bien)
    private bienRepo: Repository<Bien>,
    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,
    @InjectRepository(Dependencia)
    private dependenciaRepo: Repository<Dependencia>,
    @InjectRepository(Encargado)
    private encargadoRepo: Repository<Encargado>,
  ) {}

  async findAllBienes() {
    return this.bienRepo.find({
      relations: ['categoria', 'encargado', 'operador', 'ubicacion'],
      order: { fecha_registro: 'DESC' }
    });
  }

  async createBien(data: any, operadorId: number) {
    const nuevoBien = this.bienRepo.create({
      ...data,
      operador: { id: operadorId },
      categoria: data.categoria_id ? { id: data.categoria_id } : null,
      ubicacion: data.ubicacion_id ? { id: data.ubicacion_id } : null,
      encargado: data.encargado_id ? { id: data.encargado_id } : null,
    });
    return this.bienRepo.save(nuevoBien);
  }

  async getCategorias() {
    return this.categoriaRepo.find();
  }

  async getDependencias() {
    return this.dependenciaRepo.find();
  }

  async getEncargados() {
    return this.encargadoRepo.find();
  }

  async updateBien(id: number, data: any) {
    const bien = await this.bienRepo.findOne({ where: { id } });
    if (!bien) throw new Error('Bien no encontrado');

    this.bienRepo.merge(bien, {
      ...data,
      categoria: data.categoria_id ? { id: data.categoria_id } : null,
      ubicacion: data.ubicacion_id ? { id: data.ubicacion_id } : null,
      encargado: data.encargado_id ? { id: data.encargado_id } : null,
      fecha_actualizacion: new Date()
    });

    return this.bienRepo.save(bien);
  }
}
