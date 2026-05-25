import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeesService } from '../../services/employees.service';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  stats = signal({
    totalEmployees: 0,
    totalPayroll: 0,
    pendingVacations: 0,
    attendanceRate: 0
  });

  recentActivity = signal<any[]>([]);

  departamentos = signal([
    { name: 'Tecnología', count: 18, percentage: 40 },
    { name: 'Recursos Humanos', count: 5, percentage: 11 },
    { name: 'Finanzas', count: 8, percentage: 17 },
    { name: 'Operaciones', count: 14, percentage: 32 }
  ]);

  loading = signal(true);

  constructor(
    private employeesService: EmployeesService,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadRecentActivity();
  }

  loadStats() {
    this.employeesService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set({
          totalEmployees: data.totalEmployees || 0,
          totalPayroll: data.totalPayroll || 0,
          pendingVacations: data.pendingVacations || 0,
          attendanceRate: data.attendanceRate || 0
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar stats:', err);
        this.loading.set(false);
      }
    });
  }

  loadRecentActivity() {
    // Cargar registros de asistencia del día para mostrar en actividad reciente
    this.attendanceService.getRecords().subscribe({
      next: (records) => {
        const filtered = records
          .filter(r => r.entrada !== '---')
          .slice(0, 4)
          .map(r => ({
            id: r.id_attendance,
            user: r.empleado || 'Sin nombre',
            action: `Marcó asistencia (${r.entrada})`,
            time: r.entrada,
            status: r.estado === 'Puntual' ? 'normal' : 'danger'
          }));

        if (filtered.length > 0) {
          this.recentActivity.set(filtered);
        } else {
          // Actividad fallback si no hay asistencias hoy
          this.recentActivity.set([
            { id: 1, user: 'Sistema', action: 'Conectado a la base de datos SQL Server', time: 'Ahora', status: 'success' },
            { id: 2, user: 'Admin', action: 'Inicializó panel de control de planilla', time: 'Hace 5m', status: 'normal' }
          ]);
        }
      },
      error: () => {
        this.recentActivity.set([
          { id: 1, user: 'Sistema', action: 'Error al conectar al backend', time: 'Ahora', status: 'danger' }
        ]);
      }
    });
  }
}

