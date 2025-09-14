import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfileService, UserProfile, UpdateProfileRequest } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { QueryState } from '../../services/query.service';

@Component({
  selector: 'app-account-form',
  template: `
    <div class="account-container">
      <!-- Header Section -->

      <!-- Loading State -->
      <div *ngIf="isLoading$ | async" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your profile...</p>
      </div>

      <!-- Main Content -->
      <div *ngIf="!(isLoading$ | async)" class="account-content">
        
        <!-- Error Message -->
        <div *ngIf="isError$ | async" class="error-banner">
          <div class="error-content">
            <svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div class="error-text">
              <p class="error-message">{{ errorMessage$ | async }}</p>
              <button type="button" class="retry-btn" (click)="refreshProfile()">Retry</button>
            </div>
          </div>
        </div>

        <!-- Profile Form -->
        <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="profile-form">
          
          <!-- Personal Information Section -->
          <div class="form-section">
            <div class="section-header">
              <div class="section-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h2 class="section-title">Personal Information</h2>
            </div>
            
            <div class="form-grid">
              <div class="form-field">
                <label for="firstName" class="field-label">
                  First Name <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="firstName"
                  formControlName="firstName"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('firstName')"
                  placeholder="Enter your first name">
                <div *ngIf="isFieldInvalid('firstName')" class="field-error-message">
                  <span *ngIf="accountForm.get('firstName')?.errors?.['required']">
                    First name is required
                  </span>
                  <span *ngIf="accountForm.get('firstName')?.errors?.['minlength']">
                    First name must be at least 2 characters
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="lastName" class="field-label">
                  Last Name <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="lastName"
                  formControlName="lastName"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('lastName')"
                  placeholder="Enter your last name">
                <div *ngIf="isFieldInvalid('lastName')" class="field-error-message">
                  <span *ngIf="accountForm.get('lastName')?.errors?.['required']">
                    Last name is required
                  </span>
                  <span *ngIf="accountForm.get('lastName')?.errors?.['minlength']">
                    Last name must be at least 2 characters
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="email" class="field-label">
                  Email Address <span class="required">*</span>
                </label>
                <input 
                  type="email" 
                  id="email"
                  formControlName="email"
                  class="field-input field-disabled"
                  [class.field-error]="isFieldInvalid('email')"
                  placeholder="Enter your email address"
                  readonly>
                <div class="field-help">Email cannot be changed</div>
              </div>

              <div class="form-field">
                <label for="phone" class="field-label">
                  Phone Number <span class="required">*</span>
                </label>
                <input 
                  type="tel" 
                  id="phone"
                  formControlName="phone"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('phone')"
                  placeholder="Enter your phone number">
                <div *ngIf="isFieldInvalid('phone')" class="field-error-message">
                  <span *ngIf="accountForm.get('phone')?.errors?.['required']">
                    Phone number is required
                  </span>
                  <span *ngIf="accountForm.get('phone')?.errors?.['pattern']">
                    Please enter a valid phone number
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="dateOfBirth" class="field-label">
                  Date of Birth
                </label>
                <input 
                  type="date" 
                  id="dateOfBirth"
                  formControlName="dateOfBirth"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('dateOfBirth')">
                <div *ngIf="isFieldInvalid('dateOfBirth')" class="field-error-message">
                  <span *ngIf="accountForm.get('dateOfBirth')?.errors?.['futureDate']">
                    Date of birth cannot be in the future
                  </span>
                </div>
              </div>

              <div class="form-field">
                <!-- Empty field for spacing in three-column layout -->
              </div>
            </div>
          </div>

          <!-- Address Information Section -->
          <div class="form-section">
            <div class="section-header">
              <div class="section-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h2 class="section-title">Address Information</h2>
            </div>
            
            <div class="form-grid-three">
              <div class="form-field">
                <label for="street" class="field-label">
                  Street Address <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="street"
                  formControlName="street"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('street')"
                  placeholder="Enter your street address">
                <div *ngIf="isFieldInvalid('street')" class="field-error-message">
                  <span *ngIf="accountForm.get('street')?.errors?.['required']">
                    Street address is required
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="city" class="field-label">
                  City <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="city"
                  formControlName="city"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('city')"
                  placeholder="Enter your city">
                <div *ngIf="isFieldInvalid('city')" class="field-error-message">
                  <span *ngIf="accountForm.get('city')?.errors?.['required']">
                    City is required
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="state" class="field-label">
                  State/Province <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="state"
                  formControlName="state"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('state')"
                  placeholder="Enter your state">
                <div *ngIf="isFieldInvalid('state')" class="field-error-message">
                  <span *ngIf="accountForm.get('state')?.errors?.['required']">
                    State/Province is required
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="zipCode" class="field-label">
                  ZIP/Postal Code <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="zipCode"
                  formControlName="zipCode"
                  class="field-input"
                  [class.field-error]="isFieldInvalid('zipCode')"
                  placeholder="Enter your ZIP code">
                <div *ngIf="isFieldInvalid('zipCode')" class="field-error-message">
                  <span *ngIf="accountForm.get('zipCode')?.errors?.['required']">
                    ZIP/Postal code is required
                  </span>
                </div>
              </div>

              <div class="form-field">
                <label for="country" class="field-label">
                  Country <span class="required">*</span>
                </label>
                <select 
                  id="country"
                  formControlName="country"
                  class="field-input field-select"
                  [class.field-error]="isFieldInvalid('country')">
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IN">India</option>
                  <option value="JP">Japan</option>
                  <option value="other">Other</option>
                </select>
                <div *ngIf="isFieldInvalid('country')" class="field-error-message">
                  <span *ngIf="accountForm.get('country')?.errors?.['required']">
                    Country is required
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              (click)="resetForm()"
              [disabled]="isSubmitting">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reset
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="accountForm.invalid || isSubmitting">
              <span *ngIf="isSubmitting" class="btn-spinner"></span>
              <svg *ngIf="!isSubmitting" class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>

        <!-- Success Message -->
        <div *ngIf="successMessage" class="success-banner">
          <div class="success-content">
            <svg class="success-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <div class="success-text">
              <h3 class="success-title">Profile Updated Successfully!</h3>
              <p class="success-message">{{ successMessage }}</p>
              <button class="success-btn" (click)="clearSuccessMessage()">OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .account-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
    }

    /* Header Section */
    .account-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: #3b82f6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .header-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .header-subtitle {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 1rem;
    }

    /* Loading State */
    .loading-state {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .loading-text {
      color: #64748b;
      font-size: 1.125rem;
      margin: 0;
    }

    /* Main Content */
    .account-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Error Banner */
    .error-banner {
      background: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .error-icon {
      width: 20px;
      height: 20px;
      color: #dc2626;
      flex-shrink: 0;
    }

    .error-text {
      flex: 1;
    }

    .error-message {
      color: #dc2626;
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .retry-btn {
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .retry-btn:hover {
      background: #b91c1c;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .section-icon {
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .form-grid-three {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .form-field-full {
      grid-column: 1 / -1;
    }

    /* Form Fields */
    .form-field {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #dc2626;
    }

    .field-input {
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    .field-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .field-input.field-error {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .field-input.field-disabled {
      background: #f8fafc;
      color: #64748b;
      cursor: not-allowed;
    }

    .field-select {
      cursor: pointer;
    }

    .field-help {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .field-error-message {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-icon {
      width: 16px;
      height: 16px;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Success Banner */
    .success-banner {
      background: #f0fdf4;
      border: 1px solid #34d399;
      border-radius: 12px;
      padding: 1rem;
      margin-top: 2rem;
    }

    .success-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .success-icon {
      width: 20px;
      height: 20px;
      color: #059669;
      flex-shrink: 0;
    }

    .success-text {
      flex: 1;
    }

    .success-title {
      color: #059669;
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .success-message {
      color: #047857;
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .success-btn {
      background: #059669;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .success-btn:hover {
      background: #047857;
    }

    /* Animations */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .form-grid-three {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .account-container {
        padding: 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-grid-three {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }
    }
  `]
})
export class AccountFormComponent implements OnInit, OnDestroy {
  accountForm: FormGroup;
  isSubmitting = false;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  // Query state properties
  queryState$!: Observable<QueryState<UserProfile>>;
  isLoading$!: Observable<boolean>;
  isError$!: Observable<boolean>;
  errorMessage$!: Observable<string | null>;
  profileData$!: Observable<UserProfile | null>;

