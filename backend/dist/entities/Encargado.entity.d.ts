import { Dependencia } from './Dependencia.entity';
export declare class Encargado {
    id: number;
    nombre: string;
    cedula: number;
    cargo: string;
    telefono: string;
    email: string;
    dependencia: Dependencia;
}
