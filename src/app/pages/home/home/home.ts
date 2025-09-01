/* ───────────────────────────── home.component.ts ───────────────────────────── */

import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink }   from '@angular/router';
import { Slider }       from '../../../components/slider/slider';

import { CursoService } from '../../../services/curso';
import { Curso }        from '../../../models/curso.model';
import { Curso2025 }    from '../../../models/curso-2025.model';

type Estado = 'inscripcion_abierta' | 'proximo' | 'en_curso' | 'finalizado';

export interface HomeCursoCard {
  id: number;
  titulo: string;
  descripcion: string;
  imagen?: string;
  estado: Estado;
  fecha_inicio: string;
  localidades?: string[];
  localidad_principal?: string;
  origen: '2024' | '2025';
  formulario: string;
}

@Component({
  selector:    'app-home',
  standalone:  true,
  templateUrl: './home.html',
  styleUrls:   ['./home.css'],
  imports:     [CommonModule, FormsModule, RouterLink, Slider]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private static introShown = false;
  showIntroModal = false;

  cursosCards: HomeCursoCard[] = [];
  localidadSeleccionada = '';
  localidadesUnicas: string[] = [];

  selectedYear: '2024' | '2025' = '2024';

  loading = false;

  // (opcional) si lo usabas para otra cosa, podés removerlo:
  eagerCount = 6;

  constructor(private cursoService: CursoService) {
    if (!HomeComponent.introShown) {
      this.showIntroModal = true;
      HomeComponent.introShown  = true;
      this.lockScroll(); // ← evita CLS por barra de scroll
    }
  }

  /* ------------------------------- Modal --------------------------------- */

  closeIntroModal(): void {
    this.showIntroModal = false;
    this.unlockScroll();
    // abre el chat luego de cerrar el modal (si existe el botón)
    setTimeout(() => {
      const chatBtn = document.querySelector('.chat-toggle-button') as HTMLElement | null;
      chatBtn?.click();
    }, 200);
  }

  private lockScroll() {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
  private unlockScroll() {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  /* ------------------------------ Lifecycle ------------------------------ */

  ngOnInit(): void {
    this.setYear('2025');
  }

  // Solo visibilidad del botón "arriba" (sin moverlo por JS)
  private boundOnScroll = () => {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 300);
  };

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.boundOnScroll, { passive: true });
    // estado inicial por si se entra scrolleado
    this.boundOnScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.boundOnScroll);
  }

  /* ------------------------------ Data load ------------------------------ */

  private loadCursos2024(): void {
    this.loading = true;
    this.cursoService.getCursos().subscribe({
      next: (cursos: Curso[]) => {
        const cards = (cursos ?? []).map(c => this.mapCurso2024ToCard(c));
        this.applyCards(cards);
      },
      error: (err) => {
        console.error('Error cargando cursos 2024:', err);
        this.applyCards([]);
      },
      complete: () => { this.loading = false; }
    });
  }

  private loadCursos2025(): void {
    this.loading = true;
    const svc: any = this.cursoService as any;

    const handleData = (lista: Curso2025[] | undefined | null) => {
      const cards = (lista ?? []).map(c => this.mapCurso2025ToCard(c));
      this.applyCards(cards);
      this.loading = false;
    };

    if (typeof svc.getCursos2025 === 'function') {
      svc.getCursos2025().subscribe({
        next: (cursos: Curso2025[]) => handleData(cursos),
        error: (err: any) => {
          console.error('Error cargando cursos 2025 (servicio):', err);
          handleData([]);
        }
      });
    } else {
      fetch('assets/cursos_2025.json')
        .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
        .then((data: Curso2025[]) => handleData(data))
        .catch(err => {
          console.error('Error cargando cursos 2025 (assets):', err);
          handleData([]);
        });
    }
  }

  setYear(y: '2024' | '2025'): void {
    if (this.selectedYear === y && this.cursosCards.length) return;
    this.selectedYear = y;
    this.localidadesUnicas = [];
    this.localidadSeleccionada = '';
    if (y === '2024') this.loadCursos2024();
    else             this.loadCursos2025();
  }

  cursosFiltrados(): HomeCursoCard[] {
    if (!this.localidadSeleccionada) return this.cursosCards;
    return this.cursosCards.filter(c =>
      (c.localidades ?? []).includes(this.localidadSeleccionada)
    );
  }

  openForm(url: string): void { window.open(url, '_blank'); }

  /* ----------------------------- UI helpers ------------------------------ */

  getEstadoTexto(estado: Estado): string {
    return {
      inscripcion_abierta: 'Inscripción abierta',
      en_curso:            'Cursando',
      finalizado:          'Finalizado',
      proximo:             'Disponible próximamente'
    }[estado] ?? '';
  }

  getEstadoClase(estado: Estado): string { return `estado-${estado}`; }

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    el.classList.toggle('scrolled', el.scrollTop > 0);
  }

  resetScroll(evt: MouseEvent): void {
    const desc = (evt.currentTarget as HTMLElement)
                 .querySelector('.curso-descripcion') as HTMLElement;
    if (desc) desc.scrollTop = 0;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --------------------------- Mapping/Sorting --------------------------- */

  private mapCurso2024ToCard(c: Curso): HomeCursoCard {
    const locs = Array.isArray(c.localidades) ? c.localidades : [];
    return {
      id: c.id,
      titulo: c.titulo,
      descripcion: c.descripcion ?? '',
      imagen: c.imagen || undefined,
      estado: c.estado as Estado,
      fecha_inicio: c.fecha_inicio ?? '',
      localidades: locs,
      localidad_principal: locs[0],
      origen: '2024',
      formulario: c.formulario
    };
  }

  private mapCurso2025ToCard(c: Curso2025): HomeCursoCard {
    const locs = Array.isArray(c.localidades) ? c.localidades : [];
    return {
      id: c.id,
      titulo: c.titulo,
      descripcion: c.descripcion_breve ?? '',
      imagen: c.imagen || undefined,
      estado: c.estado as Estado,
      fecha_inicio: c.fecha_inicio ?? '',
      localidades: locs,
      localidad_principal: locs[0],
      origen: '2025',
      formulario: c.formulario
    };
  }

  private applyCards(cards: HomeCursoCard[]): void {
    const todas = cards.flatMap(c => c.localidades ?? []);
    this.localidadesUnicas = [...new Set(todas)].sort();

    this.cursosCards = cards.sort((a, b) => {
      const eo = this.getEstadoOrden(a.estado) - this.getEstadoOrden(b.estado);
      if (eo !== 0) return eo;
      const da = this.safeDate(a.fecha_inicio);
      const db = this.safeDate(b.fecha_inicio);
      return da - db;
    });
  }

  private getEstadoOrden(estado: Estado): number {
    switch (estado) {
      case 'inscripcion_abierta': return 0;
      case 'proximo':             return 1;
      case 'en_curso':            return 2;
      case 'finalizado':          return 3;
      default:                    return 99;
    }
  }

  private safeDate(iso: string | undefined | null): number {
    if (!iso) return Number.POSITIVE_INFINITY;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }

  trackById(index: number, item: { id: number; origen?: '2024' | '2025' }): string | number {
    return item?.origen ? `${item.origen}-${item.id}` : item.id;
  }
}
