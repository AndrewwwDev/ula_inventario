import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReviewGoodsComponent } from './pages/review-goods/review-goods.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { MantenimientoComponent } from './pages/mantenimiento/mantenimiento.component';
import { DesincorporacionComponent } from './pages/desincorporacion/desincorporacion.component';
import { BitacoraComponent } from './pages/bitacora/bitacora.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { ManualUsuarioComponent } from './pages/manual-usuario/manual-usuario.component';
import { CambiarPasswordComponent } from './pages/cambiar-password/cambiar-password.component';
import { RestablecerPasswordComponent } from './pages/restablecer-password/restablecer-password.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'restablecer-password', component: RestablecerPasswordComponent },
  { path: 'review-goods', component: ReviewGoodsComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: InicioComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'mantenimiento', component: MantenimientoComponent },
      { path: 'desincorporacion', component: DesincorporacionComponent },
      { path: 'bitacora', component: BitacoraComponent },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [roleGuard] },
      { path: 'manual-usuario', component: ManualUsuarioComponent },
      { path: 'cambiar-password', component: CambiarPasswordComponent }
    ]
  },
  { path: '**', redirectTo: '/login' } // Wildcard fallback
];
