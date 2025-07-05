export interface DireccionGuardada {
  id: string;
  direccion: string;
  valordomicilio: number;
  lat?: number;
  lng?: number;
  nombre?: string; // Nombre descriptivo de la dirección (ej: "Casa", "Trabajo")
  esPrincipal?: boolean;
  fechaCreacion: string;
}

export interface DireccionesGuardadas {
  direcciones: DireccionGuardada[];
  direccionPrincipal?: string; // ID de la dirección principal
} 