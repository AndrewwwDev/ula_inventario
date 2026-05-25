import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { BitacoraService } from '../../services/bitacora.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  loading = true;
  currentUserCedula: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private bitacoraService: BitacoraService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.currentUserCedula = this.authService.currentUserValue?.cedula;
    await this.loadUsuarios();
  }

  async loadUsuarios() {
    this.loading = true;
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error cargando usuarios:', error);
    } else {
      this.usuarios = data || [];
    }
    this.loading = false;
  }

  async updateRole(usuario: any, nuevoRol: string) {
    if (usuario.cedula === this.currentUserCedula) {
      alert('No puedes cambiar tu propio rol.');
      // Revert select back visually
      await this.loadUsuarios();
      return;
    }

    const rolAnterior = usuario.rol;
    const { error } = await this.supabase
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('cedula', usuario.cedula);

    if (error) {
      console.error('Error actualizando rol:', error);
      alert('Error al actualizar el rol: ' + error.message);
      await this.loadUsuarios(); // revert
    } else {
      usuario.rol = nuevoRol;
      await this.bitacoraService.logAction('CAMBIO_ROL', {
        cedula_afectada: usuario.cedula,
        rol_anterior: rolAnterior,
        rol_nuevo: nuevoRol
      });
      alert('Rol actualizado con éxito.');
    }
  }

  async toggleEstado(usuario: any) {
    if (usuario.cedula === this.currentUserCedula) {
      alert('No puedes inhabilitarte a ti mismo.');
      return;
    }

    const nuevoEstado = usuario.estado_cuenta === 'Activo' ? 'Inhabilitado' : 'Activo';
    let motivo = null;

    if (nuevoEstado === 'Inhabilitado') {
      motivo = prompt('Motivo de inhabilitación:');
      if (motivo === null) return; // Cancelado
    }

    const { error } = await this.supabase
      .from('usuarios')
      .update({ estado_cuenta: nuevoEstado, motivo_inhabilitacion: motivo })
      .eq('cedula', usuario.cedula);

    if (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar estado: ' + error.message);
    } else {
      usuario.estado_cuenta = nuevoEstado;
      usuario.motivo_inhabilitacion = motivo;
      await this.bitacoraService.logAction(
        nuevoEstado === 'Activo' ? 'CUENTA_ACTIVADA' : 'CUENTA_INHABILITADA', 
        { cedula_afectada: usuario.cedula, motivo: motivo }
      );
    }
  }
}
