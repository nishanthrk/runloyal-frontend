import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  template: `
    <div class="min-h-screen bg-white flex items-center justify-center">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 text-green-600">
            <svg class="animate-spin h-12 w-12" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            {{ status }}
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OAuth2CallbackComponent implements OnInit {
  status = 'Processing OAuth2 Login...';
  message = 'Please wait while we complete your authentication.';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.handleOAuth2Callback();
  }

  private handleOAuth2Callback(): void {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const tokenType = urlParams.get('token_type');
    const expiresIn = urlParams.get('expires_in');
    const userId = urlParams.get('user_id');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Check for OAuth2 errors
    if (error) {
      this.status = 'Authentication Failed';
      this.message = errorDescription || 'An error occurred during OAuth2 authentication.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    // Check for access token (direct token response)
    if (accessToken) {
      this.processDirectTokenResponse({
        accessToken,
        refreshToken,
        tokenType,
        expiresIn: expiresIn ? parseInt(expiresIn) : 900000,
        userId: userId ? parseInt(userId) : null
      });
      return;
    }

    // Fallback to code-based flow
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code) {
      this.status = 'Invalid Response';
      this.message = 'No authorization code or access token received from OAuth2 provider.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    // Verify state parameter for code-based flow
    const storedState = localStorage.getItem('oauth2_state');
    if (!state || !storedState || state !== storedState) {
      this.status = 'Security Error';
      this.message = 'Invalid state parameter. Possible CSRF attack.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    // Process OAuth2 callback with code
    this.processOAuth2Callback(code, state || '');
  }

  private processDirectTokenResponse(tokenData: any): void {
    this.status = 'Completing Authentication...';
    this.message = 'Finalizing your login process.';

    try {
      // Use AuthService to handle direct token response
      this.authService.handleDirectTokenResponse(tokenData);
      
      // Clear OAuth2 state
      localStorage.removeItem('oauth2_state');

      // Get user info for welcome message
      const user = this.authService.getCurrentUser();
      const username = user?.username || 'User';

      this.status = 'Login Successful!';
      this.message = `Welcome, ${username}! Redirecting to your dashboard...`;

      // Redirect to main app
      setTimeout(() => {
        this.router.navigate(['/todos']);
      }, 2000);
    } catch (error) {
      console.error('Token processing error:', error);
      this.status = 'Authentication Failed';
      this.message = 'Failed to process authentication tokens. Please try again.';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  private processOAuth2Callback(code: string, state: string): void {
    this.status = 'Completing Authentication...';
    this.message = 'Finalizing your login process.';

    // Use AuthService to handle OAuth2 callback
    this.authService.handleOAuth2Callback(code, state).subscribe({
      next: (data) => {
        if (data.accessToken) {
          // Store tokens using AuthService
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify({
            userId: data.userId,
            username: data.username,
            email: data.email,
            emailVerified: data.emailVerified
          }));

          // Clear OAuth2 state
          localStorage.removeItem('oauth2_state');

          this.status = 'Login Successful!';
          this.message = `Welcome, ${data.username}! Redirecting to your dashboard...`;

          // Redirect to main app
          setTimeout(() => {
            this.router.navigate(['/todos']);
          }, 2000);
        } else {
          throw new Error('No access token received');
        }
      },
      error: (error) => {
        console.error('OAuth2 callback error:', error);
        this.status = 'Authentication Failed';
        this.message = 'Failed to complete OAuth2 authentication. Please try again.';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      }
    });
  }
}
