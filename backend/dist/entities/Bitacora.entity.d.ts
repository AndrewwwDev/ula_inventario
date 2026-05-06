import { Usuario } from './Usuario.entity';
export declare class Bitacora {
    id: number;
    usuario: Usuario;
    accion: string;
    entidad: string;
    entidad_id: number;
    diff_visual: any;
    detalles: string;
    fecha: Date;
}
