import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, retry, delay } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Address {
  id?: number;
  userId?: number;
  line1?: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
  address: Address;
}

export interface UpdateProfileRequest {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly API_BASE_URL = 'http://localhost:8082/api/users';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  private lastFetchTime = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public profile$ = this.profileSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get user profile with caching
   */
  getUserProfile(forceRefresh: boolean = false): Observable<UserProfile> {
    const now = Date.now();
    const isCacheValid = !forceRefresh && 
                        (now - this.lastFetchTime) < this.CACHE_DURATION && 
                        this.profileSubject.value;

    if (isCacheValid) {
      return of(this.profileSubject.value!);
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorSubject.next('User not authenticated');
      this.isLoadingSubject.next(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<UserProfile>(`${this.API_BASE_URL}/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(profile => {
        this.profileSubject.next(profile);
        this.lastFetchTime = now;
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Profile fetch error:', error);
        // Return mock data for development/testing
        const mockProfile = this.createMockProfile(userId);
        this.profileSubject.next(mockProfile);
        this.lastFetchTime = now;
        this.isLoadingSubject.next(false);
        return of(mockProfile);
      })
    );
  }

  private createMockProfile(userId: number): UserProfile {
    const currentUser = this.authService.getCurrentUser();
    return {
      id: userId,
      username: currentUser?.username || 'user',
      email: currentUser?.email || 'user@example.com',
      firstName: 'Nishanth',
      lastName: 'Ravi',
      phoneNumber: '9989989',
      dateOfBirth: '1991-06-24',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      address: {
        id: 1,
        userId: userId,
        line1: '26 A/6',
        line2: null,
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '63101',
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Update user profile with optimistic updates
   */
  updateProfile(updateData: UpdateProfileRequest): Observable<UserProfile> {
    const currentProfile = this.profileSubject.value;
    if (!currentProfile) {
      return throwError(() => new Error('No profile data available'));
    }

    // Optimistic update
    const optimisticProfile: UserProfile = {
      ...currentProfile,
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      phoneNumber: updateData.phoneNumber,
      dateOfBirth: updateData.dateOfBirth,
      updatedAt: new Date().toISOString(),
      address: {
        ...currentProfile.address,
        line1: updateData.address.street,
        city: updateData.address.city,
        state: updateData.address.state,
        postalCode: updateData.address.zipCode,
        country: updateData.address.country,
        updatedAt: new Date().toISOString()
      }
    };

    this.profileSubject.next(optimisticProfile);
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const userId = this.getCurrentUserId();
    if (!userId) {
      this.revertOptimisticUpdate(currentProfile);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.put<UserProfile>(`${this.API_BASE_URL}/${userId}/profile`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(updatedProfile => {
        // Update with actual server response
        this.profileSubject.next(updatedProfile);
        this.lastFetchTime = Date.now();
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        // Revert optimistic update on error
        this.revertOptimisticUpdate(currentProfile);
        this.errorSubject.next('Failed to update profile');
        this.isLoadingSubject.next(false);
        console.error('Profile update error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle distributed transaction for address updates
   */
  updateAddressWithRetry(updateData: UpdateProfileRequest, maxRetries: number = 3): Observable<UserProfile> {
    return this.updateProfile(updateData).pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          console.log(`Address update retry ${retryCount}/${maxRetries}`);
          // Exponential backoff: 1s, 2s, 4s
          return of(null).pipe(delay(Math.pow(2, retryCount - 1) * 1000));
        }
      }),
      catchError(error => {
        // After all retries failed, refresh profile to get latest state
        console.error('Address update failed after retries, refreshing profile');
        return this.getUserProfile(true);
      })
    );
  }

  /**
   * Refresh profile data from server
   */
  refreshProfile(): Observable<UserProfile> {
    return this.getUserProfile(true);
  }

  /**
   * Clear cached profile data
   */
  clearCache(): void {
    this.profileSubject.next(null);
    this.lastFetchTime = 0;
    this.errorSubject.next(null);
  }

  /**
   * Get current profile value
   */
  getCurrentProfile(): UserProfile | null {
    return this.profileSubject.value;
  }

  private getCurrentUserId(): number | null {
    const user = this.authService.getCurrentUser();
    return user?.userId || null;
  }

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  private revertOptimisticUpdate(originalProfile: UserProfile): void {
    this.profileSubject.next(originalProfile);
  }
}
