import { Categoria } from './Categoria.entity';
import { Dependencia } from './Dependencia.entity';
import { Encargado } from './Encargado.entity';
import { Usuario } from './Usuario.entity';
export declare class Bien {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: Categoria;
    encargado: Encargado;
    operador: Usuario;
    ubicacion: Dependencia;
    estado_operativo: string;
    valor: number;
    fecha_registro: Date;
    fecha_actualizacion: Date;
    imagen_url: string;
    qr_code: string;
    activo: boolean;
    motivo_desincorporacion: string;
    fecha_desincorporacion: Date;
    foto_desincorporacion: string;
    condicion_fisica: string;
    especificaciones_condicion: string;
}
