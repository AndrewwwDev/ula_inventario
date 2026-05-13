import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Dependencia } from './Dependencia.entity';

@Entity('encargados')
export class Encargado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'int', nullable: false })
  cedula: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @ManyToOne(() => Dependencia)
  @JoinColumn({ name: 'id_dependencia' })
  dependencia: Dependencia;
}
