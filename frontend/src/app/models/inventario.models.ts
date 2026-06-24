export interface CatUbicacion {
  id: string;
  nombre: string;
}

export interface CatArea {
  id: string;
  nombre: string;
}

export interface Bien {
  codigo_id: string;
  nombre: string;
  descripcion?: string;
  categoria_id: string;
  estado_id: string;
  condicion_fisica: string;
  ubicacion_id: string; // Foreign Key a cat_ubicaciones
  area_id: string;      // Foreign Key a cat_areas
  personal_cedula: string;
  personal?: {
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo?: string;
  };
  url_foto_principal?: string;
  marca?: string;
  modelo?: string;
  serial_fabricante: string;
}
