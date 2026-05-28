import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { BitacoraService } from '../../services/bitacora.service';
import { AuthService } from '../../services/auth.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

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
  
  showCreateModal = false;
  creatingUser = false;
  newUser = {
    cedula: '',
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    rol: 'Usuario'
  };

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
    try {
      const { data, error } = await this.supabase
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.warn('Error de acceso a tabla:', error);
        this.usuarios = [];
      } else {
        this.usuarios = data || [];
      }
    } catch (err) {
      console.warn('Error de acceso a tabla (Excepción):', err);
      this.usuarios = [];
    }
    this.loading = false;
  }

  openCreateModal() {
    this.newUser = {
      cedula: '',
      email: '',
      password: '',
      nombres: '',
      apellidos: '',
      cargo: '',
      rol: 'Usuario'
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async createUser() {
    if (!this.newUser.cedula || !this.newUser.email || !this.newUser.password || !this.newUser.nombres || !this.newUser.apellidos || !this.newUser.cargo) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    this.creatingUser = true;

    try {
      // 1. Verificar si la cédula ya existe localmente para evitar errores extraños
      const { data: existingCedula } = await this.supabase
        .from('usuarios')
        .select('cedula')
        .eq('cedula', this.newUser.cedula)
        .single();
        
      if (existingCedula) {
        alert('Ya existe un usuario registrado con esta cédula.');
        this.creatingUser = false;
        return;
      }

      // 2. Crear cliente temporal para no sobreescribir la sesión del Super Admin en localStorage
      const tempClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // 3. Registrar en Supabase Auth
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: this.newUser.email,
        password: this.newUser.password,
      });

      if (authError) {
        throw new Error('Error al crear credenciales: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener el usuario creado.');
      }

      // 4. Insertar en tabla public.usuarios usando el cliente principal (tiene los permisos del Super Admin)
      const { error: dbError } = await this.supabase
        .from('usuarios')
        .insert([{
          cedula: this.newUser.cedula,
          email: this.newUser.email,
          nombres: this.newUser.nombres,
          apellidos: this.newUser.apellidos,
          rol: this.newUser.rol,
          cargo: this.newUser.cargo,
          estado_cuenta: 'Activo',
          auth_id: authData.user.id
        }]);

      if (dbError) {
        // Fallback: si falla en DB habría que borrarlo de Auth idealmente, 
        // pero requiere API de admin. Lo dejamos como registro huérfano.
        throw new Error('Error al guardar datos del perfil: ' + dbError.message);
      }

      // 5. Registrar en bitácora
      await this.bitacoraService.logAction('CREACION_USUARIO', {
        cedula_nueva: this.newUser.cedula,
        rol_asignado: this.newUser.rol
      });

      alert('Usuario creado exitosamente.');
      this.closeCreateModal();
      await this.loadUsuarios();

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al crear el usuario.');
    } finally {
      this.creatingUser = false;
    }
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
