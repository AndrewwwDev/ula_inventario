import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const client = await supabaseService.getClient(); // Ensure init
    const session = await supabaseService.getSession();

    // Código defensivo: Validar que la sesión exista
    if (session) {
      return true; // Hay sesión, permitir paso
    }

    // Prevención de Condiciones de Carrera (Race Conditions)
    // A veces getSession() retorna null si Supabase aún está procesando el token en localStorage
    const user = await supabaseService.getUser();
    if (user) {
      return true;
    }

    return router.createUrlTree(['/login']);
  } catch (error) {
    console.error('[authGuard] Error consultando sesión:', error);
    return router.createUrlTree(['/login']); // Redirigir por seguridad si falla
  }
};
