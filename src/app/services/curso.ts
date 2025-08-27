import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Curso } from '../models/curso.model';
import { Curso2025 } from '../models/curso-2025.model';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  // JSON 2024 (actual nombre que ya usabas)
  private readonly url2024 = 'assets/cursos_personalizados.json';

  // JSON 2025 (nuevo)
  private readonly url2025 = 'assets/cursos_2025.json';

  constructor(private http: HttpClient) {}

  /* =========================
     2024 (compatibilidad)
     ========================= */

  /** Devuelve todos los cursos 2024 (alias de getCursos para compatibilidad) */
  getCursos2024(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.url2024);
  }

  /** Devuelve un curso 2024 por ID */
  getCurso2024(id: number): Observable<Curso | undefined> {
    return this.getCursos2024().pipe(
      map(cursos => cursos.find(c => c.id === id))
    );
  }

  /** Mantengo estos dos para no romper llamadas existentes en tu app */
  getCursos(): Observable<Curso[]> {
    return this.getCursos2024();
  }

  getCurso(id: number): Observable<Curso | undefined> {
    return this.getCurso2024(id);
  }

  /* =========================
     2025 (nuevo modelo/json)
     ========================= */

  /** Devuelve todos los cursos 2025 */
  getCursos2025(): Observable<Curso2025[]> {
    return this.http.get<Curso2025[]>(this.url2025);
  }

  /** Devuelve un curso 2025 por ID */
  getCurso2025(id: number): Observable<Curso2025 | undefined> {
    return this.getCursos2025().pipe(
      map(cursos => cursos.find(c => c.id === id))
    );
  }

  /* =========================
     (Opcional) API unificada
     =========================
     Si en algún momento querés pedir por año sin duplicar `if/else`
     en componentes, podés usar estos overloads:
  */

  getCursosByYear(year: '2024'): Observable<Curso[]>;
  getCursosByYear(year: '2025'): Observable<Curso2025[]>;
  getCursosByYear(year: '2024' | '2025'): Observable<Curso[] | Curso2025[]> {
    return year === '2024' ? this.getCursos2024() : this.getCursos2025();
  }

  getCursoByYear(year: '2024', id: number): Observable<Curso | undefined>;
  getCursoByYear(year: '2025', id: number): Observable<Curso2025 | undefined>;
  getCursoByYear(
    year: '2024' | '2025',
    id: number
  ): Observable<Curso | Curso2025 | undefined> {
    return year === '2024' ? this.getCurso2024(id) : this.getCurso2025(id);
  }
}
