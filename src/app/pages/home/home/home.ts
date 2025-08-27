/* ───────────────────────────── home.component.ts ───────────────────────────── */

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
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

  eagerCount = 6;

  // Observers
  private resizeObs!: ResizeObserver;
  private domObs?: MutationObserver;

  constructor(private cursoService: CursoService) {
    if (!HomeComponent.introShown) {
      this.showIntroModal = true;
      HomeComponent.introShown  = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closeIntroModal(): void {
    this.showIntroModal = false;
    document.body.style.overflow = '';
    setTimeout(() => {
      const chatBtn = document.querySelector('.chat-toggle-button') as HTMLElement;
      if (chatBtn) chatBtn.click();
    }, 200);
    requestAnimationFrame(() => this.throttledUpdateScrollBtnPos());
  }

  // ───────────────────────── helpers/throttle/settle ─────────────────────────

  private throttle<T extends (...args: any[]) => void>(fn: T, wait = 120) {
    let last = 0;
    let timer: any = null;
    let lastArgs: any[] | null = null;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgs = args;

      if (now - last >= wait) {
        last = now;
        fn(...(lastArgs as any[]));
        lastArgs = null;
      } else if (!timer) {
        const remaining = wait - (now - last);
        timer = setTimeout(() => {
          last = Date.now();
          fn(...(lastArgs as any[]));
          lastArgs = null;
          timer = null;
        }, Math.max(16, remaining));
      }
    };
  }

  private afterSettled(cb: () => void) {
    // 2 frames → da tiempo a fonts/imagenes/estilos diferidos
    requestAnimationFrame(() => requestAnimationFrame(cb));
  }

  // ───────────────────────── posicionamiento del botón ───────────────────────

  private updateScrollBtnPos = (): void => {
    const btn       = document.getElementById('scrollTopBtn') as HTMLElement | null;
    const container = document.querySelector('.container') as HTMLElement | null;
    if (!btn || !container) return;

    const rect  = container.getBoundingClientRect();
    const btnW  = btn.offsetWidth || 48;
    const minPad = 16;

    // gutter = margen entre viewport y container (izquierda)
    const gutterLeft = Math.max(rect.left, 0);

    // Ideal: centrar el botón en la canaleta entre borde de pantalla y container
    const idealLeft = Math.max((gutterLeft - btnW) / 2, minPad);

    // Si no hay canaleta real (container full‑width), anclamos a la derecha.
    if (gutterLeft > btnW + minPad) {
      btn.style.left  = `${idealLeft}px`;
      btn.style.right = 'auto';
    } else {
      btn.style.left  = 'auto';
      btn.style.right = `${minPad}px`;
    }
  };

  private throttledUpdateScrollBtnPos = this.throttle(this.updateScrollBtnPos.bind(this), 120);

  // ───────────────────────── lifecycle ───────────────────────────────────────

  ngOnInit(): void {
    this.setYear('2025');
  }

  private boundOnScroll = () => {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 300);
    this.throttledUpdateScrollBtnPos();
  };

  private boundOnResize = () => {
    this.throttledUpdateScrollBtnPos();
  };

  ngAfterViewInit(): void {
    // esperar a que asiente el layout inicial
    this.afterSettled(() => this.throttledUpdateScrollBtnPos());

    const container = document.querySelector('.container') as HTMLElement | null;

    // ResizeObserver sobre el container
    if (container && 'ResizeObserver' in window) {
      this.resizeObs = new ResizeObserver(() => this.throttledUpdateScrollBtnPos());
      this.resizeObs.observe(container);
    }

    // MutationObserver para cambios de DOM (cards que entran/salen)
    this.domObs = new MutationObserver(() =>
      this.afterSettled(() => this.throttledUpdateScrollBtnPos())
    );
    this.domObs.observe(container ?? document.body, { childList: true, subtree: true });

    // Reposicionar cuando cargan imágenes (evita flicker por reflow)
    const scope = container ?? document;
    const imgs = scope.querySelectorAll('img');
    imgs.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', () => this.throttledUpdateScrollBtnPos(), { once: true });
      }
    });

    window.addEventListener('scroll', this.boundOnScroll, { passive: true });
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('load', () => this.throttledUpdateScrollBtnPos(), { once: true });
  }

  ngOnDestroy(): void {
    if (this.resizeObs) this.resizeObs.disconnect();
    if (this.domObs) this.domObs.disconnect();
    window.removeEventListener('scroll', this.boundOnScroll);
    window.removeEventListener('resize', this.boundOnResize);
  }

  // ───────────────────────── data load ───────────────────────────────────────

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
    if (y === '2024') {
      this.loadCursos2024();
    } else {
      this.loadCursos2025();
    }
  }

  cursosFiltrados(): HomeCursoCard[] {
    if (!this.localidadSeleccionada) return this.cursosCards;
    return this.cursosCards.filter(c =>
      (c.localidades ?? []).includes(this.localidadSeleccionada)
    );
  }

  openForm(url: string): void { window.open(url, '_blank'); }

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

  // ───────────────────────── mapping/sorting ─────────────────────────────────

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

    // reposicionar tras pintar y con micro‑retry para imágenes que entren 1 tick después
    requestAnimationFrame(() => {
      this.throttledUpdateScrollBtnPos();
      setTimeout(() => this.throttledUpdateScrollBtnPos(), 120);
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
