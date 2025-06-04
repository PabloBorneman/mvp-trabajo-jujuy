import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatFloatComponent } from './components/chat-float/chat-float/chat-float';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, ChatFloatComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'mvp-trabajo-jujuy';
}
