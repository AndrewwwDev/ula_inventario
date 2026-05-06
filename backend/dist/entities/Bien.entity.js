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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bien = void 0;
const typeorm_1 = require("typeorm");
const Categoria_entity_1 = require("./Categoria.entity");
const Dependencia_entity_1 = require("./Dependencia.entity");
const Encargado_entity_1 = require("./Encargado.entity");
const Usuario_entity_1 = require("./Usuario.entity");
let Bien = class Bien {
};
exports.Bien = Bien;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Bien.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Bien.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Bien.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Categoria_entity_1.Categoria),
    (0, typeorm_1.JoinColumn)({ name: 'categoria_id' }),
    __metadata("design:type", Categoria_entity_1.Categoria)
], Bien.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Encargado_entity_1.Encargado),
    (0, typeorm_1.JoinColumn)({ name: 'encargado_id' }),
    __metadata("design:type", Encargado_entity_1.Encargado)
], Bien.prototype, "encargado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'operador_id' }),
    __metadata("design:type", Usuario_entity_1.Usuario)
], Bien.prototype, "operador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Dependencia_entity_1.Dependencia),
    (0, typeorm_1.JoinColumn)({ name: 'ubicacion_id' }),
    __metadata("design:type", Dependencia_entity_1.Dependencia)
], Bien.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'En uso' }),
    __metadata("design:type", String)
], Bien.prototype, "estado_operativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Bien.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Bien.prototype, "fecha_registro", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Bien.prototype, "fecha_actualizacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "imagen_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "qr_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Bien.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "motivo_desincorporacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Bien.prototype, "fecha_desincorporacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "foto_desincorporacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'Buen estado' }),
    __metadata("design:type", String)
], Bien.prototype, "condicion_fisica", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Bien.prototype, "especificaciones_condicion", void 0);
exports.Bien = Bien = __decorate([
    (0, typeorm_1.Entity)('bienes')
], Bien);
//# sourceMappingURL=Bien.entity.js.map