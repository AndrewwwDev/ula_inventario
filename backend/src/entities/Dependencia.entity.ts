import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dependencias')
export class Dependencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;
}
