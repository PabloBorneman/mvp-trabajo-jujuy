/* =========================================================
 * chat-float.ts – componente flotante del chatbot Camila
 * ========================================================= */

import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuid } from 'uuid';               // npm i uuid

@Component({
  selector: 'app-chat-float',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-float.html',
  styleUrls: ['./chat-float.css']
})
export class ChatFloatComponent {
  /* ---------- estado de UI ---------- */
  chatVisible = false;
  userMessage = '';
  mostrarModal = true;

  /* ---------- estado de conversación ---------- */
  private readonly sessionId: string;

  /* cada mensaje tendrá texto crudo y html seguro */
  messages: { from: 'user' | 'bot'; text: string; html?: SafeHtml }[] = [];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    /* genera o recupera un ID único por navegador */
    const KEY = 'chat-session-id';
    const stored = localStorage.getItem(KEY);
    this.sessionId = stored ?? uuid();
    if (!stored) localStorage.setItem(KEY, this.sessionId);
  }

  toggleChat() {
    this.chatVisible = !this.chatVisible;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  sendMessage() {
    const message = this.userMessage.trim();
    if (!message) return;

    /* UI: agrega el mensaje del usuario tal cual */
    this.messages.push({ from: 'user', text: message });

    /* HTTP POST al backend */
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-session-id': this.sessionId          /* ← clave de sesión */
    });

    this.http
      .post<{ message: string }>('/api/chat', { message }, { headers })
      .subscribe({
        next: res => {
          /* sanitizamos la respuesta del bot para usarla en innerHTML */
          const html = this.sanitizer.bypassSecurityTrustHtml(res.message);
          this.messages.push({ from: 'bot', text: res.message, html });
        },
        error: () => {
          this.messages.push({
            from: 'bot',
            text: 'Hubo un error al conectar con el asistente.'
          });
        }
      });

    this.userMessage = '';
  }

  /* helper por si se necesita en la plantilla */
  sanitize(raw: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }
}
