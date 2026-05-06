import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bien } from './Bien.entity';

@Entity('mantenimientos')
export class Mantenimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bien)
  @JoinColumn({ name: 'bien_id' })
  bien: Bien;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date;

  @Column({ type: 'text', nullable: true })
  trabajo_realizado: string;

  @Column({ type: 'date', nullable: true })
  proxima_fecha: Date;

  @Column({ type: 'varchar', length: 50, default: 'En Reparación' })
  estado: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;
}
