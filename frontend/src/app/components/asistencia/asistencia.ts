import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';

interface RegistroAsistencia {
  id: number;
  empleado: string;
  fecha: string;
  entrada: string;
  salida: string;
  estado: 'Puntual' | 'Tardanza' | 'Falta' | 'Permiso';
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css'
})
export class AsistenciaComponent implements OnInit {
  fechaHoy = signal(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  asistencias = signal<RegistroAsistencia[]>([]);
  filtroEstado = signal('Todos');

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.cargarAsistencias();
  }

  cargarAsistencias() {
    this.attendanceService.getRecords().subscribe({
      next: (data) => {
        const mapped = data.map((asis: any) => ({
          id: asis.id_attendance,
          empleado: asis.empleado || 'Sin nombre',
          fecha: asis.fecha,
          entrada: asis.entrada,
          salida: asis.salida,
          estado: asis.estado as 'Puntual' | 'Tardanza' | 'Falta' | 'Permiso'
        }));
        this.asistencias.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar asistencias:', err);
      }
    });
  }

  asistenciasFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    if (filtro === 'Todos') {
      return this.asistencias();
    }
    return this.asistencias().filter(asis => asis.estado === filtro);
  });

  tasaPuntualidad = computed(() => {
    const lista = this.asistencias();
    const asistieron = lista.filter(a => a.estado !== 'Falta');
    if (asistieron.length === 0) return 0;
    const puntuales = asistieron.filter(a => a.estado === 'Puntual').length;
    return (puntuales / asistieron.length) * 100;
  });

  totalFaltas = computed(() => {
    return this.asistencias().filter(a => a.estado === 'Falta').length;
  });

  totalTardanzas = computed(() => {
    return this.asistencias().filter(a => a.estado === 'Tardanza').length;
  });

  marcarAsistencia(tipo: 'entrada' | 'salida') {
    const idemp = 1;

    if (tipo === 'entrada') {
      this.attendanceService.clockIn(idemp).subscribe({
        next: (res) => {
          alert(res.message || 'Entrada registrada con éxito.');
          this.cargarAsistencias();
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Error al registrar entrada.');
        }
      });
    } else {
      this.attendanceService.clockOut(idemp).subscribe({
        next: (res) => {
          alert(res.message || 'Salida registrada con éxito.');
          this.cargarAsistencias();
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Error al registrar salida.');
        }
      });
    }
  }
}

