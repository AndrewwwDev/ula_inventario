import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bien } from '../entities/Bien.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Dependencia } from '../entities/Dependencia.entity';
import { Encargado } from '../entities/Encargado.entity';
import { Mantenimiento } from '../entities/Mantenimiento.entity';
import { Bitacora } from '../entities/Bitacora.entity';

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
    @InjectRepository(Mantenimiento)
    private mantenimientoRepo: Repository<Mantenimiento>,
    @InjectRepository(Bitacora)
    private bitacoraRepo: Repository<Bitacora>,
  ) {}

  async findAllBienes() {
    return this.bienRepo.find({
      where: { activo: true },
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

  async findAllDesincorporados() {
    return this.bienRepo.find({
      where: { activo: false },
      relations: ['categoria', 'encargado', 'operador', 'ubicacion'],
      order: { fecha_desincorporacion: 'DESC' }
    });
  }

  async desincorporarBien(id: number, motivo: string, fecha: Date, fotoPath: string) {
    const bien = await this.bienRepo.findOne({ where: { id } });
    if (!bien) throw new Error('Bien no encontrado');

    bien.activo = false;
    bien.estado_operativo = 'Desincorporado';
    bien.motivo_desincorporacion = motivo;
    bien.fecha_desincorporacion = fecha;
    if (fotoPath) {
      bien.foto_desincorporacion = fotoPath;
    }
    bien.fecha_actualizacion = new Date();

    const saved = await this.bienRepo.save(bien);
    
    // Log audit
    await this.logAudit(null, 'DESINCORPORACION', 'Bien', bien.id, {}, motivo);

    return saved;
  }

  // --- MANTENIMIENTO ---
  async getAlertasMantenimiento() {
    // Equipos vencidos o proximos a vencer (estado = En Reparación o activos vencidos?)
    // "Equipos cuyo Próximo Mantenimiento esté vencido o próximo a vencer"
    // Since we don't have proxima_fecha on Bien, we query the latest Mantenimiento or just active ones.
    // Let's assume Mantenimiento table holds the schedule.
    const today = new Date();
    const alertDate = new Date();
    alertDate.setDate(today.getDate() + 7); // Próximos 7 días
    
    // Simplification: returning active mantenimientos pending or active bienes needing maintenance
    return this.mantenimientoRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.bien', 'bien')
      .where('m.estado = :estado', { estado: 'Finalizado' })
      .andWhere('m.proxima_fecha <= :alertDate', { alertDate })
      .getMany();
  }

  async getEnReparacion() {
    return this.bienRepo.find({
      where: { estado_operativo: 'Mantenimiento', activo: true },
      relations: ['categoria', 'ubicacion']
    });
  }

  async getHistorialMantenimiento() {
    return this.mantenimientoRepo.find({
      where: { estado: 'Finalizado' },
      relations: ['bien'],
      order: { fecha_fin: 'DESC' }
    });
  }

  async finalizarMantenimiento(bienId: number, trabajo: string, proximaFecha: Date, usuarioId: number) {
    const bien = await this.bienRepo.findOne({ where: { id: bienId } });
    if (!bien) throw new Error('Bien no encontrado');

    // Cambiar estado a Activo
    const oldEstado = bien.estado_operativo;
    bien.estado_operativo = 'Activo';
    bien.fecha_actualizacion = new Date();
    await this.bienRepo.save(bien);

    // Crear registro de mantenimiento
    const mant = this.mantenimientoRepo.create({
      bien: { id: bienId },
      fecha_inicio: new Date(), // Assuming it started before, simplified
      fecha_fin: new Date(),
      trabajo_realizado: trabajo,
      proxima_fecha: proximaFecha,
      estado: 'Finalizado'
    });
    await this.mantenimientoRepo.save(mant);

    // Audit Log
    await this.logAudit(usuarioId, 'FINALIZAR_MANTENIMIENTO', 'Bien', bien.id, {
      estado_operativo: { old: oldEstado, new: 'Activo' }
    }, trabajo);

    return mant;
  }

  // --- BITACORA ---
  async getBitacora() {
    return this.bitacoraRepo.find({
      relations: ['usuario'],
      order: { fecha: 'DESC' }
    });
  }

  async logAudit(usuarioId: number | null, accion: string, entidad: string, entidadId: number, diffVisual: any, detalles: string) {
    const log = this.bitacoraRepo.create({
      usuario: usuarioId ? { id: usuarioId } : null,
      accion,
      entidad,
      entidad_id: entidadId,
      diff_visual: diffVisual,
      detalles
    });
    await this.bitacoraRepo.save(log);
  }
}
