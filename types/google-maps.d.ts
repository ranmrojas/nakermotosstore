declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        Geocoder: new () => any;
        LatLng: new (lat: number, lng: number) => any;
        LatLngBounds: new (sw: any, ne: any) => any;
        InfoWindow: new (options: any) => any;
        places: {
          Autocomplete: new (input: HTMLInputElement, options: any) => any;
        };
        event: {
          addListener: (instance: any, eventName: string, handler: Function) => any;
          removeListener: (listener: any) => void;
        };
        SymbolPath: {
          CIRCLE: number;
        };
      };
    };
  }
}

export {}; 