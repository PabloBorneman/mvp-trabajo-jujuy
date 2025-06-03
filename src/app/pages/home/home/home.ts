import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';          // 👈 necesario para ngModel
import { RouterLink } from '@angular/router';
import { CursoService } from '../../../services/curso';
import { Curso } from '../../../models/curso.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],    // 👈 agrega FormsModule
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  cursos: Curso[] = [];

  // 🔽 propiedades para el filtro
  localidadSeleccionada: string = '';
  localidadesUnicas: string[] = [];

  constructor(private cursoService: CursoService) {}

  ngOnInit(): void {
    this.cursoService.getCursos().subscribe((cursos) => {
      this.cursos = cursos;

      // obtener lista única de localidades y ordenarla
      const todas = cursos.flatMap(c => c.localidades);
      this.localidadesUnicas = [...new Set(todas)].sort();
    });
  }

  /** Devuelve la lista filtrada según localidad seleccionada */
  cursosFiltrados(): Curso[] {
    if (!this.localidadSeleccionada) return this.cursos;
    return this.cursos.filter(c =>
      c.localidades.includes(this.localidadSeleccionada)
    );
  }

  openForm(url: string): void {
    window.open(url, '_blank');
  }
}
