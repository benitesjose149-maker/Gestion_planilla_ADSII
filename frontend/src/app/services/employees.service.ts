import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  idemp?: number;
  nombre: string;
  apellido: string;
  cargo: string;
  sueldo_base: number;
  asignacion_familiar: number;
  horas_extra: number;
  nombre_afp: string;
  tasa_afp: number;
  // Computed fields from API
  sueldo_bruto?: number;
  descuento_afp?: number;
  sueldo_neto?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalPayroll: number;
  pendingVacations: number;
  attendanceRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  private readonly API_URL = 'http://localhost:3000/api/employees';

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.API_URL);
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.API_URL}/${id}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/stats/summary`);
  }

  createEmployee(employee: Employee): Observable<any> {
    return this.http.post<any>(this.API_URL, employee);
  }

  updateEmployee(id: number, employee: Employee): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
