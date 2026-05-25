import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly AUTH_KEY = 'payroll_auth_token';
  private readonly USER_KEY = 'payroll_user_info';

  isAdmin(): boolean {
    return this.currentUser()?.role === 'Administrador';
  }

  isSupervisor(): boolean {
    return this.currentUser()?.role === 'Usuario';
  }

  getIdemp(): number {
    return this.currentUser()?.idemp || 0;
  }

  getRol(): string {
    return this.currentUser()?.role || '';
  }


  isLoggedIn = signal<boolean>(this.checkToken());
  currentUser = signal<any>(this.getUserInfo());

  constructor(private http: HttpClient, private router: Router) { }

  private checkToken(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem(this.AUTH_KEY);
    }
    return false;
  }

  private getUserInfo(): any {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  login(usuario: string, contrasena: string): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/login`, { nombre: usuario, password: contrasena })
      .pipe(
        map(response => {
          if (response && response.token) {
            localStorage.setItem(this.AUTH_KEY, response.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
            this.isLoggedIn.set(true);
            this.currentUser.set(response.user);
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Error de login:', error);
          return of(false);
        })
      );
  }

  logout() {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}

