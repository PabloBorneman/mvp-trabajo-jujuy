import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CursoService } from '../../services/curso';
import { Curso2025 } from '../../models/curso-2025.model';

type SlidePI = { tipo: 'pi'; imagen: string };
type SlideCurso = {
  tipo: 'curso';
  id: number;
  titulo: string;
  descripcion: string;
  imagen?: string;
  estado: 'inscripcion_abierta' | 'proximo' | 'en_curso' | 'finalizado';
  fecha_inicio: string;
};

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.css']
})
export class Slider implements OnInit, OnDestroy {
  cursosProximos: Array<SlidePI | SlideCurso> = [];
  currentIndex = 0;
  autoSlideInterval: any;

  // UI responsive
  isMobile = false;
  private onResize = () => this.checkScreenSize();

  private portalImgs = [
    'assets/img/portal/portal_1.webp'
  ];

  constructor(private cursoService: CursoService) {}

  ngOnInit(): void {
    // detectar tamaño al iniciar + escuchar cambios
    this.checkScreenSize();
    window.addEventListener('resize', this.onResize);

    this.cursoService.getCursos2025().subscribe({
      next: (cursos: Curso2025[]) => {
        const proximosOrdenados = cursos
          .filter(c => c.estado === 'proximo')
          .sort((a, b) => this.safeDate(a.fecha_inicio) - this.safeDate(b.fecha_inicio));

        const slides: Array<SlidePI | SlideCurso> = [];

        if (proximosOrdenados.length === 0) {
          // Si no hay cursos “próximos”, mostrar solo las del portal
          this.portalImgs.forEach(img => slides.push({ tipo: 'pi', imagen: img }));
        } else {
          // Intercalar asegurando mostrar todas las imágenes del portal aunque haya 1 curso
          const maxLen = Math.max(proximosOrdenados.length, this.portalImgs.length);
          for (let i = 0; i < maxLen; i++) {
            // Curso (cíclico)
            const c = proximosOrdenados[i % proximosOrdenados.length];
            slides.push({
              tipo: 'curso',
              id: c.id,
              titulo: c.titulo,
              descripcion: c.descripcion_breve ?? '',
              imagen: c.imagen,
              estado: c.estado,
              fecha_inicio: c.fecha_inicio ?? ''
            });

            // Portal (cíclico)
            slides.push({
              tipo: 'pi',
              imagen: this.portalImgs[i % this.portalImgs.length]
            });
          }
        }

        this.cursosProximos = slides;
        if (this.cursosProximos.length) this.startAutoSlide();
      },
      error: err => {
        console.error('Error cargando cursos 2025:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    window.removeEventListener('resize', this.onResize);
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => this.next(), 5000);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  next(): void {
    if (this.cursosProximos.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.cursosProximos.length;
    }
  }

  prev(): void {
    if (this.cursosProximos.length > 0) {
      this.currentIndex =
        (this.currentIndex - 1 + this.cursosProximos.length) % this.cursosProximos.length;
    }
  }

  getSlideClass(index: number): string {
    return index === this.currentIndex ? 'slide active' : 'slide';
  }

  private checkScreenSize(): void {
    // <1024px = menor a escritorio
    this.isMobile = window.innerWidth < 1024;
  }

  private safeDate(iso: string | undefined | null): number {
    if (!iso) return Number.POSITIVE_INFINITY;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }
}
