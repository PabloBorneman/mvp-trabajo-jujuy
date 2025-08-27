export interface Curso2025 {
  id: number;
  titulo: string;                               // obligatorio
  descripcion_breve: string;                    // 1–2 líneas (tarjeta)
  descripcion_completa: string;                 // descripción larga
  actividades: string;                          // "¿Qué se va a hacer?"
  duracion_total: string;                       // ej: "2 meses"
  fecha_inicio: string;                         // formato ISO YYYY-MM-DD
  fecha_fin?: string;                           // opcional
  frecuencia_semanal: 1 | 2 | 3 | 'otro';       // cantidad de clases por semana
  duracion_clase_horas: number[];               // ej: [2] o [3, 4]
  dias_horarios?: string[];                     // opcional, ej: ["Lunes 14–16"]
  localidades: string[];                        // solo el nombre
  direcciones?: string[];                       // direcciones completas
  requisitos: {
    mayor_18?: boolean;
    carnet_conducir?: boolean;
    primaria_completa?: boolean;
    secundaria_completa?: boolean;
    otros?: string[];                           // texto libre
  };
  materiales: {
    aporta_estudiante: string[];
    entrega_curso: string[];
  };
  formulario: string;                           // link de inscripción
  imagen?: string;                              // ruta/URL opcional
  estado: 'inscripcion_abierta' | 'proximo' | 'en_curso' | 'finalizado';
}
