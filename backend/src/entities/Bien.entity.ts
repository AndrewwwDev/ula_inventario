import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from './Categoria.entity';
import { Dependencia } from './Dependencia.entity';
import { Encargado } from './Encargado.entity';
import { Usuario } from './Usuario.entity';

@Entity('bienes')
export class Bien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @ManyToOne(() => Encargado)
  @JoinColumn({ name: 'encargado_id' })
  encargado: Encargado;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'operador_id' })
  operador: Usuario;

  @ManyToOne(() => Dependencia)
  @JoinColumn({ name: 'ubicacion_id' })
  ubicacion: Dependencia;

  @Column({ type: 'varchar', length: 20, default: 'En uso' })
  estado_operativo: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  valor: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_actualizacion: Date;

  @Column({ type: 'text', nullable: true })
  imagen_url: string;

  @Column({ type: 'text', nullable: true })
  qr_code: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
