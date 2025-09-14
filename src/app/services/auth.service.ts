import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  userId: number;
  username: string;
  email: string;
  emailVerified: boolean | null;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  emailVerified: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:8081/api/auth';
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // OAuth2 Methods
  getOAuth2AuthorizationUrl(provider: string): Observable<any> {
    return this.http.get<any>(`${this.API_BASE_URL}/oauth2/authorize/${provider}`);
  }

  handleOAuth2Callback(code: string, state: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.API_BASE_URL}/oauth2/callback?code=${code}&state=${state}`);
  }

  handleDirectTokenResponse(tokenData: any): void {
    // Decode JWT token to get user information
    const tokenPayload = this.decodeJWT(tokenData.accessToken);
    
    if (tokenPayload) {
      const userData = {
        userId: tokenPayload.userId || tokenData.userId,
        username: tokenPayload.username || tokenPayload.sub,
        email: tokenPayload.email,
        emailVerified: tokenPayload.emailVerified || true
      };

      // Store tokens and user data
      localStorage.setItem(this.TOKEN_KEY, tokenData.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken || '');
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      
      // Update current user subject
      this.currentUserSubject.next(userData);
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/login`, credentials, { headers })
      .pipe(
        tap(response => {
          this.saveAuthData(response);
          this.currentUserSubject.next({
            userId: response.userId,
            username: response.username,
            email: response.email,
            emailVerified: response.emailVerified
          });
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/register`, userData, { headers })
      .pipe(
        tap(response => {
          this.saveAuthData(response);
          this.currentUserSubject.next({
            userId: response.userId,
            username: response.username,
            email: response.email,
            emailVerified: response.emailVerified
          });
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      userId: response.userId,
      username: response.username,
      email: response.email,
      emailVerified: response.emailVerified
    }));
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData && this.isAuthenticated()) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }
}
