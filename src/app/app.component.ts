import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <app-navigation *ngIf="showNavigation"></app-navigation>
      <main class="main-content" [class.full-height]="!showNavigation">
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
    }

    .main-content {
      padding-top: 2rem;
    }

    .main-content.full-height {
      padding-top: 0;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'RL Frontend';
  showNavigation = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Show navigation only on authenticated routes
    this.subscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.showNavigation = this.authService.isAuthenticated() && event.url !== '/login';
        })
    );

    // Also listen to auth state changes
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        const isLoginPage = this.router.url === '/login';
        this.showNavigation = !!user && this.authService.isAuthenticated() && !isLoginPage;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
