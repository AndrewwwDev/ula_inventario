import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

// Create a single instance outside the service
const supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient = supabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    // Configurar listener para cambios de sesión (login, logout)
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  // ==== AUTHENTICATION ====
  get user$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  get user(): User | null {
    return this.currentUser.value;
  }

  get auth() {
    return this.supabase.auth;
  }

  // ==== DATABASE ====
  get from() {
    return this.supabase.from.bind(this.supabase);
  }

  // ==== STORAGE ====
  get storage() {
    return this.supabase.storage;
  }
}
