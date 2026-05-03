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
let InventarioService = class InventarioService {
    constructor(bienRepo, categoriaRepo, dependenciaRepo, encargadoRepo) {
        this.bienRepo = bienRepo;
        this.categoriaRepo = categoriaRepo;
        this.dependenciaRepo = dependenciaRepo;
        this.encargadoRepo = encargadoRepo;
    }
    async findAllBienes() {
        return this.bienRepo.find({
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
};
exports.InventarioService = InventarioService;
exports.InventarioService = InventarioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(Bien_entity_1.Bien)),
    __param(1, (0, typeorm_1.InjectRepository)(Categoria_entity_1.Categoria)),
    __param(2, (0, typeorm_1.InjectRepository)(Dependencia_entity_1.Dependencia)),
    __param(3, (0, typeorm_1.InjectRepository)(Encargado_entity_1.Encargado)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventarioService);
//# sourceMappingURL=inventario.service.js.map