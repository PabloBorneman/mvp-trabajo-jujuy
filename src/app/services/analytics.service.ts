import { Injectable } from '@angular/core';
declare let gtag: Function;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor() {}

  enviarEvento(nombre: string, categoria: string = 'interacción', etiqueta?: string) {
    gtag('event', nombre, {
      event_category: categoria,
      event_label: etiqueta,
    });
  }

  clicMasInformacion(curso: string) {
    this.enviarEvento('clic_mas_info', 'curso', curso);
  }

  clicInscribirme(curso: string) {
    this.enviarEvento('clic_inscribirme', 'curso', curso);
  }
}
