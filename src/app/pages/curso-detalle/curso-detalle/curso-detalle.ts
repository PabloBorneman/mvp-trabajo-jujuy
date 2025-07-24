import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CursoService } from '../../../services/curso';
import { Curso } from '../../../models/curso.model';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css'
})
export class CursoDetalle implements OnInit {
  curso?: Curso;
  defaultImg = 'assets/img/default-curso.png';

  constructor(
    private route: ActivatedRoute,
    private cursoService: CursoService,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoService.getCurso(id).subscribe(c => (this.curso = c));
  }

  openForm(url: string): void {
    window.open(url, '_blank');
  }

  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = this.defaultImg;
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
}
