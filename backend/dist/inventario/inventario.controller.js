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
exports.InventarioController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const inventario_service_1 = require("./inventario.service");
const passport_1 = require("@nestjs/passport");
let InventarioController = class InventarioController {
    constructor(inventarioService) {
        this.inventarioService = inventarioService;
    }
    async getBienes() {
        return this.inventarioService.findAllBienes();
    }
    async createBien(body, req) {
        return this.inventarioService.createBien(body, req.user.id);
    }
    async updateBien(id, body) {
        return this.inventarioService.updateBien(+id, body);
    }
    async getDesincorporados() {
        return this.inventarioService.findAllDesincorporados();
    }
    async desincorporarBien(id, body, file) {
        const fotoPath = file ? `/uploads/${file.filename}` : null;
        return this.inventarioService.desincorporarBien(+id, body.motivo, body.fecha, fotoPath);
    }
    async getCategorias() {
        return this.inventarioService.getCategorias();
    }
    async getDependencias() {
        return this.inventarioService.getDependencias();
    }
    async getEncargados() {
        return this.inventarioService.getEncargados();
    }
    // --- MANTENIMIENTO ---
    async getAlertasMantenimiento() {
        return this.inventarioService.getAlertasMantenimiento();
    }
    async getEnReparacion() {
        return this.inventarioService.getEnReparacion();
    }
    async getHistorialMantenimiento() {
        return this.inventarioService.getHistorialMantenimiento();
    }
    async finalizarMantenimiento(id, body, req) {
        return this.inventarioService.finalizarMantenimiento(+id, body.trabajo, body.proximaFecha, req.user.id);
    }
    // --- BITACORA ---
    async getBitacora() {
        return this.inventarioService.getBitacora();
    }
};
exports.InventarioController = InventarioController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getBienes", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "createBien", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "updateBien", null);
__decorate([
    (0, common_1.Get)('desincorporados'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getDesincorporados", null);
__decorate([
    (0, common_1.Put)(':id/desincorporar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        })
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "desincorporarBien", null);
__decorate([
    (0, common_1.Get)('categorias'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getCategorias", null);
__decorate([
    (0, common_1.Get)('dependencias'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getDependencias", null);
__decorate([
    (0, common_1.Get)('encargados'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getEncargados", null);
__decorate([
    (0, common_1.Get)('mantenimiento/alertas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getAlertasMantenimiento", null);
__decorate([
    (0, common_1.Get)('mantenimiento/reparacion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getEnReparacion", null);
__decorate([
    (0, common_1.Get)('mantenimiento/historial'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getHistorialMantenimiento", null);
__decorate([
    (0, common_1.Post)('mantenimiento/:id/finalizar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "finalizarMantenimiento", null);
__decorate([
    (0, common_1.Get)('bitacora'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventarioController.prototype, "getBitacora", null);
exports.InventarioController = InventarioController = __decorate([
    (0, common_1.Controller)('inventario'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [inventario_service_1.InventarioService])
], InventarioController);
//# sourceMappingURL=inventario.controller.js.map