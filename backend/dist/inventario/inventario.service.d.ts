import { Repository } from 'typeorm';
import { Bien } from '../entities/Bien.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Dependencia } from '../entities/Dependencia.entity';
import { Encargado } from '../entities/Encargado.entity';
export declare class InventarioService {
    private bienRepo;
    private categoriaRepo;
    private dependenciaRepo;
    private encargadoRepo;
    constructor(bienRepo: Repository<Bien>, categoriaRepo: Repository<Categoria>, dependenciaRepo: Repository<Dependencia>, encargadoRepo: Repository<Encargado>);
    findAllBienes(): Promise<Bien[]>;
    createBien(data: any, operadorId: number): Promise<Bien[]>;
    getCategorias(): Promise<Categoria[]>;
    getDependencias(): Promise<Dependencia[]>;
    getEncargados(): Promise<Encargado[]>;
    updateBien(id: number, data: any): Promise<Bien>;
}
