/* ───────────────────────── curso-detalle.component.ts (completo, con recarga por params) ───────────────────────── */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CursoService } from '../../../services/curso';
import { Curso }        from '../../../models/curso.model';
import { Curso2025 }    from '../../../models/curso-2025.model';
import { Subscription } from 'rxjs';

type Estado = 'inscripcion_abierta' | 'proximo' | 'en_curso' | 'finalizado';

/** ViewModel unificado para 2024 y 2025 (incluye extras 2025) */
interface DetalleVM {
  id: number;
  origen: '2024' | '2025';
  titulo: string;

  // Descripciones
  descripcion: string;            // mostrado en el HTML (para 2025 usa descripcion_completa)
  descripcion_corta?: string;     // 2025: descripcion_breve
  descripcion_larga?: string;     // 2025: descripcion_completa

  // Estado/fechas
  estado: Estado;
  fecha_inicio?: string;          // ISO
  fecha_fin?: string;             // ISO opcional (2025)

  // Sedes
  localidades: string[];
  direcciones?: string[];         // 2025: direcciones alineadas con localidades

  // Requisitos (2024 texto plano / 2025 flags + otros)
  requisitos?: string;            // 2024
  req_mayor_18?: boolean;         // 2025
  req_carnet_conducir?: boolean;  // 2025
  req_primaria_completa?: boolean;// 2025
  req_secundaria_completa?: boolean; // 2025
  req_otros?: string[];           // 2025

  // Info académica 2025
  actividades?: string;           // “¿Qué se va a hacer?”
  duracion_total?: string;        // ej: "2 meses"
  frecuencia_semanal?: 1 | 2 | 3 | 'otro';
  duracion_clase_horas?: number[]; // ej: [2] o [3,4]
  dias_horarios?: string[];        // ej: ["Lunes 14–16"]

  // Materiales 2025
  materiales_aporta_estudiante?: string[];
  materiales_entrega_curso?: string[];

  // Inscripción
  formulario: string;
}

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css'   // lo dejo tal cual lo tenías
})
export class CursoDetalle implements OnInit, OnDestroy {
  curso?: DetalleVM;
  defaultImg = 'assets/img/default-curso.png'; // (no se usa en HTML actual, igual lo mantengo por compat)

  private subs = new Subscription();
  private lastKey = ''; // evita recargas duplicadas en la misma URL

  constructor(
    private route: ActivatedRoute,
    private cursoService: CursoService,
    private viewportScroller: ViewportScroller
  ) {}

