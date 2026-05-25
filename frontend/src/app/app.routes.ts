import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { PlanillaComponent } from './components/planilla/planilla';
import { VacacionesComponent } from './components/vacaciones/vacaciones';
import { AsistenciaComponent } from './components/asistencia/asistencia';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'planilla', component: PlanillaComponent },
      { path: 'vacaciones', component: VacacionesComponent },
      { path: 'asistencia', component: AsistenciaComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
