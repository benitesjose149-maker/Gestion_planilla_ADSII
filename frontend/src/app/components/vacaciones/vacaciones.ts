import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VacationsService, VacationRequest, VacationBalance } from '../../services/vacations.service';

interface SolicitudVacacion {
  id: number;
  empleado: string;
  dias: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

interface BalanceVacaciones {
  idemp: number;
  empleado: string;
  totales: number;
  tomados: number;
  disponibles: number;
}

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vacaciones.html',
  styleUrl: './vacaciones.css'
})
export class VacacionesComponent implements OnInit {
  solicitudes = signal<SolicitudVacacion[]>([]);
  balances = signal<BalanceVacaciones[]>([]);
  mostrarModal = signal(false);
  empleadoSeleccionado = signal<number | null>(null);
  diasSolicitados = signal<number | null>(null);
  fechaInicio = signal('');
  fechaFin = signal('');

  constructor(private vacationsService: VacationsService) {
    effect(() => {
      const inicio = this.fechaInicio();
      const fin = this.fechaFin();
      if (inicio && fin) {
        this.diasSolicitados.set(this.calcularDiasHabiles(inicio, fin));
      }
    });
  }

  calcularDiasHabiles(inicio: string, fin: string): number {
    const start = new Date(inicio + 'T00:00:00');
    const end = new Date(fin + 'T00:00:00');
    let dias = 0;
    const current = new Date(start);

    while (current <= end) {
      const diaSemana = current.getDay(); // 0=Dom, 6=Sab
      if (diaSemana !== 0 && diaSemana !== 6) {
        dias++;
      }
      current.setDate(current.getDate() + 1);
    }
    return dias;
  }




  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargarBalances();
    this.cargarSolicitudes();
  }

  cargarBalances() {
    this.vacationsService.getBalances().subscribe({
      next: (data) => {
        const mapped = data.map((bal: any) => ({
          idemp: bal.idemp,
          empleado: bal.empleado || 'Desconocido',
          totales: bal.totales,
          tomados: bal.tomados,
          disponibles: bal.disponibles
        }));
        this.balances.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar balances:', err);
      }
    });
  }

  cargarSolicitudes() {
    this.vacationsService.getRequests().subscribe({
      next: (data) => {
        const mapped = data.map((req: any) => ({
          id: req.id_request,
          empleado: req.empleado || 'Desconocido',
          dias: req.dias,
          fechaInicio: req.fecha_inicio,
          fechaFin: req.fecha_fin,
          estado: req.estado as 'Pendiente' | 'Aprobado' | 'Rechazado'
        }));
        this.solicitudes.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  aprobarSolicitud(id: number) {
    this.vacationsService.updateRequestStatus(id, 'Aprobado').subscribe({
      next: () => {
        this.cargarDatos(); // Recargar todo para actualizar balances
      },
      error: (err) => {
        console.error('Error al aprobar solicitud:', err);
        alert(err.error?.error || 'Error al aprobar solicitud.');
      }
    });
  }

  rechazarSolicitud(id: number) {
    this.vacationsService.updateRequestStatus(id, 'Rechazado').subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al rechazar solicitud:', err);
        alert(err.error?.error || 'Error al rechazar solicitud.');
      }
    });
  }
  cerrarModal() {
    this.mostrarModal.set(false);
    this.empleadoSeleccionado.set(null);
    this.diasSolicitados.set(null);
    this.fechaInicio.set('');
    this.fechaFin.set('');
  }
  crearSolicitud() {
    console.log({
      empleado: this.empleadoSeleccionado(),
      dias: this.diasSolicitados(),
      inicio: this.fechaInicio(),
      fin: this.fechaFin()
    });

    if (!this.empleadoSeleccionado() || !this.diasSolicitados() || !this.fechaInicio() || !this.fechaFin()) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    const nuevaSol = {
      idemp: Number(this.empleadoSeleccionado()),
      dias: this.diasSolicitados() || 0,
      fecha_inicio: this.fechaInicio(),
      fecha_fin: this.fechaFin()
    };

    this.vacationsService.createRequest(nuevaSol).subscribe({
      next: () => {
        this.cargarDatos();
        this.empleadoSeleccionado.set(null);
        this.diasSolicitados.set(null);
        this.fechaInicio.set('');
        this.fechaFin.set('');
        this.cerrarModal();

      },
      error: (err) => {
        console.error('Error al crear solicitud:', err);
        alert(err.error?.error || 'Error al crear la solicitud de vacaciones.');
      }
    });
  }
}
