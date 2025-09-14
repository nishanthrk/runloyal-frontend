import { Routes } from '@angular/router';
import { TodoListComponent } from './pages/todo-list/todo-list.component';
import { DogGalleryComponent } from './pages/dog-gallery/dog-gallery.component';
import { AccountFormComponent } from './pages/account-form/account-form.component';
import { LoginComponent } from './pages/login/login.component';
import { OAuth2CallbackComponent } from './pages/oauth2-callback/oauth2-callback.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'oauth2/callback', component: OAuth2CallbackComponent },
  { path: 'todos', component: TodoListComponent, canActivate: [AuthGuard] },
  { path: 'dogs', component: DogGalleryComponent, canActivate: [AuthGuard] },
  { path: 'account', component: AccountFormComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
