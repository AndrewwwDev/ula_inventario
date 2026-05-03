import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/Usuario.entity';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<Usuario>, jwtService: JwtService);
    validateUser(usuario: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            usuario: any;
            nombre: any;
            rol: any;
        };
    }>;
    createInitialAdmin(): Promise<{
        message: string;
    }>;
}
