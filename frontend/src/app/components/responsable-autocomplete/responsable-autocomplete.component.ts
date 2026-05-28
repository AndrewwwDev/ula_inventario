import { Component, forwardRef, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors, FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-responsable-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './responsable-autocomplete.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ResponsableAutocompleteComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ResponsableAutocompleteComponent),
      multi: true
    }
  ]
})
export class ResponsableAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  
  @Input() placeholder = 'Ej: 12345678';
  @Input() label = 'Responsable Cédula *';
  
  internalControl = new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]);
  usuariosSugeridos: any[] = [];
  buscandoUsuarios = false;
  
  // Visual Information for UX
  nombreResponsable: string = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  private sub!: Subscription;

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.sub = this.internalControl.valueChanges.pipe(
      filter(val => val !== null),
      tap((val) => {
        if (this.internalControl.hasError('notFound')) {
          this.internalControl.setErrors(null);
        }
        this.usuariosSugeridos = [];
        this.nombreResponsable = ''; // Limpiar nombre si el usuario empieza a editar
        this.onChange(val); // Notificar al padre
      }),
      filter(val => val!.length >= 2 && this.internalControl.valid),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.buscandoUsuarios = true),
      switchMap(termino => 
        this.inventarioService.buscarUsuariosPorCedula(termino!).pipe(
          catchError(() => of([]))
        )
      ),
      tap(() => this.buscandoUsuarios = false)
    ).subscribe((usuarios: any[]) => {
      this.usuariosSugeridos = usuarios;
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  // --- CVA Implementation ---
  writeValue(value: any): void {
    if (value !== this.internalControl.value) {
      this.internalControl.setValue(value, { emitEvent: false });
      
      // Si recibimos una cédula válida al inicializar (ej. Modal Editar), precargamos el nombre
      if (value && value.length >= 6) {
        this.inventarioService.buscarUsuariosPorCedula(value).subscribe(res => {
            const match = res.find((u:any) => u.cedula === value);
            if (match) {
              this.nombreResponsable = `${match.nombres} ${match.apellidos}`;
            }
        });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.internalControl.disable({ emitEvent: false });
    } else {
      this.internalControl.enable({ emitEvent: false });
    }
  }

  // --- Validator Implementation ---
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.internalControl.invalid) {
      return { 
        invalidCedula: true,
        pattern: this.internalControl.hasError('pattern'),
        notFound: this.internalControl.hasError('notFound'),
        required: this.internalControl.hasError('required')
      };
    }
    return null;
  }

  // --- UI Logic ---
  seleccionarUsuario(usuario: any) {
    const newVal = usuario.cedula;
    this.nombreResponsable = `${usuario.nombres} ${usuario.apellidos}`;
    this.internalControl.setValue(newVal, { emitEvent: false });
    this.usuariosSugeridos = [];
    this.internalControl.setErrors(null);
    this.onChange(newVal);
  }

  validarCedulaOnBlur() {
    this.onTouched();
    setTimeout(() => {
      const cedula = this.internalControl.value;
      if (!cedula) return;
      if (this.internalControl.invalid && !this.internalControl.hasError('notFound')) return;
      
      this.inventarioService.verificarCedulaExistente(cedula).subscribe((existe: boolean) => {
        if (!existe) {
          this.internalControl.setErrors({ notFound: true });
          this.nombreResponsable = '';
          this.onChange(null); // Invalidamos al padre
        } else {
          this.internalControl.setErrors(null);
          // Si existe, y no tenemos nombre (escritura manual exacta), lo buscamos para la UX
          if (!this.nombreResponsable) {
            this.inventarioService.buscarUsuariosPorCedula(cedula).subscribe(res => {
              const match = res.find((u:any) => u.cedula === cedula);
              if (match) this.nombreResponsable = `${match.nombres} ${match.apellidos}`;
            });
          }
          this.onChange(cedula);
        }
      });
    }, 200);
  }
}
