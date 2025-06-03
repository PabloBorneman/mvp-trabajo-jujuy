import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Curso } from '../models/curso.model';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  private url = 'assets/cursos_personalizados.json';

  constructor(private http: HttpClient) {}

  /** Devuelve todos los cursos */
  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.url);
  }

  /** Devuelve un curso por ID */
  getCurso(id: number): Observable<Curso | undefined> {
    return this.getCursos().pipe(
      map(cursos => cursos.find(c => c.id === id))
    );
  }
}
