import { Bien } from './Bien.entity';
export declare class Mantenimiento {
    id: number;
    bien: Bien;
    fecha_inicio: Date;
    fecha_fin: Date;
    trabajo_realizado: string;
    proxima_fecha: Date;
    estado: string;
    fecha_registro: Date;
}
