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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const Usuario_entity_1 = require("../entities/Usuario.entity");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async validateUser(usuario, pass) {
        const user = await this.usersRepository.findOne({ where: { usuario } });
        if (user && await bcrypt.compare(pass, user.contrasena)) {
            const { contrasena, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = { usuario: user.usuario, sub: user.id, rol: user.rol };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                usuario: user.usuario,
                nombre: user.nombre,
                rol: user.rol
            }
        };
    }
    // Temporary function to create an initial admin if none exists
    async createInitialAdmin() {
        const existingAdmin = await this.usersRepository.findOne({ where: { usuario: 'admin' } });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = this.usersRepository.create({
                nombre: 'Administrador del Sistema',
                usuario: 'admin',
                contrasena: hashedPassword,
                rol: 'admin',
                activo: true
            });
            await this.usersRepository.save(newAdmin);
            return { message: 'Admin inicial creado (admin / admin123)' };
        }
        return { message: 'El admin ya existe' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(Usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map