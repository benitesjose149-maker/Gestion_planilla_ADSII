import { Component, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  usuario = signal('');
  contrasena = signal('');
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  private returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Si ya está autenticado, mandarlo al dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
    // Obtener la url de retorno (por ejemplo, si intentó ir a /vacaciones)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit() {
    if (!this.usuario() || !this.contrasena()) {
      this.error.set('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.usuario(), this.contrasena()).subscribe({
      next: (success) => {
        this.loading.set(false);
        if (success) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.error.set('Credenciales incorrectas. Verifique sus datos.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Error de conexión con el servidor. Intente de nuevo.');
      }
    });
  }

  togglePassword() {
    this.showPassword.update(val => !val);
  }
}

