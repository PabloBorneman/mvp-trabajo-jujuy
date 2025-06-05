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

  constructor(private http: HttpClient) {}

  toggleChat() {
    this.chatVisible = !this.chatVisible;
  }

  sendMessage() {
    const message = this.userMessage.trim();
    if (!message) return;

    this.messages.push({ from: 'user', text: message });

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post<{ message: string }>('http://localhost:3000/chat', { message }, { headers })
      .subscribe({
        next: res => {
          this.messages.push({ from: 'bot', text: res.message });
        },
        error: () => {
          this.messages.push({ from: 'bot', text: 'Hubo un error al conectar con el asistente.' });
        }
      });

    this.userMessage = '';
  }
  mostrarModal = true;

cerrarModal() {
  this.mostrarModal = false;
}


}
