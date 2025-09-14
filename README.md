# RL Frontend - Angular Application

A modern Angular 14+ frontend application featuring three main pages with different functionalities and APIs.

## Features

### 📝 Page 1: Todo List with Pagination
- **API**: [DummyJSON Todos API](https://dummyjson.com/docs/todos#todos-all)
- **Features**:
  - Lazy loading with pagination
  - Interactive todo items with checkboxes
  - Responsive pagination controls
  - Loading states and error handling
  - Real-time todo completion toggle

### 🐕 Page 2: Dog Gallery
- **API**: [Dog CEO API](https://dog.ceo/api/breeds/image/random)
- **Features**:
  - Fetches 10 random dog images simultaneously
  - Beautiful card-based gallery layout
  - Responsive grid design
  - Error handling for failed image loads
  - Breed name extraction and formatting

### 👤 Page 3: Account Details Form
- **Features**:
  - Comprehensive form validation
  - Personal information section
  - Account settings with password confirmation
  - User preferences
  - Real-time validation feedback
  - Form submission handling

## Technologies Used

- **Angular 14+** - Frontend framework
- **TypeScript** - Programming language
- **RxJS** - Reactive programming
- **Angular Reactive Forms** - Form handling and validation
- **Angular Router** - Navigation
- **Angular HttpClient** - API communication
- **CSS3** - Modern styling with Flexbox and Grid

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Angular CLI (v14 or higher)

### Installation

1. **Clone or download the project**
   ```bash
   cd rl-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Angular CLI globally** (if not already installed)
   ```bash
   npm install -g @angular/cli@14
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

5. **Open your browser**
   Navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
# or
ng build --prod
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── navigation/
│   │       └── navigation.component.ts
│   ├── pages/
│   │   ├── todo-list/
│   │   │   └── todo-list.component.ts
│   │   ├── dog-gallery/
│   │   │   └── dog-gallery.component.ts
│   │   └── account-form/
│   │       └── account-form.component.ts
│   ├── app.component.ts
│   ├── app.module.ts
│   └── app.routes.ts
├── styles.css
├── index.html
└── main.ts
```

## API Endpoints Used

### DummyJSON Todos API
- **Base URL**: `https://dummyjson.com/todos`
- **Features**: Pagination, filtering, CRUD operations
- **Usage**: Fetches paginated todo items with lazy loading

### Dog CEO API
- **Base URL**: `https://dog.ceo/api/breeds/image/random`
- **Features**: Random dog images, breed information
- **Usage**: Fetches 10 random dog images for gallery display

## Form Validation Rules

### Personal Information
- **First Name**: Required, minimum 2 characters
- **Last Name**: Required, minimum 2 characters
- **Email**: Required, valid email format
- **Phone**: Optional, valid phone number pattern

### Account Settings
- **Username**: Required, minimum 3 characters, alphanumeric and underscores only
- **Password**: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- **Confirm Password**: Required, must match password

### Preferences
- **Date of Birth**: Optional, cannot be in the future
- **Country**: Optional dropdown selection
- **Newsletter**: Optional checkbox

## Styling Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, transitions, and animations
- **Loading States**: Spinners and loading indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: Proper form labels and ARIA attributes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Running Tests
```bash
npm test
# or
ng test
```

### Code Linting
```bash
ng lint
```

## Deployment

The application can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist/` folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Use Angular CLI build and deploy
- **AWS S3**: Upload the `dist/` folder contents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support or questions, please open an issue in the repository or contact the development team.

