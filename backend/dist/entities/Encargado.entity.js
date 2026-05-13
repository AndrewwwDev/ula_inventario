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
exports.Encargado = void 0;
const typeorm_1 = require("typeorm");
const Dependencia_entity_1 = require("./Dependencia.entity");
let Encargado = class Encargado {
};
exports.Encargado = Encargado;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Encargado.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Encargado.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Encargado.prototype, "cedula", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Encargado.prototype, "cargo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Encargado.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Encargado.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Dependencia_entity_1.Dependencia),
    (0, typeorm_1.JoinColumn)({ name: 'id_dependencia' }),
    __metadata("design:type", Dependencia_entity_1.Dependencia)
], Encargado.prototype, "dependencia", void 0);
exports.Encargado = Encargado = __decorate([
    (0, typeorm_1.Entity)('encargados')
], Encargado);
//# sourceMappingURL=Encargado.entity.js.map