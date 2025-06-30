import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';          // 👈 necesario para ngModel
import { RouterLink } from '@angular/router';
import { CursoService } from '../../../services/curso';
import { Curso } from '../../../models/curso.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  /* ───────────────────────────────────────── Modal bienvenida ───────────────────────────────────────── */
  private static introShown = false;
  showIntroModal = false;

  closeIntroModal(): void {
    this.showIntroModal = false;
    document.body.style.overflow = '';
  }
  /* ──────────────────────────────────────────────────────────────────────────────────────────────────── */

  cursos: Curso[] = [];

  // 🔽 propiedades para el filtro
  localidadSeleccionada: string = '';
  localidadesUnicas: string[] = [];

  constructor(private cursoService: CursoService) {
    if (!HomeComponent.introShown) {
      this.showIntroModal = true;
      HomeComponent.introShown = true;
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnInit(): void {
    this.cursoService.getCursos().subscribe((cursos) => {
      this.cursos = cursos;
      const todas = cursos.flatMap(c => c.localidades);
      this.localidadesUnicas = [...new Set(todas)].sort();
    });

    // ⬇️ Mostrar/ocultar botón al hacer scroll
    window.addEventListener('scroll', this.toggleScrollButton);
  }

  cursosFiltrados(): Curso[] {
    if (!this.localidadSeleccionada) return this.cursos;
    return this.cursos.filter(c =>
      c.localidades.includes(this.localidadSeleccionada)
    );
  }

  openForm(url: string): void {
    window.open(url, '_blank');
  }

  getEstadoTexto(estado: string): string {
    return {
      inscripcion_abierta: 'Inscripción abierta',
      en_curso: 'Cursando',
      finalizado: 'Finalizado',
      proximo: 'Disponible próximamente'
    }[estado] || '';
  }

  getEstadoClase(estado: string): string {
    return `estado-${estado}`;
  }

  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    el.classList.toggle('scrolled', el.scrollTop > 0);
  }

  resetScroll(evt: MouseEvent){
    const card = evt.currentTarget as HTMLElement;
    const desc = card.querySelector('.curso-descripcion') as HTMLElement;
    if (desc) desc.scrollTop = 0;
  }

  defaultImg = 'assets/img/default-curso.png';

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.defaultImg;
  }

  /* ───────────── Funcionalidad scroll hacia arriba ───────────── */
  scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

toggleScrollButton(): void {
  const btn = document.getElementById('scrollTopBtn');
  if (btn) {
    // true  → agrega la clase  |  false → la quita
    btn.classList.toggle('visible', window.scrollY > 300);
  }
}

}
