"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventarioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const Bien_entity_1 = require("../entities/Bien.entity");
const Categoria_entity_1 = require("../entities/Categoria.entity");
const Dependencia_entity_1 = require("../entities/Dependencia.entity");
const Encargado_entity_1 = require("../entities/Encargado.entity");
const Mantenimiento_entity_1 = require("../entities/Mantenimiento.entity");
const Bitacora_entity_1 = require("../entities/Bitacora.entity");
let InventarioService = class InventarioService {
    constructor(bienRepo, categoriaRepo, dependenciaRepo, encargadoRepo, mantenimientoRepo, bitacoraRepo) {
        this.bienRepo = bienRepo;
        this.categoriaRepo = categoriaRepo;
        this.dependenciaRepo = dependenciaRepo;
        this.encargadoRepo = encargadoRepo;
        this.mantenimientoRepo = mantenimientoRepo;
        this.bitacoraRepo = bitacoraRepo;
    }
    async findAllBienes() {
        return this.bienRepo.find({
            where: { activo: true },
            relations: ['categoria', 'encargado', 'operador', 'ubicacion'],
            order: { fecha_registro: 'DESC' }
        });
    }
    async createBien(data, operadorId) {
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
    async updateBien(id, data) {
        const bien = await this.bienRepo.findOne({ where: { id } });
        if (!bien)
            throw new Error('Bien no encontrado');
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
    async desincorporarBien(id, motivo, fecha, fotoPath) {
        const bien = await this.bienRepo.findOne({ where: { id } });
        if (!bien)
            throw new Error('Bien no encontrado');
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
    async finalizarMantenimiento(bienId, trabajo, proximaFecha, usuarioId) {
        const bien = await this.bienRepo.findOne({ where: { id: bienId } });
        if (!bien)
            throw new Error('Bien no encontrado');
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
    async logAudit(usuarioId, accion, entidad, entidadId, diffVisual, detalles) {
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
};
exports.InventarioService = InventarioService;
exports.InventarioService = InventarioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(Bien_entity_1.Bien)),
    __param(1, (0, typeorm_1.InjectRepository)(Categoria_entity_1.Categoria)),
    __param(2, (0, typeorm_1.InjectRepository)(Dependencia_entity_1.Dependencia)),
    __param(3, (0, typeorm_1.InjectRepository)(Encargado_entity_1.Encargado)),
    __param(4, (0, typeorm_1.InjectRepository)(Mantenimiento_entity_1.Mantenimiento)),
    __param(5, (0, typeorm_1.InjectRepository)(Bitacora_entity_1.Bitacora)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventarioService);
//# sourceMappingURL=inventario.service.js.map