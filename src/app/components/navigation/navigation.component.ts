import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  template: `
    <nav class="glass-nav sticky top-0 z-50">
      <div class="nav-content">
        <a routerLink="/todos" class="nav-brand">RL Frontend</a>
        <ul class="nav-links" *ngIf="isAuthenticated">
          <li><a routerLink="/todos" [class.active]="activeRoute === '/todos'">Todos</a></li>
          <li><a routerLink="/dogs" [class.active]="activeRoute === '/dogs'">Dogs</a></li>
          <li><a routerLink="/account" [class.active]="activeRoute === '/account'">Profile</a></li>
        </ul>
        <div class="nav-user" *ngIf="isAuthenticated">
          <span class="username">{{ currentUser?.username }}</span>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavigationComponent implements OnInit, OnDestroy {
  activeRoute: string = '';
  isAuthenticated = false;
  currentUser: User | null = null;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.url;
      });
  }

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user && this.authService.isAuthenticated();
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  logout() {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response.message);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still navigate to login even if API call fails
        this.router.navigate(['/login']);
      }
    });
  }
}
