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
  
  @Input() placeholder = 'Buscar por nombre o cédula...';
  @Input() label = 'Responsable *';
  
  internalControl = new FormControl('', [Validators.required]);
  usuariosSugeridos: any[] = [];
  buscandoUsuarios = false;
  
  // Visual Information for UX
  nombreResponsable: string = '';
  cedulaSeleccionada: string | null = null;
  isSelectingFromList = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  private sub!: Subscription;

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.sub = this.internalControl.valueChanges.pipe(
      filter(val => val !== null),
      tap((val) => {
        if (this.isSelectingFromList) {
           return;
        }
        if (this.internalControl.hasError('notFound')) {
          this.internalControl.setErrors(null);
        }
        this.usuariosSugeridos = [];
        this.nombreResponsable = ''; 
        this.cedulaSeleccionada = null;
        this.onChange(null); // Invalidar en el padre
      }),
      filter(val => val!.length >= 2 && !this.isSelectingFromList),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.buscandoUsuarios = true),
      switchMap(termino => 
        this.inventarioService.buscarUsuariosPredictivo(termino!).pipe(
          catchError(() => of([]))
        )
      ),
      tap(() => this.buscandoUsuarios = false)
    ).subscribe((usuarios: any[]) => {
      if (!this.isSelectingFromList) {
        this.usuariosSugeridos = usuarios;
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  // --- CVA Implementation ---
  writeValue(value: any): void {
    if (value !== this.cedulaSeleccionada) {
      this.cedulaSeleccionada = value;
      
      if (value && value.length >= 6) {
        this.inventarioService.buscarUsuariosPredictivo(value).subscribe(res => {
            const match = res.find((u:any) => u.cedula === value);
            if (match) {
              this.isSelectingFromList = true;
              this.nombreResponsable = `${match.nombres} ${match.apellidos}`;
              this.internalControl.setValue(`${match.cedula} - ${match.nombres} ${match.apellidos}`, { emitEvent: false });
              setTimeout(() => this.isSelectingFromList = false, 50);
            } else {
              this.isSelectingFromList = true;
              this.internalControl.setValue(value, { emitEvent: false });
              setTimeout(() => this.isSelectingFromList = false, 50);
            }
        });
      } else {
         this.isSelectingFromList = true;
         this.internalControl.setValue('', { emitEvent: false });
         this.nombreResponsable = '';
         setTimeout(() => this.isSelectingFromList = false, 50);
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
    if (!this.cedulaSeleccionada || this.internalControl.invalid) {
      return { 
        notFound: !this.cedulaSeleccionada && this.internalControl.value,
        required: this.internalControl.hasError('required')
      };
    }
    return null;
  }

  // --- UI Logic ---
  seleccionarUsuario(usuario: any) {
    this.isSelectingFromList = true;
    this.cedulaSeleccionada = usuario.cedula;
    this.nombreResponsable = `${usuario.nombres} ${usuario.apellidos}`;
    this.internalControl.setValue(`${usuario.cedula} - ${usuario.nombres} ${usuario.apellidos}`, { emitEvent: false });
    this.usuariosSugeridos = [];
    this.internalControl.setErrors(null);
    this.onChange(this.cedulaSeleccionada);
    
    setTimeout(() => {
      this.isSelectingFromList = false;
    }, 50);
  }

  validarCedulaOnBlur() {
    this.onTouched();
    setTimeout(() => {
      // Si el usuario clickea fuera y no hay cedula seleccionada pero hay texto
      if (!this.cedulaSeleccionada && this.internalControl.value) {
         // Intentar buscar match exacto por cédula (si tipeó la cédula manual y se fue)
         const typedValue = this.internalControl.value.trim();
         
         this.inventarioService.verificarCedulaExistente(typedValue).subscribe((existe: boolean) => {
            if (existe) {
               // Auto-seleccionar
               this.inventarioService.buscarUsuariosPredictivo(typedValue).subscribe(res => {
                  const match = res.find((u:any) => u.cedula === typedValue);
                  if (match) {
                     this.seleccionarUsuario(match);
                  }
               });
            } else {
               this.internalControl.setErrors({ notFound: true });
               this.onChange(null);
            }
         });
      } else if (!this.internalControl.value) {
         this.onChange(null);
      }
    }, 200);
  }
}
