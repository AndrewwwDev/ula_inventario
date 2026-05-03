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

  getCategorias() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/categorias`, { headers: this.getHeaders() });
  }

  getDependencias() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/dependencias`, { headers: this.getHeaders() });
  }

  getEncargados() {
    return this.http.get<any[]>(`${this.apiUrl}/inventario/encargados`, { headers: this.getHeaders() });
  }
}
