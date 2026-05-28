import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const roleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  console.log(`[RoleGuard] Evaluando acceso para ruta: ${state.url}`);

  try {
    // 1. Obtener el perfil centralizado con los metadatos exactos de BD
    const perfil = await supabaseService.getCurrentUserProfile();

    if (!perfil) {
      console.warn('[RoleGuard] No hay sesión o perfil activo. Redirigiendo a /login.');
      return router.createUrlTree(['/login']);
    }

    // 2. MATRIZ DE PERMISOS ESTRICTA
    if (perfil.rol === 'Super Administrador') {
      return true; // Acceso total y absoluto
    }

    if (perfil.rol === 'Administrador') {
      // Bloquear el acceso a la gestión de usuarios
      if (state.url.includes('/usuarios')) {
        console.warn('[RoleGuard] Acceso denegado: Administrador intentó acceder a gestión de usuarios.');
        return router.createUrlTree(['/dashboard/inicio']);
      }
      // Acceso permitido al resto de rutas de inventario
      return true;
    }
    
    if (perfil.rol === 'Usuario') {
      // Bloquear el acceso a la gestión de usuarios
      if (state.url.includes('/usuarios')) {
        console.warn('[RoleGuard] Acceso denegado: Usuario intentó acceder a gestión de usuarios.');
        return router.createUrlTree(['/dashboard/inicio']);
      }
      return true;
    }

    // Roles desconocidos
    console.warn(`[RoleGuard] Usuario denegado. Rol actual desconocido: ${perfil.rol}`);
    return router.createUrlTree(['/dashboard/inicio']);

  } catch (error) {
    console.error('[RoleGuard] Error crítico en Guard:', error);
    return router.createUrlTree(['/dashboard/inicio']);
  }
};
