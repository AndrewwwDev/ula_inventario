import { InventarioService } from './inventario.service';
export declare class InventarioController {
    private inventarioService;
    constructor(inventarioService: InventarioService);
    getBienes(): Promise<import("../entities/Bien.entity").Bien[]>;
    createBien(file: any, body: any, req: any): Promise<import("../entities/Bien.entity").Bien[]>;
    updateBien(id: string, file: any, body: any): Promise<import("../entities/Bien.entity").Bien>;
    getDesincorporados(): Promise<import("../entities/Bien.entity").Bien[]>;
    desincorporarBien(id: string, body: any, file: any): Promise<import("../entities/Bien.entity").Bien>;
    getCategorias(): Promise<import("../entities/Categoria.entity").Categoria[]>;
    getDependencias(): Promise<import("../entities/Dependencia.entity").Dependencia[]>;
    getEncargados(): Promise<import("../entities/Encargado.entity").Encargado[]>;
    getAlertasMantenimiento(): Promise<import("../entities/Mantenimiento.entity").Mantenimiento[]>;
    getEnReparacion(): Promise<import("../entities/Bien.entity").Bien[]>;
    getHistorialMantenimiento(): Promise<import("../entities/Mantenimiento.entity").Mantenimiento[]>;
    finalizarMantenimiento(id: string, body: any, req: any): Promise<import("../entities/Mantenimiento.entity").Mantenimiento>;
    getBitacora(): Promise<import("../entities/Bitacora.entity").Bitacora[]>;
}
