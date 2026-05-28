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
    this.inventarioService.getDashboardMetrics().subscribe((res: any) => {
      const { metrics, estados } = res;
      
      this.stats.forEach(stat => {
        if (stat.label === 'Total de bienes') {
          stat.value = metrics['Total']?.toString() || '0';
        } else if (stat.filterName) {
          stat.value = metrics[stat.filterName]?.toString() || '0';
          const matchedEstado = estados?.find((e: any) => e.nombre === stat.filterName);
          if (matchedEstado) {
            stat.filterId = matchedEstado.id;
          }
        } else if (stat.isCondicion) {
          stat.value = metrics[stat.label]?.toString() || '0';
        }
      });
    });
  }

  navigateTo(stat: any) {
    if (stat.filterName === 'Desincorporado') {
      this.router.navigate(['/dashboard/desincorporacion']);
    } else if (stat.filterId) {
      this.router.navigate(['/dashboard/inventario'], { queryParams: { estado: stat.filterId } });
    } else if (stat.isCondicion) {
      // Opcional: filtrar por condición
    } else {
      this.router.navigate(['/dashboard/inventario']);
    }
  }
}