  ngOnInit(): void {
    // carga inicial
    this.loadFromRoute();

    // 🔁 al cambiar :id o los query params (?y), vuelve a cargar SIN recargar la app
    this.subs.add(this.route.params.subscribe(() => this.loadFromRoute()));
    this.subs.add(this.route.queryParams.subscribe(() => this.loadFromRoute()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Lee la URL actual (snapshot) y carga el curso correspondiente */
  private loadFromRoute(): void {
    this.viewportScroller.scrollToPosition([0, 0]);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const yearFromParam = this.route.snapshot.paramMap.get('year') as ('2024' | '2025' | null);
    const yearFromQuery = this.route.snapshot.queryParamMap.get('y') as ('2024' | '2025' | null);
    const key = `${id}|${yearFromParam ?? yearFromQuery ?? 'auto'}`;

    // si no cambió nada, no recargamos
    if (!id || key === this.lastKey) return;
    this.lastKey = key;

    // 1) Año explícito en path
    if (yearFromParam === '2024' || yearFromParam === '2025') {
      this.loadByYear(id, yearFromParam);
      return;
    }
    // 2) Año en query
    if (yearFromQuery === '2024' || yearFromQuery === '2025') {
      this.loadByYear(id, yearFromQuery);
      return;
    }
    // 3) Retrocompatible: intento 2025 y si no está, caigo a 2024
    this.try2025Then2024(id);
  }

  /* =========================== Carga por año =========================== */

  private loadByYear(id: number, year: '2024' | '2025'): void {
    if (year === '2024') this.load2024ById(id);
    else this.load2025ById(id);
  }

  private load2024ById(id: number): void {
    this.cursoService.getCursos().subscribe({
      next: (lista: Curso[]) => {
        const found = (lista || []).find(c => c.id === id);
        if (found) this.curso = this.map2024ToVM(found);
        else this.curso = undefined;
      },
      error: (err) => {
        console.error('Error cargando detalle 2024:', err);
        this.curso = undefined;
      }
    });
  }

  private load2025ById(id: number): void {
    const svc: any = this.cursoService as any;

    const handle = (lista: Curso2025[] | undefined | null) => {
      const found = (lista || []).find(c => c.id === id);
      this.curso = found ? this.map2025ToVM(found) : undefined;
    };

    if (typeof svc.getCursos2025 === 'function') {
      svc.getCursos2025().subscribe({
        next: (lista: Curso2025[]) => handle(lista),
        error: (err: any) => {
          console.error('Error cargando detalle 2025 (servicio):', err);
          this.curso = undefined;
        }
      });
    } else {
      fetch('assets/cursos_2025.json')
        .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
        .then((data: Curso2025[]) => handle(data))
        .catch(err => {
          console.error('Error cargando detalle 2025 (assets):', err);
          this.curso = undefined;
        });
    }
  }

  private async try2025Then2024(id: number): Promise<void> {
    const curso2025 = await this.find2025(id).catch(() => null);
    if (curso2025) {
      this.curso = this.map2025ToVM(curso2025);
      return;
    }
    this.cursoService.getCursos().subscribe({
      next: (lista: Curso[]) => {
        const found = (lista || []).find(c => c.id === id);
        this.curso = found ? this.map2024ToVM(found) : undefined;
      },
      error: (err) => {
        console.error('Error cargando detalle 2024 (fallback):', err);
        this.curso = undefined;
      }
    });
  }

  private find2025(id: number): Promise<Curso2025 | null> {
    const svc: any = this.cursoService as any;

    if (typeof svc.getCursos2025 === 'function') {
      return new Promise((resolve) => {
        svc.getCursos2025().subscribe({
          next: (lista: Curso2025[]) => resolve((lista || []).find(c => c.id === id) || null),
          error: () => resolve(null)
        });
      });
    }

    return fetch('assets/cursos_2025.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: Curso2025[]) => (data || []).find(c => c.id === id) || null)
      .catch(() => null);
  }

  /* =========================== Mapeos =========================== */

  private map2024ToVM(c: Curso): DetalleVM {
    return {
      id: c.id,
      origen: '2024',
      titulo: c.titulo,

      descripcion: c.descripcion ?? '',
      descripcion_corta: c.descripcion ?? '',
      descripcion_larga: c.descripcion ?? '',

      estado: c.estado as Estado,
      fecha_inicio: c.fecha_inicio ?? '',
      // fecha_fin: N/A 2024

      localidades: Array.isArray(c.localidades) ? c.localidades : [],
      // direcciones: N/A 2024

      requisitos: c.requisitos || '',

      // flags/otros/materiales/días: N/A 2024

      formulario: c.formulario
    };
  }

  private map2025ToVM(c: Curso2025): DetalleVM {
    const descBreve = c.descripcion_breve ?? '';
    const descLarga = c.descripcion_completa ?? descBreve;

    return {
      id: c.id,
      origen: '2025',
      titulo: c.titulo,

      descripcion: descLarga || descBreve || '',
      descripcion_corta: descBreve || '',
      descripcion_larga: descLarga || '',

      estado: c.estado as Estado,
      fecha_inicio: c.fecha_inicio ?? '',
      fecha_fin: c.fecha_fin,

      localidades: Array.isArray(c.localidades) ? c.localidades : [],
      direcciones: Array.isArray(c.direcciones) ? c.direcciones : undefined,

      // 2025: requisitos por flags + otros
      req_mayor_18: !!c.requisitos?.mayor_18,
      req_carnet_conducir: !!c.requisitos?.carnet_conducir,
      req_primaria_completa: !!c.requisitos?.primaria_completa,
      req_secundaria_completa: !!c.requisitos?.secundaria_completa,
      req_otros: Array.isArray(c.requisitos?.otros) ? c.requisitos!.otros : undefined,

      // Info académica
      actividades: c.actividades,
      duracion_total: c.duracion_total,
      frecuencia_semanal: c.frecuencia_semanal,
      duracion_clase_horas: Array.isArray(c.duracion_clase_horas) ? c.duracion_clase_horas : undefined,
      dias_horarios: Array.isArray(c.dias_horarios) ? c.dias_horarios : undefined,

      // Materiales
      materiales_aporta_estudiante: Array.isArray(c.materiales?.aporta_estudiante) ? c.materiales!.aporta_estudiante : undefined,
      materiales_entrega_curso: Array.isArray(c.materiales?.entrega_curso) ? c.materiales!.entrega_curso : undefined,

      formulario: c.formulario
    };
  }

  /* =========================== Utilidades usadas por el HTML =========================== */

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