  // Store the current profile locally to avoid cache timing issues
  private currentProfile: UserProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {
    this.accountForm = this.createForm();
  }

  ngOnInit() {
    console.log('AccountFormComponent initialized');
    console.log('Auth service isAuthenticated:', this.authService.isAuthenticated());
    console.log('Current user:', this.authService.getCurrentUser());
    
    // Initialize query state observables
    this.queryState$ = this.userProfileService.getUserProfile();
    this.isLoading$ = this.queryState$.pipe(map((state: QueryState<UserProfile>) => state.isLoading));
    this.isError$ = this.queryState$.pipe(map((state: QueryState<UserProfile>) => state.isError));
    this.errorMessage$ = this.queryState$.pipe(map((state: QueryState<UserProfile>) => state.error?.message || null));
    this.profileData$ = this.queryState$.pipe(map((state: QueryState<UserProfile>) => state.data));

    // Subscribe to profile data changes to populate form and store locally
    this.profileData$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((profile: UserProfile | null) => {
      if (profile) {
        this.currentProfile = profile; // Store the profile locally
        this.populateForm(profile);
      } else {
        this.currentProfile = null;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]], // Email is read-only
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]], // Made optional
      dateOfBirth: ['', [this.futureDateValidator]], // Made optional
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

  futureDateValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate > today ? { futureDate: true } : null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.accountForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }


  populateForm(profile: UserProfile): void {
    this.accountForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phoneNumber || '',
      dateOfBirth: profile.dateOfBirth || '',
      street: profile.address?.line1 || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      zipCode: profile.address?.postalCode || '',
      country: profile.address?.country || ''
    });
  }

  onSubmit(): void {
    console.log('onSubmit called');
    
    if (this.accountForm.invalid) {
      console.log('Form is invalid');
      // Mark all fields as touched to show validation errors
      Object.keys(this.accountForm.controls).forEach(key => {
        this.accountForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.successMessage = null;

    const formValue = this.accountForm.value;
    // Use the locally stored currentProfile instead of querying the service
    const currentProfile = this.currentProfile;

    console.log('Form value:', formValue);
    console.log('Current profile:', currentProfile);

    if (!currentProfile) {
      console.log('No current profile found - this should not happen if form is populated');
      this.isSubmitting = false;
      return;
    }

    const updateData: UpdateProfileRequest = {
      id: currentProfile.id,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNumber: formValue.phone || null,
      dateOfBirth: formValue.dateOfBirth || null,
      createdAt: currentProfile.createdAt,
      updatedAt: currentProfile.updatedAt,
      address: {
        street: formValue.street || '',
        city: formValue.city || '',
        state: formValue.state || '',
        zipCode: formValue.zipCode || '',
        country: formValue.country || ''
      }
    };

    console.log('Update data:', updateData);

    // Use the new mutation-based update with automatic cache invalidation
    console.log('Calling updateProfile...');
    const mutation = this.userProfileService.updateProfile(updateData);
    
    console.log('Mutation result:', mutation);
    
    mutation.pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        console.log('Mutation completed');
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (result) => {
        console.log('Profile update success:', result);
        this.successMessage = 'Your profile has been updated successfully!';
        // The form will automatically update when the cache is refreshed
      },
      error: (error) => {
        console.error('Error updating profile:', error);
      }
    });
  }

  resetForm(): void {
    // Use the locally stored currentProfile for reset
    if (this.currentProfile) {
      this.populateForm(this.currentProfile);
    } else {
      this.accountForm.reset();
    }
    this.successMessage = null;
  }

  refreshProfile(): void {
    this.userProfileService.refreshProfile();
  }

  clearSuccessMessage(): void {
    this.successMessage = null;
  }
}

