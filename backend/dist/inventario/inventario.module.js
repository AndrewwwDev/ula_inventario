"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventarioModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const inventario_controller_1 = require("./inventario.controller");
const public_controller_1 = require("./public.controller");
const inventario_service_1 = require("./inventario.service");
const Bien_entity_1 = require("../entities/Bien.entity");
const Categoria_entity_1 = require("../entities/Categoria.entity");
const Dependencia_entity_1 = require("../entities/Dependencia.entity");
const Encargado_entity_1 = require("../entities/Encargado.entity");
const Mantenimiento_entity_1 = require("../entities/Mantenimiento.entity");
const Bitacora_entity_1 = require("../entities/Bitacora.entity");
let InventarioModule = class InventarioModule {
};
exports.InventarioModule = InventarioModule;
exports.InventarioModule = InventarioModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([Bien_entity_1.Bien, Categoria_entity_1.Categoria, Dependencia_entity_1.Dependencia, Encargado_entity_1.Encargado, Mantenimiento_entity_1.Mantenimiento, Bitacora_entity_1.Bitacora])
        ],
        controllers: [inventario_controller_1.InventarioController, public_controller_1.PublicController],
        providers: [inventario_service_1.InventarioService]
    })
], InventarioModule);
//# sourceMappingURL=inventario.module.js.map