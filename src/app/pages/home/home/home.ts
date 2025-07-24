/* ───────────────────────────── home.component.ts ───────────────────────────── */

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink }   from '@angular/router';

import { CursoService } from '../../../services/curso';
import { Curso }        from '../../../models/curso.model';

@Component({
  selector:    'app-home',
  standalone:  true,
  templateUrl: './home.html',
  styleUrls:   ['./home.css'],
  imports:     [CommonModule, FormsModule, RouterLink]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  /* ─────────────────── Modal bienvenida ─────────────────── */
  private static introShown = false;
  showIntroModal = false;

  closeIntroModal(): void {
    this.showIntroModal = false;
    document.body.style.overflow = '';

    /* abre chatbot */
    setTimeout(() => {
      const chatBtn = document.querySelector('.chat-toggle-button') as HTMLElement;
      if (chatBtn) chatBtn.click();
    }, 200);

    /* recálculo inicial tras reaparecer scrollbar */
    setTimeout(() => this.updateScrollBtnPos(), 0);
  }

  /* ─────────────────── Cursos ─────────────────── */
  cursos: Curso[] = [];
  localidadSeleccionada = '';
  localidadesUnicas: string[] = [];

  constructor(private cursoService: CursoService) {
    if (!HomeComponent.introShown) {
      this.showIntroModal = true;
      HomeComponent.introShown  = true;
      document.body.style.overflow = 'hidden';
    }
  }

  /* ================= Ciclo de vida ================= */

  ngOnInit(): void {
    this.cursoService.getCursos().subscribe(cursos => {
      this.cursos = cursos;
      const todas = cursos.flatMap(c => c.localidades);
      this.localidadesUnicas = [...new Set(todas)].sort();
    });
  }

  /* ──── ResizeObserver para cambios de tamaño del grid ──── */
  private resizeObs!: ResizeObserver;

  ngAfterViewInit(): void {
    this.updateScrollBtnPos();               // cálculo #1
    setTimeout(() => this.updateScrollBtnPos(), 0);  // cálculo #2 tras primer paint

    const container = document.querySelector('.container') as HTMLElement;
    if (container && 'ResizeObserver' in window) {
      this.resizeObs = new ResizeObserver(() => this.updateScrollBtnPos());
      this.resizeObs.observe(container);
    }

    window.addEventListener('load', () => this.updateScrollBtnPos());
  }

  ngOnDestroy(): void {
    if (this.resizeObs) this.resizeObs.disconnect();
  }

  /* se recalcula en cualquier resize de ventana */
  @HostListener('window:resize')
  onResize(): void { this.updateScrollBtnPos(); }

  /* muestra/oculta y re-centra al hacer scroll */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 300);

    /* ▸ re-posiciona por si apareció el scrollbar */
    this.updateScrollBtnPos();
  }

  /* ================= Filtro ================= */

  cursosFiltrados(): Curso[] {
    return this.localidadSeleccionada
      ? this.cursos.filter(c => c.localidades.includes(this.localidadSeleccionada))
      : this.cursos;
  }

  openForm(url: string): void { window.open(url, '_blank'); }

  getEstadoTexto(estado: string): string {
    return {
      inscripcion_abierta: 'Inscripción abierta',
      en_curso:            'Cursando',
      finalizado:          'Finalizado',
      proximo:             'Disponible próximamente'
    }[estado] ?? '';
  }
  getEstadoClase(estado: string): string { return `estado-${estado}`; }

  /* ================= Scroll interno de cards ================= */
  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    el.classList.toggle('scrolled', el.scrollTop > 0);
  }
  resetScroll(evt: MouseEvent): void {
    const desc = (evt.currentTarget as HTMLElement)
                 .querySelector('.curso-descripcion') as HTMLElement;
    if (desc) desc.scrollTop = 0;
  }
  defaultImg = 'assets/img/default-curso.png';
  onImgError(ev: Event): void { (ev.target as HTMLImageElement).src = this.defaultImg; }

  /* ================= Botón “Ir arriba” ================= */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Centra el botón entre borde y grid */
  private updateScrollBtnPos = (): void => {
    const btn       = document.getElementById('scrollTopBtn');
    const container = document.querySelector('.container') as HTMLElement;
    if (!btn || !container) return;

    const gapLeft = container.getBoundingClientRect().left;        // espacio libre izq.
    const offset  = Math.max((gapLeft - btn.offsetWidth) / 2, 20);  // ≥ 20 px
    btn.style.left  = `${offset}px`;
    btn.style.right = 'auto';
  };
}
