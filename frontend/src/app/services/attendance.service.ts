import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AttendanceRecord {
  id_attendance?: number;
  idemp: number;
  empleado?: string;  // ✅ agrega esta línea
  nombre?: string;
  apellido?: string;
  cargo?: string;
  fecha: string;
  entrada: string;
  salida: string;
  estado: string;
}

export interface AttendanceStats {
  Puntual: number;
  Tardanza: number;
  Falta: number;
  Permiso: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly API_URL = 'http://localhost:3000/api/attendance';

  constructor(private http: HttpClient) { }

  getRecords(date?: string): Observable<AttendanceRecord[]> {
    const url = date ? `${this.API_URL}?fecha=${date}` : this.API_URL;
    return this.http.get<AttendanceRecord[]>(url);
  }

  getStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.API_URL}/stats`);
  }

  clockIn(idemp: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/clock-in`, { idemp });
  }

  clockOut(idemp: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/clock-out`, { idemp });
  }
}
