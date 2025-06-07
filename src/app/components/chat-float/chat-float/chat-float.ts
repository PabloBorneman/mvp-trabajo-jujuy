import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-float',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-float.html',
  styleUrls: ['./chat-float.css']
})
export class ChatFloatComponent {
  chatVisible = false;
  userMessage = '';
  messages: { from: 'user' | 'bot', text: string }[] = [];
  mostrarModal = true;

  constructor(private http: HttpClient) {}

  toggleChat() {
    this.chatVisible = !this.chatVisible;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  sendMessage() {
    const message = this.userMessage.trim();
    if (!message) return;

    /* ---------- UI: agrega el mensaje del usuario ---------- */
    this.messages.push({ from: 'user', text: message });

    /* ---------- HTTP POST al backend ---------- */
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    /*  🔗  Ruta relativa: el mismo dominio sirve /api/chat
        Funciona en local (http://localhost:10000/api/chat)
        y en Render (https://mvp-unificado.onrender.com/api/chat)                 */
    this.http
      .post<{ message: string }>('/api/chat', { message }, { headers })
      .subscribe({
        next: res => {
          this.messages.push({ from: 'bot', text: res.message });
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
}
