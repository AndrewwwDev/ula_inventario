import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase!: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    console.log('[SupabaseService] Constructor Inicializando...');
    console.log('[SupabaseService] URL:', environment.supabaseUrl ? 'OK (Configurada)' : 'ERROR: URL VACÍA');
    console.log('[SupabaseService] KEY:', environment.supabaseKey ? 'OK (Configurada)' : 'ERROR: KEY VACÍA');
    
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    console.log('[SupabaseService] createClient() ejecutado con éxito');

    // Configurar listener para cambios de sesión (login, logout)
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  // ==== ASYNC GET CLIENT ====
  async getClient(): Promise<SupabaseClient> {
    if (this.supabase) {
      return this.supabase;
    }
    
    console.log('[SupabaseService] getClient() - Inicializando cliente bajo demanda...');
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    if (!this.supabase) {
      throw new Error('No se pudo inicializar el cliente de Supabase. Revisa environment.');
    }
    return this.supabase;
  }

  // ==== RAW CLIENT (Fallback para sincrono) ====
  get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client no ha sido inicializado');
    }
    return this.supabase;
  }

  // ==== CENTRALIZED PROFILE FETCHER ====
  async getCurrentUserProfile() {
    try {
      const client = await this.getClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        return null;
      }

      const userId = sessionData.session.user.id;
      
      const { data: perfil, error: dbError } = await client
        .from('usuarios')
        .select('cedula, nombres, rol')
        .eq('auth_id', userId)
        .single();

      if (dbError || !perfil) {
        console.error('[SupabaseService] Error obteniendo perfil de base de datos:', dbError);
        return null;
      }

      console.log(`🔐 [SupabaseService] Sesión Activa Detectada - Usuario: ${perfil.nombres} | Rol: ${perfil.rol}`);
      return perfil;

    } catch (err) {
      console.error('[SupabaseService] Error crítico en getCurrentUserProfile:', err);
      return null;
    }
  }

  // ==== SAFE ASYNC METHODS ====
  async getSession() {
    try {
      const client = await this.getClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data || !data.session) return null;
      return data.session;
    } catch (err) {
      console.error('[SupabaseService] Error en getSession:', err);
      return null;
    }
  }

  async getUser() {
    try {
      const client = await this.getClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data || !data.user) return null;
      return data.user;
    } catch (err) {
      console.error('[SupabaseService] Error en getUser:', err);
      return null;
    }
  }

  // ==== AUTHENTICATION ====
  get user$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  get user(): User | null {
    return this.currentUser.value;
  }

  get auth() {
    return this.client.auth;
  }

  // ==== DATABASE ====
  get from() {
    return this.client.from.bind(this.client);
  }

  // ==== STORAGE ====
  get storage() {
    return this.client.storage;
  }
}

