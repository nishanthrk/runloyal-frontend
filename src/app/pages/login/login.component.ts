import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, LoginRequest, RegisterRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <!-- Left Side - Login Form -->
      <div class="login-form-section">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-2 mb-6">
              <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">RL</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-800">RL Frontend</h1>
            </div>
            <h2 class="text-2xl font-semibold text-gray-800 mb-2">Login to your account</h2>
            <p class="text-gray-600">Enter your credentials below to access your account</p>
          </div>

          <!-- Toggle between Login and Register -->
          <div class="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button 
              class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300"
              [class]="isLoginMode ? 'bg-white text-gray-800 shadow-lg' : 'text-gray-600 hover:text-gray-800'"
              (click)="setLoginMode(true)">
              Sign In
            </button>
            <button 
              class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300"
              [class]="!isLoginMode ? 'bg-white text-gray-800 shadow-lg' : 'text-gray-600 hover:text-gray-800'"
              (click)="setLoginMode(false)">
              Sign Up
            </button>
          </div>

          <!-- Login Form -->
          <form *ngIf="isLoginMode" [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-6">
            <div class="space-y-2">
              <label for="identifier" class="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                id="identifier"
                formControlName="identifier"
                placeholder="m@example.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                [class.border-red-400]="loginForm.get('identifier')?.invalid && loginForm.get('identifier')?.touched">
              <div *ngIf="loginForm.get('identifier')?.invalid && loginForm.get('identifier')?.touched" class="text-sm text-red-600">
                Email is required
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" class="text-sm text-green-600 hover:text-green-500">Forgot your password?</a>
              </div>
              <input 
                type="password" 
                id="password"
                formControlName="password"
                placeholder="Enter your password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                [class.border-red-400]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="text-sm text-red-600">
                Password is required
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full bg-black text-white py-2 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">Login</span>
              <span *ngIf="loading" class="flex items-center justify-center gap-2">
                <div class="spinner w-4 h-4"></div>
                Signing In...
              </span>
            </button>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

                    <button
                      type="button"
                      (click)="handleGoogleLogin()"
                      [disabled]="loading"
                      class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span *ngIf="!loading">Login with Google</span>
                      <span *ngIf="loading" class="flex items-center gap-2">
                        <div class="spinner w-4 h-4"></div>
                        Connecting...
                      </span>
                    </button>
          </form>

          <!-- Register Form -->
          <form *ngIf="!isLoginMode" [formGroup]="registerForm" (ngSubmit)="onRegister()" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="form-label">First Name</label>
                <input 
                  type="text" 
                  id="firstName"
                  formControlName="firstName"
                  placeholder="First name"
                  class="form-input"
                  [class.border-red-400]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                <div *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched" class="form-error">
                  First name is required
                </div>
              </div>

              <div>
                <label for="lastName" class="form-label">Last Name</label>
                <input 
                  type="text" 
                  id="lastName"
                  formControlName="lastName"
                  placeholder="Last name"
                  class="form-input"
                  [class.border-red-400]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                <div *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched" class="form-error">
                  Last name is required
                </div>
              </div>
            </div>

            <div>
              <label for="username" class="form-label">Username</label>
              <input 
                type="text" 
                id="username"
                formControlName="username"
                placeholder="Choose a username"
                class="form-input"
                [class.border-red-400]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
              <div *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched" class="form-error">
                Username is required
              </div>
            </div>

            <div>
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email"
                formControlName="email"
                placeholder="Enter your email"
                class="form-input"
                [class.border-red-400]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="form-error">
                <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <div>
              <label for="registerPassword" class="form-label">Password</label>
              <input 
                type="password" 
                id="registerPassword"
                formControlName="password"
                placeholder="Create a password"
                class="form-input"
                [class.border-red-400]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              <div *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="form-error">
                <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <button 
              type="submit" 
              class="glass-button-green w-full py-3"
              [disabled]="registerForm.invalid || loading">
              <span *ngIf="!loading">Create Account</span>
              <span *ngIf="loading" class="flex items-center justify-center gap-2">
                <div class="spinner w-4 h-4"></div>
                Creating Account...
              </span>
            </button>
          </form>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="mt-6 p-4 bg-red-100/80 backdrop-blur-sm border border-red-200/60 rounded-xl flex items-center gap-3">
            <div class="text-red-600 text-xl">⚠️</div>
            <p class="text-red-700">{{ errorMessage }}</p>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="mt-6 p-4 bg-green-100/80 backdrop-blur-sm border border-green-200/60 rounded-xl flex items-center gap-3">
            <div class="text-green-600 text-xl">✅</div>
            <p class="text-green-700">{{ successMessage }}</p>
          </div>

          <!-- Sign up link -->
          <div class="text-center mt-6">
            <p class="text-sm text-gray-600">
              Don't have an account? 
              <button 
                type="button" 
                class="text-green-600 hover:text-green-500 font-medium"
                (click)="setLoginMode(false)">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      <!-- Right Side - Image Background -->
      <div class="login-image-section" 
           [style.background-image]="'url(' + dogImageUrl + ')'"
           style="background-color: #f3f4f6;">
        <div class="absolute inset-0 bg-black/10"></div>
        
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      min-height: 100vh;
    }
    
    .login-form-section {
      width: 50%;
      flex: 0 0 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-color: white;
    }
    
    .login-image-section {
      width: 50%;
      flex: 0 0 50%;
      position: relative;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-attachment: local;
      min-height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .login-container {
        flex-direction: column;
      }
      
      .login-form-section {
        width: 100%;
        flex: 1;
        min-height: 100vh;
      }
      
      .login-image-section {
        display: none;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  isLoginMode = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  dogImageUrl: string = 'https://plus.unsplash.com/premium_photo-1668606763482-8dd2042c934e?q=90&w=864'; // Unsplash image

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/todos']);
    }
  }

  setLoginMode(isLogin: boolean) {
    this.isLoginMode = isLogin;
    this.clearMessages();
    this.resetForms();
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.clearMessages();

      const credentials: LoginRequest = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = `Welcome back, ${response.username}!`;
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.getErrorMessage(error);
        }
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.clearMessages();

      const userData: RegisterRequest = this.registerForm.value;
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = `Account created successfully! Welcome, ${response.username}!`;
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.getErrorMessage(error);
        }
      });
    }
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForms() {
    this.loginForm.reset();
    this.registerForm.reset();
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 401) {
      return 'Invalid credentials. Please check your username/email and password.';
    }
    if (error.status === 409) {
      return 'Username or email already exists. Please try different credentials.';
    }
    if (error.status === 0) {
      return 'Unable to connect to server. Please check your connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  handleGoogleLogin(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Get OAuth2 authorization URL from backend using AuthService
    this.authService.getOAuth2AuthorizationUrl('google').subscribe({
      next: (response) => {
        // Store state for verification
        localStorage.setItem('oauth2_state', response.state);
        
        // Redirect to Google OAuth2 authorization
        window.location.href = response.authorizationUrl;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to initiate Google login. Please try again.';
        console.error('Google OAuth2 error:', err);
      }
    });
  }
}
