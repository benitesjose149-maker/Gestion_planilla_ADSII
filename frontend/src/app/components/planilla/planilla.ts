import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeesService, Employee } from '../../services/employees.service';

interface EmpleadoPlanilla {
  id: number;
  nombre: string;
  cargo: string;
  sueldoBase: number;
  asignacionFamiliar: number;
  horasExtra: number;
  tasaAfp: number; // e.g. 0.12 (12%)
}

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planilla.html',
  styleUrl: './planilla.css'
})
export class PlanillaComponent implements OnInit {
  empleados = signal<EmpleadoPlanilla[]>([]);

  nuevoNombre = signal('');
  categoriaSeleccionada = signal('');
  subcargoSeleccionado = signal('');
  nuevoSueldo = signal<number | null>(null);
  nuevoAsigFam = signal(false);
  nuevoAfp = signal(0.12);
  tipoTrabajo = signal('Planilla');

  categoriasCargo = [
    {
      id: 'desarrollador',
      nombre: 'Desarrollador',
      subcargos: [
        'Desarrollador Junior', 
        'Desarrollador Senior', 
        'Desarrollador Backend', 
        'Desarrollador Movil', 
        'Desarrollador Web'
      ]
    },
    {
      id: 'analista',
      nombre: 'Analista',
      subcargos: [
        'Analista QA', 
        'Analista de Sistemas', 
        'Analista SEO', 
        'Analista Funcional'
      ]
    },
    {
      id: 'disenador',
      nombre: 'Diseñador',
      subcargos: [
        'Diseñador UI/UX', 
        'Diseñador Grafico', 
        'UI Designer'
      ]
    },
    {
      id: 'administrador',
      nombre: 'Administrador / Ingeniería',
      subcargos: [
        'Administrador BD', 
        'Administrador Cloud', 
        'DevOps Engineer', 
        'Seguridad Informatica'
      ]
    },
    {
      id: 'gestion',
      nombre: 'Gestión y Soporte',
      subcargos: [
        'Gerente de Proyecto', 
        'Scrum Master', 
        'Product Owner', 
        'Especialista de HR', 
        'Contadora', 
        'Soporte Tecnico'
      ]
    }
  ];

  onCategoriaChange(catId: string) {
    this.categoriaSeleccionada.set(catId);
    this.subcargoSeleccionado.set('');
  }

  getSubcargos(): string[] {
    const cat = this.categoriasCargo.find(c => c.id === this.categoriaSeleccionada());
    return cat ? cat.subcargos : [];
  }

  totalPlanilla = computed(() => {
    return this.empleados().reduce((sum, emp) => sum + this.calcularNeto(emp), 0);
  });

  totalSueldoBase = computed(() => {
    return this.empleados().reduce((sum, emp) => sum + emp.sueldoBase, 0);
  });

  totalDescuentos = computed(() => {
    return this.empleados().reduce((sum, emp) => sum + this.calcularDescuentos(emp), 0);
  });

  constructor(private employeesService: EmployeesService) {}

  ngOnInit() {
    this.cargarEmpleados();
  }

  cargarEmpleados() {
    this.employeesService.getEmployees().subscribe({
      next: (data) => {
        const mapped = data.map((emp: any) => ({
          id: emp.idemp,
          nombre: `${emp.nombre} ${emp.apellido}`.trim(),
          cargo: emp.cargo,
          sueldoBase: Number(emp.sueldo_base),
          asignacionFamiliar: Number(emp.asignacion_familiar || 0),
          horasExtra: Number(emp.horas_extra || 0),
          tasaAfp: Number(emp.tasa_afp)
        }));
        this.empleados.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
      }
    });
  }

  calcularDescuentos(emp: EmpleadoPlanilla): number {
    const bruto = emp.sueldoBase + emp.asignacionFamiliar + emp.horasExtra;
    return bruto * emp.tasaAfp;
  }

  calcularNeto(emp: EmpleadoPlanilla): number {
    const bruto = emp.sueldoBase + emp.asignacionFamiliar + emp.horasExtra;
    return bruto - this.calcularDescuentos(emp);
  }

  agregarEmpleado() {
    if (!this.nuevoNombre() || !this.subcargoSeleccionado() || !this.nuevoSueldo()) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    // Dividir nombre completo en nombre y apellido
    const nombreCompleto = this.nuevoNombre().trim();
    const spaceIndex = nombreCompleto.indexOf(' ');
    let nombre = nombreCompleto;
    let apellido = '';
    
    if (spaceIndex !== -1) {
      nombre = nombreCompleto.substring(0, spaceIndex);
      apellido = nombreCompleto.substring(spaceIndex + 1);
    } else {
      apellido = ' '; // Apellido vacío opcional
    }

    let asignacionFamiliar = 0.00;
    let tasa = 0.00;
    let nombreAfp = 'Honorarios';

    if (this.tipoTrabajo() === 'Planilla') {
      asignacionFamiliar = this.nuevoAsigFam() ? 102.50 : 0.00;
      tasa = Number(this.nuevoAfp());
      nombreAfp = 'Integra';
      if (tasa === 0.128) nombreAfp = 'Prima';
      else if (tasa === 0.119) nombreAfp = 'Profuturo';
      else if (tasa === 0.13) nombreAfp = 'ONP';
    }

    const nuevoEmp: Employee = {
      nombre,
      apellido,
      cargo: this.subcargoSeleccionado(),
      sueldo_base: this.nuevoSueldo() || 0,
      asignacion_familiar: asignacionFamiliar,
      horas_extra: 0,
      nombre_afp: nombreAfp,
      tasa_afp: tasa
    };

    this.employeesService.createEmployee(nuevoEmp).subscribe({
      next: (response) => {
        this.cargarEmpleados(); // Recargar de la BD para tener el ID real
        this.nuevoNombre.set('');
        this.categoriaSeleccionada.set('');
        this.subcargoSeleccionado.set('');
        this.nuevoSueldo.set(null);
        this.nuevoAsigFam.set(false);
        this.tipoTrabajo.set('Planilla');
      },
      error: (err) => {
        console.error('Error al registrar empleado:', err);
        alert('Error al registrar el empleado en la base de datos.');
      }
    });
  }



  eliminarEmpleado(id: number) {
    if (confirm('¿Está seguro de eliminar este empleado?')) {
      this.employeesService.deleteEmployee(id).subscribe({
        next: () => {
          this.cargarEmpleados();
        },
        error: (err) => {
          console.error('Error al eliminar empleado:', err);
          alert('Error al eliminar el empleado.');
        }
      });
    }
  }
}

