import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html'
})
export class InicioComponent implements OnInit {

  stats: any[] = [
    { label: 'Total de bienes', value: '0', icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-gray-100', filterName: null },
    { label: 'Activos', value: '0', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-100', border: 'border-gray-100', filterName: 'Activo' },
    { label: 'Inactivos', value: '0', icon: 'cancel', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-100', filterName: 'Inactivo' },
    { label: 'En Mantenimiento', value: '0', icon: 'build', color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-gray-100', filterName: 'Mantenimiento' },
    { label: 'Sin Asignación', value: '0', icon: 'person_off', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-gray-100', filterName: 'Sin Asignación' },
    { label: 'Desincorporados', value: '0', icon: 'gavel', color: 'text-gray-600', bg: 'bg-gray-200', border: 'border-gray-100', filterName: 'Desincorporado' },
    { label: 'Faltante', value: '0', icon: 'warning_amber', color: 'text-white', bg: 'bg-red-600', border: 'border-red-600 bg-red-50 shadow-md ring-1 ring-red-500', filterName: 'Faltante' },
    
    { label: 'Buen estado', value: '0', icon: 'thumb_up', color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-gray-100', isCondicion: true },
    { label: 'Regular', value: '0', icon: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-gray-100', isCondicion: true },
    { label: 'Mal estado', value: '0', icon: 'thumb_down', color: 'text-red-500', bg: 'bg-red-100', border: 'border-gray-100', isCondicion: true }
  ];

  constructor(
    private inventarioService: InventarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.inventarioService.getDashboardMetrics().subscribe((metricasBD: any[]) => {
      let totalCalculado = 0;

      this.stats.forEach(stat => {
        // Encontramos el registro en la vista que coincida con el nombre del estado (o condición)
        // Usamos el 'filterName' para estados, o 'label' para condiciones
        const filterKey = stat.filterName || stat.label;
        const match = metricasBD.find((m: any) => m.estado_nombre === filterKey);

        if (match) {
          stat.value = match.total_bienes.toString();
          
          // Sumamos al total general solo si no es 'Desincorporado' ni condiciones físicas para no duplicar
          if (stat.filterName && stat.filterName !== 'Desincorporado' && stat.filterName !== 'Faltante') {
            totalCalculado += Number(match.total_bienes);
          }
        } else if (!stat.isCondicion) {
          stat.value = '0';
        }
      });

      // Actualizamos el total general (asumiendo que la vista no retorna 'Total de bienes')
      const statTotal = this.stats.find(s => s.label === 'Total de bienes');
      if (statTotal) {
        // Si la vista retorna un total absoluto, se podría usar, sino usamos la suma
        const matchTotal = metricasBD.find((m: any) => m.estado_nombre === 'Total');
        statTotal.value = matchTotal ? matchTotal.total_bienes.toString() : totalCalculado.toString();
      }
    });

    // NUEVO: Calcular las condiciones físicas a partir de la data real completa de los bienes
    this.inventarioService.getBienes().subscribe((bienes: any[]) => {
      let buenEstado = 0;
      let regular = 0;
      let malEstado = 0;
      let sinAsignacion = 0;

      bienes.forEach((bien: any) => {
        // Calcular Condiciones Físicas
        const condicion = bien.condicion_fisica ? bien.condicion_fisica.trim().toLowerCase() : '';
        if (condicion === 'buen estado') buenEstado++;
        else if (condicion === 'regular') regular++;
        else if (condicion === 'mal estado') malEstado++;

        // Calcular Sin Asignación (Responsable Nulo o Vacío)
        if (!bien.personal_cedula) sinAsignacion++;
      });

      // Actualizar el arreglo de stats reactivamente
      const statBuen = this.stats.find(s => s.label === 'Buen estado');
      if (statBuen) statBuen.value = buenEstado.toString();

      const statReg = this.stats.find(s => s.label === 'Regular');
      if (statReg) statReg.value = regular.toString();

      const statMal = this.stats.find(s => s.label === 'Mal estado');
      if (statMal) statMal.value = malEstado.toString();

      const statSinAsignacion = this.stats.find(s => s.label === 'Sin Asignación');
      if (statSinAsignacion) statSinAsignacion.value = sinAsignacion.toString();
    });
  }

  navigateTo(stat: any) {
    if (stat.filterName === 'Desincorporado') {
      this.router.navigate(['/dashboard/desincorporacion']);
    } else {
      // Paso 1: Redirección reactiva. Usa stat.filterName o stat.label
      const filtroKey = stat.filterName || stat.label;
      this.router.navigate(['/dashboard/inventario'], { queryParams: { filtro: filtroKey } });
    }
  }
}
