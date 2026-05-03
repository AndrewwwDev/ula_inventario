import { InventarioService } from './inventario.service';
export declare class InventarioController {
    private inventarioService;
    constructor(inventarioService: InventarioService);
    getBienes(): Promise<import("../entities/Bien.entity").Bien[]>;
    createBien(body: any, req: any): Promise<import("../entities/Bien.entity").Bien[]>;
    updateBien(id: string, body: any): Promise<import("../entities/Bien.entity").Bien>;
    getCategorias(): Promise<import("../entities/Categoria.entity").Categoria[]>;
    getDependencias(): Promise<import("../entities/Dependencia.entity").Dependencia[]>;
    getEncargados(): Promise<import("../entities/Encargado.entity").Encargado[]>;
}
