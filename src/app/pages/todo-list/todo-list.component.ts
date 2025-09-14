import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

interface TodoResponse {
  todos: Todo[];
  total: number;
  skip: number;
  limit: number;
}

@Component({
  selector: 'app-todo-list',
  template: `
    <div class="bg-white min-h-screen py-8">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">📝</span>
              <h1 class="text-3xl font-bold text-gray-800">Todo List</h1>
            </div>
            <div class="flex gap-4">
              <div class="bg-gray-100 px-4 py-2 rounded-lg">
                <span class="text-gray-700 text-sm font-medium">Loaded: {{ todos.length }} todos</span>
              </div>
              <div class="bg-gray-100 px-4 py-2 rounded-lg">
                <span class="text-gray-700 text-sm font-medium">Total: {{ totalTodos }} todos</span>
              </div>
            </div>
          </div>
          <p class="text-gray-600 mb-6">Manage your tasks with infinite scroll lazy loading</p>
        </div>

          <div *ngIf="initialLoading" class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="spinner mx-auto mb-4"></div>
            <p class="text-gray-600">Loading initial todos...</p>
          </div>

          <div *ngIf="!initialLoading && todos.length > 0" class="space-y-4">
            <div 
              *ngFor="let todo of todos; trackBy: trackByTodoId" 
              class="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              [class.opacity-60]="todo.completed">
              <div class="flex items-start gap-4">
                <input 
                  type="checkbox" 
                  class="w-5 h-5 mt-1 rounded border-2 border-gray-300 bg-white text-green-500 focus:ring-green-500 focus:ring-2"
                  [checked]="todo.completed"
                  (change)="toggleTodo(todo)">
                <div class="flex-1">
                  <div class="text-gray-800 font-medium mb-1" [class.line-through]="todo.completed">{{ todo.todo }}</div>
                  <div class="text-gray-500 text-sm">ID: {{ todo.id }} | User: {{ todo.userId }}</div>
                </div>
              </div>
            </div>

            <!-- Loading indicator for lazy loading -->
            <div *ngIf="loadingMore" class="bg-white rounded-xl shadow-lg p-6 text-center">
              <div class="spinner mx-auto mb-3"></div>
              <span class="text-gray-600">Loading more todos...</span>
            </div>

            <!-- End of list indicator -->
            <div *ngIf="hasReachedEnd && !loadingMore" class="bg-white rounded-xl shadow-lg p-8 text-center">
              <div class="text-4xl mb-4">🎉</div>
              <p class="text-gray-800 font-medium">You've reached the end! All {{ totalTodos }} todos have been loaded.</p>
            </div>
          </div>

          <div *ngIf="!initialLoading && todos.length === 0" class="bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="text-4xl mb-4">📝</div>
            <p class="text-gray-600">No todos found.</p>
          </div>

          <div *ngIf="error" class="bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="text-4xl mb-4">⚠️</div>
            <p class="text-gray-600 mb-6">Error loading todos: {{ error }}</p>
            <button class="glass-button-green" (click)="retryLoading()">Retry</button>
          </div>
        </div>
      </div>
  `,
  styles: []
})
export class TodoListComponent implements OnInit {
  todos: Todo[] = [];
  initialLoading = false;
  loadingMore = false;
  error: string | null = null;
  skip = 0;
  limit = 20; // Load 20 todos at a time
  totalTodos = 0;
  hasReachedEnd = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadInitialTodos();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    // Check if user has scrolled near the bottom of the page
    if (this.isNearBottom() && !this.loadingMore && !this.hasReachedEnd && !this.initialLoading) {
      this.loadMoreTodos();
    }
  }

  private isNearBottom(): boolean {
    const threshold = 200; // pixels from bottom
    const position = window.pageYOffset + window.innerHeight;
    const height = document.body.scrollHeight;
    return position > height - threshold;
  }

  loadInitialTodos() {
    this.initialLoading = true;
    this.error = null;
    this.skip = 0;
    this.todos = [];
    this.hasReachedEnd = false;
    
    this.fetchTodos();
  }

  loadMoreTodos() {
    if (this.loadingMore || this.hasReachedEnd) return;
    
    this.loadingMore = true;
    this.fetchTodos();
  }

  private fetchTodos() {
    const url = `https://dummyjson.com/todos?limit=${this.limit}&skip=${this.skip}`;

    this.http.get<TodoResponse>(url).subscribe({
      next: (response) => {
        if (this.skip === 0) {
          // Initial load
          this.todos = response.todos;
          this.initialLoading = false;
        } else {
          // Append new todos for lazy loading
          this.todos = [...this.todos, ...response.todos];
          this.loadingMore = false;
        }
        
        this.totalTodos = response.total;
        this.skip += this.limit;
        
        // Check if we've reached the end
        if (this.todos.length >= this.totalTodos) {
          this.hasReachedEnd = true;
        }
      },
      error: (error) => {
        this.error = error.message || 'Failed to load todos';
        this.initialLoading = false;
        this.loadingMore = false;
      }
    });
  }

  toggleTodo(todo: Todo) {
    todo.completed = !todo.completed;
    // In a real app, you would make an API call to update the todo
  }

  retryLoading() {
    this.loadInitialTodos();
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
}
