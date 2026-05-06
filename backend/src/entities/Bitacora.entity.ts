import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entidad: string;

  @Column({ type: 'int', nullable: true })
  entidad_id: number;

  @Column({ type: 'json', nullable: true })
  diff_visual: any;

  @Column({ type: 'text', nullable: true })
  detalles: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}
