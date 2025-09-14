import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { map, catchError, tap, switchMap, finalize } from 'rxjs/operators';

export interface QueryOptions {
  staleTime?: number; // Time in ms before data is considered stale
  cacheTime?: number; // Time in ms to keep data in cache
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
}

export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  isStale: boolean;
  lastUpdated: number;
  isFetching: boolean;
}

export interface MutationOptions<TData, TVariables> {
  onMutate?: (variables: TVariables) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: any, variables: TVariables) => void;
}

@Injectable({
  providedIn: 'root'
})
export class QueryService {
  private cache = new Map<string, QueryState<any>>();
  private queries = new Map<string, BehaviorSubject<QueryState<any>>>();
  private defaultOptions: QueryOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000
  };

  constructor() {
    // Listen for window focus to refetch stale queries
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.refetchStaleQueries();
      });
    }
  }

  /**
   * Create a query with caching and background refetching
   */
  useQuery<T>(
    queryKey: string,
    queryFn: () => Observable<T>,
    options: QueryOptions = {}
  ): Observable<QueryState<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const cacheKey = this.getCacheKey(queryKey, mergedOptions);

    // Return cached data if available and not stale
    if (this.cache.has(cacheKey)) {
      const cachedState = this.cache.get(cacheKey)!;
      if (!this.isStale(cachedState, mergedOptions.staleTime!)) {
        return this.getQueryObservable(cacheKey);
      }
    }

    // Create new query state
    const initialState: QueryState<T> = {
      data: this.cache.get(cacheKey)?.data || null,
      isLoading: true,
      isError: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
      isFetching: true
    };

    this.cache.set(cacheKey, initialState);
    this.createQueryObservable(cacheKey);

    // Execute query
    this.executeQuery(cacheKey, queryFn, mergedOptions);

    return this.getQueryObservable(cacheKey);
  }

  /**
   * Create a mutation with optimistic updates
   */
  useMutation<TData, TVariables>(
    mutationFn: (variables: TVariables) => Observable<TData>,
    options: MutationOptions<TData, TVariables> = {}
  ) {
    const mutationState = new BehaviorSubject<{
      isLoading: boolean;
      isError: boolean;
      error: any;
      data: TData | null;
    }>({
      isLoading: false,
      isError: false,
      error: null,
      data: null
    });

    const mutate = (variables: TVariables) => {
      mutationState.next({
        isLoading: true,
        isError: false,
        error: null,
        data: null
      });

      // Call onMutate for optimistic updates
      if (options.onMutate) {
        options.onMutate(variables);
      }

      return mutationFn(variables).pipe(
        tap(data => {
          mutationState.next({
            isLoading: false,
            isError: false,
            error: null,
            data
          });

          if (options.onSuccess) {
            options.onSuccess(data, variables);
          }
        }),
        catchError(error => {
          mutationState.next({
            isLoading: false,
            isError: true,
            error,
            data: null
          });

          if (options.onError) {
            options.onError(error, variables);
          }

          return throwError(() => error);
        }),
        finalize(() => {
          if (options.onSettled) {
            options.onSettled(mutationState.value.data || undefined, mutationState.value.error, variables);
          }
        })
      );
    };

    return {
      mutate,
      state$: mutationState.asObservable()
    };
  }

  /**
   * Invalidate and refetch a query
   */
  invalidateQuery(queryKey: string): void {
    const cacheKey = this.getCacheKey(queryKey, this.defaultOptions);
    if (this.cache.has(cacheKey)) {
      const state = this.cache.get(cacheKey)!;
      state.isStale = true;
      this.cache.set(cacheKey, state);
      this.updateQueryState(cacheKey, state);
    }
  }

  /**
   * Set query data manually
   */
  setQueryData<T>(queryKey: string, data: T): void {
    const cacheKey = this.getCacheKey(queryKey, this.defaultOptions);
    const state: QueryState<T> = {
      data,
      isLoading: false,
      isError: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
      isFetching: false
    };
    this.cache.set(cacheKey, state);
    this.updateQueryState(cacheKey, state);
  }

  /**
   * Get cached query data
   */
  getQueryData<T>(queryKey: string): T | null {
    const cacheKey = this.getCacheKey(queryKey, this.defaultOptions);
    return this.cache.get(cacheKey)?.data || null;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.queries.clear();
  }

  private executeQuery<T>(
    cacheKey: string,
    queryFn: () => Observable<T>,
    options: QueryOptions
  ): void {
    const state = this.cache.get(cacheKey)!;
    state.isFetching = true;
    this.updateQueryState(cacheKey, state);

    queryFn().pipe(
      map(data => {
        const newState: QueryState<T> = {
          data,
          isLoading: false,
          isError: false,
          error: null,
          isStale: false,
          lastUpdated: Date.now(),
          isFetching: false
        };
        this.cache.set(cacheKey, newState);
        this.updateQueryState(cacheKey, newState);
        return data;
      }),
      catchError(error => {
        const errorState: QueryState<T> = {
          data: state.data,
          isLoading: false,
          isError: true,
          error,
          isStale: false,
          lastUpdated: Date.now(),
          isFetching: false
        };
        this.cache.set(cacheKey, errorState);
        this.updateQueryState(cacheKey, errorState);
        return throwError(() => error);
      })
    ).subscribe();
  }

  private getCacheKey(queryKey: string, options: QueryOptions): string {
    return `${queryKey}_${options.staleTime}_${options.cacheTime}`;
  }

  private isStale(state: QueryState<any>, staleTime: number): boolean {
    return Date.now() - state.lastUpdated > staleTime;
  }

  private createQueryObservable(cacheKey: string): void {
    if (!this.queries.has(cacheKey)) {
      this.queries.set(cacheKey, new BehaviorSubject(this.cache.get(cacheKey)!));
    }
  }

  private getQueryObservable<T>(cacheKey: string): Observable<QueryState<T>> {
    return this.queries.get(cacheKey)!.asObservable();
  }

  private updateQueryState(cacheKey: string, state: QueryState<any>): void {
    if (this.queries.has(cacheKey)) {
      this.queries.get(cacheKey)!.next(state);
    }
  }

  private refetchStaleQueries(): void {
    // Implementation for refetching stale queries on window focus
    // This would be called when the window regains focus
  }
}

