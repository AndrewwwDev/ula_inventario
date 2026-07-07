import { Injectable, NgZone } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();
  
  private authInitialized = new BehaviorSubject<boolean>(false);
  public authInitialized$ = this.authInitialized.asObservable();

  // Observable que emite true si el usuario actual es Super Administrador
  public isSuperAdmin$: Observable<boolean> = this.currentUser$.pipe(
    map(user => user && user.rol === 'Super Administrador')
  );

  constructor(private supabase: SupabaseService, private router: Router, private ngZone: NgZone) {
    // Inicializar llamando a un método asíncrono que carga el estado inicial
    this.initializeAuthState();

    // 1. Suscripción nativa a los cambios de Supabase (Misma pestaña y Cross-Tab nativo)
    this.supabase.auth.onAuthStateChange((event: any, session: any) => {
      this.ngZone.run(async () => {
        if (event === 'SIGNED_IN') {
          await this.loadUserProfile(session?.user);
          // Tomar la cédula que loadUserProfile guardó
          const userCedula = this.currentUserSubject.value?.cedula;
          await this.logSessionEvent('LOGIN', userCedula);
          
          // Redirigir si estamos en la vista de login
          if (this.router.url.includes('/login')) {
            this.router.navigate(['/dashboard/inicio']);
          }
        } else if (event === 'SIGNED_OUT') {
          this.currentUserSubject.next(null);
          
          // Limpieza profunda agresiva
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigate(['/login']).catch(() => {
            window.location.href = '/login';
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // El token se refrescó, actualizar el usuario actual
          await this.loadUserProfile(session?.user);
          const userCedula = this.currentUserSubject.value?.cedula;
          await this.logSessionEvent('SESION_RENOVADA', userCedula);
        } else if (event === 'PASSWORD_RECOVERY') {
          // Capturado por Supabase Auth a partir del Magic Link
          this.router.navigate(['/restablecer-password']);
        }
      });
    });
  }

  private async initializeAuthState() {
    try {
      const { data: sessionData } = await this.supabase.auth.getSession();
      if (sessionData.session) {
        await this.loadUserProfile(sessionData.session.user);
      } else {
        this.currentUserSubject.next(null);
      }
    } catch (err) {
      console.error(err);
      this.currentUserSubject.next(null);
    } finally {
      this.authInitialized.next(true);
    }
  }

  // Método auxiliar para cruzar datos de auth.users con public.usuarios
  private async loadUserProfile(authUser: any) {
    if (!authUser) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      // Obtenemos los datos extendidos del usuario
      const { data: publicUser, error } = await this.supabase
        .from('usuarios')
        .select('cedula, nombres, apellidos, rol, email')
        .eq('auth_id', authUser.id)
        .single();

      if (error) {
        console.error('Error obteniendo perfil público:', error.message);
        this.currentUserSubject.next(authUser); // Fallback: al menos emitir el usuario base
      } else if (publicUser) {
        // Combinamos la información
        this.currentUserSubject.next({ ...authUser, ...publicUser });
      }
    } catch (err) {
      console.error('Error inesperado al cargar perfil:', err);
      this.currentUserSubject.next(authUser);
    }
  }

  // MÉTODO NUEVO: Extrae el perfil directo de la base de datos evitando el caché del metadata
  async getPerfilCompleto() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      // Buscamos directamente en la tabla SQL real
      const { data, error } = await this.supabase.supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error obteniendo perfil desde getPerfilCompleto:', error);
        return user;
      }

      return data ? { ...user, ...data } : user;
    } catch (error) {
      console.error('Excepción en getPerfilCompleto:', error);
      return null;
    }
  }

  login(usuario: string, contrasena: string) {
    return from(this.supabase.auth.signInWithPassword({
      email: usuario,
      password: contrasena
    })).pipe(
      map(response => {
        if (response.error) throw response.error;
        return {
          user: response.data.user,
          access_token: response.data.session?.access_token
        };
      })
    );
  }

  private async logSessionEvent(accion: string, usuarioId: string | null) {
    if (!usuarioId) return;
    try {
      const usuario = this.currentUserSubject.value;
      let usuarioAfectado = null;
      if (usuario) {
        usuarioAfectado = {
          cedula: usuario.cedula,
          nombre: `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim()
        };
      }

      let accionDb = accion;
      if (accion === 'LOGIN') accionDb = 'INICIO_SESION';
      else if (accion === 'LOGOUT') accionDb = 'CIERRE_SESION';

      await this.supabase.supabase.from('bitacora').insert({
        cedula_usuario: usuarioId,
        accion: accionDb,
        detalles: {
          operacion: 'SESSION_EVENT',
          mensaje: `El usuario ${accionDb === 'INICIO_SESION' ? 'inició' : 'cerró'} sesión en el sistema.`,
          usuario_afectado: usuarioAfectado,
          dispositivo: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        fecha_hora: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error registrando auditoría de sesión:', e);
    }
  }

  async logout() {
    const userCedula = this.currentUserSubject.value?.cedula;
    try {
      await this.logSessionEvent('LOGOUT', userCedula);
    } catch (e) {
      console.error('Error preventivo al auditar LOGOUT:', e);
    } finally {
      await this.supabase.auth.signOut();
    }
  }

  get token(): string | null {
    return null; 
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }

}
