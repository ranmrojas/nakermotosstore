// Esta página actúa ahora como una página "pasarela" 
// El contenido real viene del proxy HTML definido en next.config.ts
export default function TiendaPage() {
  // Esta función no hace nada porque el contenido viene del proxy
  // La configuración en next.config.ts redirige /tienda/* a /api/proxy-html/tienda/licorerazonafrank/*
  return null;
}