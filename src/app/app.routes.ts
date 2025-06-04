import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home/home';
import { CursoDetalle } from './pages/curso-detalle/curso-detalle/curso-detalle';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'curso/:id', component: CursoDetalle }
  
];
