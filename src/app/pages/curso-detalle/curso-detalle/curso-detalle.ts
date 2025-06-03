import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CursoService } from '../../../services/curso';
import { Curso } from '../../../models/curso.model';


@Component({
  selector: 'app-curso-detalle',
  imports: [CommonModule, RouterLink],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css'
})
export class CursoDetalle implements OnInit {
  curso?: Curso;

  constructor(
    private route: ActivatedRoute,
    private cursoService: CursoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoService.getCurso(id).subscribe(c => (this.curso = c));
  }

  openForm(url: string): void {
    window.open(url, '_blank');
  }

}
