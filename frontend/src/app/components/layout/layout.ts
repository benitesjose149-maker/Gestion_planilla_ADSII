import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent {

  public authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = signal(false);
  showUserDropdown = signal(false);
  currentUser = this.authService.currentUser;

  toggleSidebar() {
    this.isSidebarCollapsed.update(val => !val);
  }

  toggleDropdown() {
    this.showUserDropdown.update(val => !val);
  }

  logout() {
    this.authService.logout();
  }

  getCurrentRouteName(): string {
    const url = this.router.url;
    if (url.includes('/planilla')) return 'Gestión de Planillas';
    if (url.includes('/vacaciones')) return 'Control de Vacaciones';
    if (url.includes('/asistencia')) return 'Registro de Asistencia';
    return 'Dashboard Principal';
  }
}
