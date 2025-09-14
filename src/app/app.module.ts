import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { TodoListComponent } from './pages/todo-list/todo-list.component';
import { DogGalleryComponent } from './pages/dog-gallery/dog-gallery.component';
import { AccountFormComponent } from './pages/account-form/account-form.component';
import { LoginComponent } from './pages/login/login.component';
import { OAuth2CallbackComponent } from './pages/oauth2-callback/oauth2-callback.component';
import { AuthGuard } from './guards/auth.guard';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    TodoListComponent,
    DogGalleryComponent,
    AccountFormComponent,
    LoginComponent,
    OAuth2CallbackComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
