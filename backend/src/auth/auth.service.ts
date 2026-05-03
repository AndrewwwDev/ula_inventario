import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/Usuario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usersRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async validateUser(usuario: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { usuario } });
    if (user && await bcrypt.compare(pass, user.contrasena)) {
      const { contrasena, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
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
}
