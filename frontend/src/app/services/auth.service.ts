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
        .select('*')
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

  async logout() {
    await this.supabase.auth.signOut();
  }

  get token(): string | null {
    return null; 
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }

}
