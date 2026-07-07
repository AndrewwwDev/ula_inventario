import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PersonalService } from '../../services/personal.service';
import { BitacoraService } from '../../services/bitacora.service';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal.component.html'
})
export class PersonalComponent implements OnInit {
  personalList: any[] = [];
  personalSeleccionado: any = null;
  mostrarModalBienes: boolean = false;
  mostrarModalAgregar: boolean = false;
  mostrarModalInhabilitar: boolean = false;
  cargando: boolean = true;
  isSubmitting: boolean = false;
  tabActiva: 'Activo' | 'Inhabilitado' = 'Activo';

  personalForm: FormGroup;
  motivoInhabilitacionControl!: FormControl;

  constructor(
    private personalService: PersonalService,
    private bitacoraService: BitacoraService,
    private fb: FormBuilder
  ) {
    this.personalForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern('^[V|E|J|G]-[0-9]{7,9}$')]],
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      cargo: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]]
    });

    this.motivoInhabilitacionControl = this.fb.control('', Validators.required);
  }

  ngOnInit(): void {
    this.cargarPersonal();
  }

  async cargarPersonal() {
    this.cargando = true;
    this.personalList = await this.personalService.obtenerPersonalConBienes();
    this.cargando = false;
  }

  get personalFiltrado() {
    return this.personalList.filter(p => (p.estado || 'Activo') === this.tabActiva);
  }

  abrirModalBienes(persona: any) {
    this.personalSeleccionado = persona;
    this.mostrarModalBienes = true;
  }

  cerrarModalBienes() {
    this.mostrarModalBienes = false;
    setTimeout(() => {
      this.personalSeleccionado = null;
    }, 200);
  }

  abrirModalAgregar() {
    this.personalForm.reset();
    this.personalSeleccionado = null; // Desacoplar variable de estado
    this.mostrarModalAgregar = true;
  }

  cerrarModalAgregar() {
    this.mostrarModalAgregar = false;
    this.isSubmitting = false;
  }

  async guardarPersonal() {
    if (this.personalForm.invalid) return;

    this.isSubmitting = true;
    try {
      const formValue = this.personalForm.value;
      
      // Saneamiento de cédula (evita prefijos duplicados y normaliza a mayúsculas)
      if (formValue.cedula) {
        formValue.cedula = formValue.cedula.trim().toUpperCase();
      }
      
      const existeDuplicado = await this.personalService.verificarDuplicadosGlobal(formValue.cedula, formValue.correo);
      if (existeDuplicado) {
        alert('Error: La cédula o el correo electrónico ya se encuentran registrados en el sistema como usuario o personal.');
        this.isSubmitting = false;
        return;
      }

      await this.personalService.agregarPersonal(formValue);
      
      // Auditoría: Registrar acción en la Bitácora
      await this.bitacoraService.logAction('REGISTRO_NUEVO_PERSONAL', {
        cedula: formValue.cedula,
        nombres: formValue.nombres,
        apellidos: formValue.apellidos
      });

      this.cerrarModalAgregar();
      await this.cargarPersonal();
    } catch (error) {
      alert('Ocurrió un error al guardar el personal. Verifica tu conexión o intenta nuevamente.');
    } finally {
      this.isSubmitting = false;
    }
  }


  abrirModalInhabilitar(empleado: any) {
    this.personalSeleccionado = empleado;
    if (empleado.estado === 'Activo' || !empleado.estado) {
      this.motivoInhabilitacionControl.reset();
      this.mostrarModalInhabilitar = true;
    } else {
      this.activarPersonal(empleado);
    }
  }

  cerrarModalInhabilitar() {
    this.mostrarModalInhabilitar = false;
    setTimeout(() => {
      this.personalSeleccionado = null;
    }, 200);
  }

  async confirmarInhabilitacion() {
    if (this.motivoInhabilitacionControl.invalid || !this.personalSeleccionado) return;
    
    this.isSubmitting = true;
    try {
      const empleado = this.personalSeleccionado;
      const motivo = this.motivoInhabilitacionControl.value || '';
      
      await this.personalService.inhabilitarPersonalConCascada(empleado.cedula, motivo);
      
      // Auditoría: Registrar acción en la Bitácora
      await this.bitacoraService.logAction('INHABILITACION_PERSONAL_CASCADA', {
        cedula: empleado.cedula,
        nombres: empleado.nombres,
        apellidos: empleado.apellidos,
        motivo: motivo
      });

      this.cerrarModalInhabilitar();
      await this.cargarPersonal();
    } catch (error) {
      alert('Error al inhabilitar al personal y liberar sus bienes.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async activarPersonal(empleado: any) {
    const confirmacion = confirm(`¿Estás seguro de que deseas reactivar a ${empleado.nombres}? Volverá al sistema sin bienes asignados.`);
    if (!confirmacion) {
      this.personalSeleccionado = null;
      return;
    }

    try {
      await this.personalService.reactivarPersonal(empleado.cedula);
      
      // Auditoría: Registrar acción en la Bitácora
      await this.bitacoraService.logAction('REACTIVACION_PERSONAL', {
        cedula: empleado.cedula,
        nombres: empleado.nombres,
        apellidos: empleado.apellidos
      });

      this.personalSeleccionado = null;
      await this.cargarPersonal();
    } catch (error) {
      alert('Error al reactivar al personal.');
      this.personalSeleccionado = null;
    }
  }
}
