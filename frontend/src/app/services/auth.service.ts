import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map, catchError, throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser$: Observable<any>;

  constructor(private supabase: SupabaseService) {
    this.currentUser$ = this.supabase.user$;
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
    // Supabase handles session internally, but if needed:
    return null; 
  }

  get currentUserValue() {
    return this.supabase.user;
  }
}
