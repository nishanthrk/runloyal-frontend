import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DogResponse {
  message: string;
  status: string;
}

interface DogImage {
  url: string;
  breed: string;
  id: number;
  loading?: boolean;
  height?: number;
  showTooltip?: boolean;
}

@Component({
  selector: 'app-dog-gallery',
  template: `
    <div class="bg-white min-h-screen py-8">
      <div class="max-w-6xl mx-auto px-6">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">🐕</span>
            <h1 class="text-3xl font-bold text-gray-800">Dog Gallery</h1>
          </div>
          <p class="text-gray-600 mb-6">Discover adorable dogs with infinite scroll and search</p>
        </div>

        <!-- Search bar -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div class="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div class="flex-1 max-w-md">
                <div class="relative">
                  <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input 
                    type="text" 
                    class="glass-input w-full pl-12" 
                    placeholder="Search dogs by breed, color, etc..."
                    [(ngModel)]="searchTerm"
                    (input)="onSearchChange()">
                </div>
              </div>
              <div class="flex items-center gap-4">
                <button class="glass-button flex items-center gap-2">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Settings
                </button>
              </div>
            </div>
          </div>

          <!-- Loading state -->
          <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
            <div class="spinner"></div>
            <p class="text-gray-600 mt-4">Fetching adorable dog images...</p>
          </div>

          <!-- Masonry Grid -->
          <div *ngIf="!loading && filteredDogs.length > 0" class="masonry-grid">
            <div 
              *ngFor="let dog of filteredDogs; trackBy: trackByDogId" 
              class="masonry-item"
              [style.height.px]="dog.height || 250">
              
              <!-- Shimmer placeholder -->
              <div *ngIf="dog.loading" class="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="shimmer h-48 w-full"></div>
                <div class="p-4">
                  <div class="shimmer h-4 w-3/4 rounded mb-2"></div>
                  <div class="shimmer h-3 w-1/2 rounded"></div>
                </div>
              </div>

              <!-- Actual dog card -->
              <div *ngIf="!dog.loading" class="bg-white rounded-2xl shadow-lg overflow-hidden group" (mouseenter)="showTooltip(dog)" (mouseleave)="hideTooltip(dog)">
                <div class="relative overflow-hidden">
                  <img 
                    [src]="dog.url" 
                    [alt]="dog.breed"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    (load)="onImageLoad(dog, $event)"
                    (error)="onImageError($event)">
                  
                  <!-- Hover overlay with attribution -->
                  <div *ngIf="dog.showTooltip" class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span class="text-white font-medium">{{ dog.breed }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading more indicator -->
          <div *ngIf="loadingMore" class="flex flex-col items-center justify-center py-12">
            <div class="spinner"></div>
            <p class="text-gray-600 mt-4">Loading more adorable dogs...</p>
          </div>

          <!-- End of content indicator -->
          <div *ngIf="hasReachedEnd && !loadingMore" class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="text-6xl mb-4">🐕</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">That's all the dogs for now!</h3>
            <p class="text-gray-600 mb-6">You've seen all {{ dogs.length }} adorable dogs. Check back later for more!</p>
            <button class="glass-button-green" (click)="resetAndLoad()">Load Fresh Dogs</button>
          </div>

          <!-- Empty state -->
          <div *ngIf="!loading && filteredDogs.length === 0" class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="text-6xl mb-4">🐕</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">No dogs found</h3>
            <p class="text-gray-600 mb-6">Try adjusting your search or load some new dogs!</p>
            <button class="glass-button-green" (click)="loadDogs()">Load Dogs</button>
          </div>

          <!-- Error state -->
          <div *ngIf="error" class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
            <p class="text-gray-600 mb-6">{{ error }}</p>
            <button class="glass-button-green" (click)="loadDogs()">Try Again</button>
          </div>
        </div>
      </div>
  `,
  styles: []
})
export class DogGalleryComponent implements OnInit {
  dogs: DogImage[] = [];
  filteredDogs: DogImage[] = [];
  loading = false;
  loadingMore = false;
  error: string | null = null;
  searchTerm: string = '';
  hasReachedEnd = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDogs();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    if (this.isNearBottom() && !this.loadingMore && !this.hasReachedEnd && !this.loading) {
      this.loadMoreDogs();
    }
  }

  private isNearBottom(): boolean {
    const threshold = 300; // Load more when 300px from bottom
    const position = window.pageYOffset + window.innerHeight;
    const height = document.body.scrollHeight;
    return position > height - threshold;
  }

  loadDogs() {
    this.loading = true;
    this.error = null;
    this.dogs = [];
    this.filteredDogs = [];
    this.hasReachedEnd = false;

    this.loadMoreDogs();
  }

  loadMoreDogs() {
    if (this.loadingMore || this.hasReachedEnd) return;

    this.loadingMore = true;

    // Create shimmer placeholders first
    const shimmerDogs = Array.from({ length: 10 }, (_, index) => ({
      url: '',
      breed: '',
      id: this.dogs.length + index + 1,
      loading: true,
      height: this.getRandomHeight(),
      showTooltip: false
    }));

    this.dogs = [...this.dogs, ...shimmerDogs];
    this.filteredDogs = [...this.filteredDogs, ...shimmerDogs];

    // Call the API 10 times to get 10 random dog images
    const requests = Array.from({ length: 10 }, (_, index) => 
      this.http.get<DogResponse>('https://dog.ceo/api/breeds/image/random')
    );

    // Execute all requests in parallel
    Promise.all(requests.map(request => request.toPromise()))
      .then(responses => {
        const newDogs = responses.map((response, index) => {
          if (response && response.message) {
            // Extract breed from URL
            const urlParts = response.message.split('/');
            const breed = urlParts[urlParts.length - 2] || 'Unknown';
            const formattedBreed = this.formatBreedName(breed);
            
            return {
              url: response.message,
              breed: formattedBreed,
              id: this.dogs.length - 10 + index + 1,
              loading: false,
              height: this.getRandomHeight(),
              showTooltip: false
            };
          }
          return null;
        }).filter(dog => dog !== null) as DogImage[];

        // Replace shimmer placeholders with actual data
        this.dogs = this.dogs.map((dog, index) => {
          if (dog.loading && index >= this.dogs.length - 10) {
            const newDog = newDogs[index - (this.dogs.length - 10)];
            return newDog || dog;
          }
          return dog;
        });

        this.filteredDogs = this.dogs;
        this.loading = false;
        this.loadingMore = false;

        // Simulate reaching end after loading 50 dogs (5 batches of 10)
        if (this.dogs.length >= 50) {
          this.hasReachedEnd = true;
        }
      })
      .catch(error => {
        this.error = error.message || 'Failed to load dog images';
        this.loading = false;
        this.loadingMore = false;
      });
  }

  onSearchChange() {
    if (!this.searchTerm.trim()) {
      this.filteredDogs = this.dogs;
    } else {
      this.filteredDogs = this.dogs.filter(dog => 
        dog.breed.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showTooltip(dog: DogImage) {
    dog.showTooltip = true;
  }

  hideTooltip(dog: DogImage) {
    dog.showTooltip = false;
  }

  onImageLoad(dog: DogImage, event: any) {
    // Image loaded successfully
    const img = event.target;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const containerWidth = 300; // Approximate card width
    const calculatedHeight = containerWidth * aspectRatio;
    
    // Update height for better layout
    dog.height = Math.min(Math.max(calculatedHeight, 200), 500);
  }

  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }

  getRandomHeight(): number {
    // Generate more varied heights for better masonry effect
    const heights = [180, 220, 260, 300, 340, 380, 420, 460];
    return heights[Math.floor(Math.random() * heights.length)];
  }

  formatBreedName(breed: string): string {
    return breed
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  trackByDogId(index: number, dog: DogImage): number {
    return dog.id;
  }

  resetAndLoad() {
    this.loadDogs();
  }
}
