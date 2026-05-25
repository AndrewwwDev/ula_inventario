import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const publicGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  try {
    const client = await supabaseService.getClient(); // Ensure init
    const session = await supabaseService.getSession();

    // Código defensivo: Validar que la sesión exista
    if (session) {
      return router.createUrlTree(['/dashboard/inicio']);
    }

    return true; // No hay sesión, puede ver el login
  } catch (error) {
    console.error('[publicGuard] Error consultando sesión:', error);
    return true; // En caso de fallo de red, asumimos sin sesión para permitir intentar logueo
  }
};
