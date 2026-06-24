import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { BitacoraService } from '../../services/bitacora.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
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
  @ViewChild('userForm') userForm!: NgForm;
  
  newUser = {
    cedula: '',
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    rol: 'Administrador'
  };

  constructor(
    private supabase: SupabaseService,
    private bitacoraService: BitacoraService,
    private authService: AuthService,
    private toastService: ToastService
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
      rol: 'Administrador'
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    if (this.userForm) {
      this.userForm.resetForm({
        cedula: '',
        email: '',
        password: '',
        nombres: '',
        apellidos: '',
        cargo: '',
        rol: 'Administrador'
      });
    }
  }

  async createUser() {
    if (!this.newUser.cedula || !this.newUser.email || !this.newUser.password || !this.newUser.nombres || !this.newUser.apellidos || !this.newUser.cargo) {
      this.toastService.show('Por favor, complete todos los campos obligatorios.', 'warning');
      return;
    }

    this.creatingUser = true;

    try {
      // 1. Verificar si la cédula ya existe localmente
      const { data: existingCedula } = await this.supabase
        .from('usuarios')
        .select('cedula')
        .eq('cedula', this.newUser.cedula)
        .maybeSingle();
        
      if (existingCedula) {
        this.toastService.show('Ya existe un usuario registrado con esta cédula.', 'warning');
        this.creatingUser = false;
        return;
      }

      // 2. Crear cliente temporal para Auth sin afectar la sesión actual
      const tempClient = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'temp-auth-' + Date.now(),
          lock: (name: string, acquireTimeout: number, acquire: () => Promise<any>) => acquire()
        }
      });

      // 3. Paso 1 (Autenticación): Registrar credenciales en Auth (auth.users)
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: this.newUser.email,
        password: this.newUser.password,
      });

      if (authError) {
        throw new Error('Error al registrar correo de autenticación: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener el usuario de autenticación creado.');
      }

      // 4. Paso 2 (Inserción en Base de Datos): Crear registro en el Public Schema
      const { error: dbError } = await this.supabase
        .from('usuarios')
        .insert([{
          auth_id: authData.user.id,
          cedula: this.newUser.cedula,
          email: this.newUser.email,
          nombres: this.newUser.nombres,
          apellidos: this.newUser.apellidos,
          cargo: this.newUser.cargo,
          rol: this.newUser.rol,
          estado_cuenta: 'Activo'
        }]);

      if (dbError) {
        console.error('Error insertando en public.usuarios:', dbError);
        throw new Error('El usuario fue creado, pero falló el registro público: ' + dbError.message);
      }

      // 5. Registrar en bitácora
      await this.bitacoraService.logAction('CREACION_USUARIO', {
        cedula_nueva: this.newUser.cedula,
        rol_asignado: this.newUser.rol
      });

      // Flujo de éxito
      this.toastService.show('Usuario creado y registrado correctamente.', 'success');
      this.closeCreateModal();
      await this.loadUsuarios();

    } catch (err: any) {
      console.error(err);
      this.toastService.show(err.message || 'Ocurrió un error al crear el usuario.', 'error');
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

  async forzarRecuperacion(usuario: any) {
    if (!usuario.email) {
      this.toastService.show('El usuario no tiene un correo electrónico válido.', 'error');
      return;
    }

    try {
      const client = await this.supabase.getClient();
      const { error } = await client.auth.resetPasswordForEmail(usuario.email);
      
      if (error) {
        throw error;
      }

      await this.bitacoraService.logAction('RECUPERACION_FORZADA', {
        descripcion: 'El Super Administrador forzó el envío de un correo de recuperación de contraseña para el usuario ' + usuario.email
      });

      this.toastService.show(`Correo de recuperación enviado exitosamente a ${usuario.email}`, 'success');
    } catch (err: any) {
      console.error('Error forzando recuperación:', err);
      this.toastService.show('Error al forzar recuperación: ' + err.message, 'error');
    }
  }
}
