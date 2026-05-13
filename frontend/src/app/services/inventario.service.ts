import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });
  }

  getBienes() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario`, { headers: this.getHeaders() });
  }

  createBien(data: any) {
    return this.http.post<any>(`${this.apiUrl}/inventario`, data, { headers: this.getHeaders() });
  }

  updateBien(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/inventario/${id}`, data, { headers: this.getHeaders() });
  }

  updateBienWithFile(id: number, data: FormData) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });
    return this.http.put<any>(`${this.apiUrl}/inventario/${id}`, data, { headers });
  }

  getBienesDesincorporados() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/desincorporados`, { headers: this.getHeaders() });
  }

  desincorporarBien(id: number, motivo: string, fecha: string, foto: File | null) {
    const formData = new FormData();
    formData.append('motivo', motivo);
    formData.append('fecha', fecha);
    if (foto) {
      formData.append('foto', foto);
    }
    // No set content-type for FormData so browser sets boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.put<any>(`${this.apiUrl}/inventario/${id}/desincorporar`, formData, { headers });
  }

  getCategorias() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/categorias`, { headers: this.getHeaders() });
  }

  getDependencias() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/dependencias`, { headers: this.getHeaders() });
  }

  getEncargados() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/encargados`, { headers: this.getHeaders() });
  }

  // --- MANTENIMIENTO ---
  getAlertasMantenimiento() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/mantenimiento/alertas`, { headers: this.getHeaders() });
  }

  getEnReparacion() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/mantenimiento/reparacion`, { headers: this.getHeaders() });
  }

  getHistorialMantenimiento() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/mantenimiento/historial`, { headers: this.getHeaders() });
  }

  finalizarMantenimiento(id: number, trabajo: string, proximaFecha: string) {
    return this.http.post<any>(`${this.apiUrl}/inventario/mantenimiento/${id}/finalizar`, { trabajo, proximaFecha }, { headers: this.getHeaders() });
  }

  // --- BITACORA ---
  getBitacora() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/bitacora`, { headers: this.getHeaders() });
  }

  // --- PUBLIC ---
  getBienesByEncargado(cedula: string) {
    return this.http.get<any[]>(`${this.apiUrl}/public/bienes-por-encargado?cedula=${cedula}`);
  }
}
