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
exports.Mantenimiento = void 0;
const typeorm_1 = require("typeorm");
const Bien_entity_1 = require("./Bien.entity");
let Mantenimiento = class Mantenimiento {
};
exports.Mantenimiento = Mantenimiento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Mantenimiento.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Bien_entity_1.Bien),
    (0, typeorm_1.JoinColumn)({ name: 'bien_id' }),
    __metadata("design:type", Bien_entity_1.Bien)
], Mantenimiento.prototype, "bien", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Mantenimiento.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Mantenimiento.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Mantenimiento.prototype, "trabajo_realizado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Mantenimiento.prototype, "proxima_fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'En Reparación' }),
    __metadata("design:type", String)
], Mantenimiento.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Mantenimiento.prototype, "fecha_registro", void 0);
exports.Mantenimiento = Mantenimiento = __decorate([
    (0, typeorm_1.Entity)('mantenimientos')
], Mantenimiento);
//# sourceMappingURL=Mantenimiento.entity.js.map