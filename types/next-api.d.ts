import { NextRequest } from 'next/server';

// Declaración de tipos compatible con Next.js 15.3.1 para rutas API dinámicas
declare module 'next' {
  // Declaramos los tipos específicos para las rutas API con parámetros
  export interface NextApiHandlerParams<T = {}> {
    params: T;
  }
}

// Tipos específicos para rutas API dinámicas catch-all
export type CatchAllParams = {
  path: string[];
};

// Tipo para el contexto que proporciona parámetros en rutas dinámicas
export type ApiRouteContext<T = {}> = {
  params: T;
};

// Tipo para funciones de ruta API de Next.js
export type NextApiRoute<T = {}> = (
  req: NextRequest,
  context: ApiRouteContext<T>
) => Promise<Response> | Response;