import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReviewGoodsComponent } from './pages/review-goods/review-goods.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'review-goods', component: ReviewGoodsComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
];
