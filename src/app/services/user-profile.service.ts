import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, retry, delay, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { QueryService, QueryState } from './query.service';

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
  phoneNumber: string | null;
  dateOfBirth: string | null;
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
  private readonly QUERY_KEY = 'user-profile';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private queryService: QueryService
  ) {}

  /**
   * Get user profile with TanStack Query-like caching
   */
  getUserProfile(forceRefresh: boolean = false): Observable<QueryState<UserProfile>> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const queryKey = `${this.QUERY_KEY}-${userId}`;
    
    if (forceRefresh) {
      this.queryService.invalidateQuery(queryKey);
    }

    return this.queryService.useQuery(
      queryKey,
      () => this.fetchUserProfile(userId),
      {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        retry: 3
      }
    );
  }

  /**
   * Get user profile data (just the data, not the query state)
   */
  getUserProfileData(): Observable<UserProfile> {
    return this.getUserProfile().pipe(
      map(queryState => {
        if (queryState.data) {
          return queryState.data;
        }
        throw new Error('No profile data available');
      })
    );
  }

  /**
   * Fetch user profile from API
   */
  private fetchUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_BASE_URL}/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Profile fetch error:', error);
        // Return mock data for development/testing
        return of(this.createMockProfile(userId));
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
   * Update user profile with TanStack Query-like mutations
   */
  updateProfile(updateData: UpdateProfileRequest) {
    console.log('UserProfileService.updateProfile called with:', updateData);
    
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('No user ID found');
      return throwError(() => new Error('User not authenticated'));
    }

    console.log('User ID:', userId);
    const queryKey = `${this.QUERY_KEY}-${userId}`;
    const currentProfile = this.queryService.getQueryData(queryKey);
    
    console.log('Query key:', queryKey);
    console.log('Current profile from cache:', currentProfile);

    // For now, let's use a direct HTTP call to test if the issue is with QueryService
    console.log('Using direct HTTP call for testing...');
    return this.performProfileUpdate(updateData, userId).pipe(
      tap(response => {
        console.log('Direct HTTP call successful, invalidating cache...');
        this.queryService.invalidateQuery(queryKey);
      })
    );

    // TODO: Re-enable QueryService mutation once direct call works
    /*
    const mutation = this.queryService.useMutation(
      (data: UpdateProfileRequest) => this.performProfileUpdate(data, userId),
      {
        onMutate: (variables) => {
          // Optimistic update
          if (currentProfile && typeof currentProfile === 'object' && 'id' in currentProfile) {
            const defaultAddress = {
              id: 1,
              userId: (currentProfile as UserProfile).id,
              line1: '',
              line2: null,
              city: '',
              state: '',
              country: '',
              postalCode: '',
              isPrimary: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const profile = currentProfile as UserProfile;
            const optimisticProfile: UserProfile = {
              ...profile,
              firstName: variables.firstName,
              lastName: variables.lastName,
              phoneNumber: variables.phoneNumber,
              dateOfBirth: variables.dateOfBirth,
              updatedAt: new Date().toISOString(),
              address: {
                ...(profile.address || defaultAddress),
                line1: variables.address.street,
                city: variables.address.city,
                state: variables.address.state,
                postalCode: variables.address.zipCode,
                country: variables.address.country,
                updatedAt: new Date().toISOString()
              }
            };
            this.queryService.setQueryData(queryKey, optimisticProfile);
          }
        },
        onSuccess: (data) => {
          // After successful update, refetch the profile to get the latest data
          // This ensures we have the complete data including any server-side changes
          this.queryService.invalidateQuery(queryKey);
        },
        onError: (error, variables) => {
          console.error('Profile update error:', error);
          // The optimistic update will be automatically reverted by the query service
        }
      }
    );

    return mutation.mutate(updateData);
    */
  }

  /**
   * Perform the actual profile update API call
   */
  private performProfileUpdate(updateData: UpdateProfileRequest, userId: number): Observable<UserProfile> {
    console.log('performProfileUpdate called with:', updateData, 'userId:', userId);
    const url = `${this.API_BASE_URL}/${userId}/profile`;
    console.log('PUT request to:', url);
    
    return this.http.put<UserProfile>(url, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('PUT response:', response)),
      catchError(error => {
        console.error('PUT error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle distributed transaction for address updates with retry
   */
  updateAddressWithRetry(updateData: UpdateProfileRequest, maxRetries: number = 3): Observable<UserProfile> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.performProfileUpdate(updateData, userId).pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          console.log(`Address update retry ${retryCount}/${maxRetries}`);
          // Exponential backoff: 1s, 2s, 4s
          return of(null).pipe(delay(Math.pow(2, retryCount - 1) * 1000));
        }
      }),
      tap(() => {
        // After successful update, invalidate and refetch the profile
        const queryKey = `${this.QUERY_KEY}-${userId}`;
        this.queryService.invalidateQuery(queryKey);
      }),
      catchError(error => {
        console.error('Address update failed after retries:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh profile data from server
   */
  refreshProfile(): Observable<QueryState<UserProfile>> {
    return this.getUserProfile(true);
  }

  /**
   * Clear cached profile data
   */
  clearCache(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const queryKey = `${this.QUERY_KEY}-${userId}`;
      this.queryService.invalidateQuery(queryKey);
    }
  }

  /**
   * Get current profile value
   */
  getCurrentProfile(): UserProfile | null {
    const userId = this.getCurrentUserId();
    if (userId) {
      const queryKey = `${this.QUERY_KEY}-${userId}`;
      return this.queryService.getQueryData(queryKey);
    }
    return null;
  }

  private getCurrentUserId(): number | null {
    const user = this.authService.getCurrentUser();
    return user?.userId || null;
  }

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

}
