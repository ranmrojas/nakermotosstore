import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Definición de tipos para la base de datos
export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: number | string | null;
  extension?: string | null;
  sku?: string;
  nota?: string;
  categoria?: string;
}

export interface AuditoriaEntry {
  estado: string;
  usuario: string;
  timestamp: string;
}

export interface DireccionGuardada {
  id: string;
  direccion: string;
  valordomicilio: number;
  lat?: number;
  lng?: number;
  nombre: string;
  esPrincipal: boolean;
  fechaCreacion: string;
}

export interface DireccionesGuardadas {
  direcciones: DireccionGuardada[];
  direccionPrincipal: string;
}

export interface Cliente {
  id: number;
  telefono: string;
  nombre: string;
  direccion: string;
  valordomicilio: number;
  direccionesGuardadas?: DireccionesGuardadas;
  creadoEn: string;
}

export interface Pedido {
  id: number;
  estado: string;
  productos: Producto[];
  subtotal: number;
  domicilio: number;
  total: number;
  medioPago?: string;
  realizadoEn: string;
  enviadoAt?: string;
  auditoria?: AuditoriaEntry[];
  clienteId: number;
  cliente?: Cliente;
}

// Tipado para el cliente de Supabase
export interface Database {
  public: {
    Tables: {
      Pedido: {
        Row: Pedido;
        Insert: Partial<Pedido>;
        Update: Partial<Pedido>;
      };
      Cliente: {
        Row: Cliente;
        Insert: Partial<Cliente>;
        Update: Partial<Cliente>;
      };
      // Agrega otras tablas aquí si es necesario
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);