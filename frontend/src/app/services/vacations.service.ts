import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VacationRequest {
  id_request?: number;
  idemp: number;
  nombre?: string;
  apellido?: string;
  cargo?: string;
  dias: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
}

export interface VacationBalance {
  id_balance?: number;
  idemp: number;
  nombre?: string;
  apellido?: string;
  totales: number;
  tomados: number;
  disponibles: number;
}

@Injectable({
  providedIn: 'root'
})
export class VacationsService {
  private readonly API_URL = 'http://localhost:3000/api/vacations';

  constructor(private http: HttpClient) { }

  getRequests(): Observable<VacationRequest[]> {
    return this.http.get<VacationRequest[]>(`${this.API_URL}/requests`);
  }

  getBalances(): Observable<VacationBalance[]> {
    return this.http.get<VacationBalance[]>(`${this.API_URL}/balances`);
  }

  createRequest(request: { idemp: number; dias: number; fecha_inicio: string; fecha_fin: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/requests`, request);
  }
  updateRequestStatus(id: number, status: 'Aprobado' | 'Rechazado') {
    const action = status === 'Aprobado' ? 'approve' : 'reject';
    return this.http.put<any>(`${this.API_URL}/requests/${id}/${action}`, {});
  }
}
