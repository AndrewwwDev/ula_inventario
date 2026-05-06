import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div *ngFor="let toast of toastService.toasts$ | async" 
           class="pointer-events-auto flex items-center p-4 min-w-[300px] max-w-sm rounded-xl shadow-lg border transform transition-all duration-300 translate-x-0 opacity-100"
           [ngClass]="{
             'bg-green-50 border-green-200 text-green-800': toast.type === 'success',
             'bg-red-50 border-red-200 text-red-800': toast.type === 'error',
             'bg-yellow-50 border-yellow-200 text-yellow-800': toast.type === 'warning'
           }">
        
        <span class="material-icons-outlined mr-3" [ngClass]="{
          'text-green-500': toast.type === 'success',
          'text-red-500': toast.type === 'error',
          'text-yellow-500': toast.type === 'warning'
        }">
          {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error_outline' : 'warning' }}
        </span>
        
        <div class="flex-1">
          <p class="text-sm font-bold">{{ toast.message }}</p>
        </div>
        
        <button (click)="toastService.remove(toast.id)" class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none">
          <span class="material-icons-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  `
})
export class ToastsComponent {
  constructor(public toastService: ToastService) {}
}
