# Cricket Bidder 🏏

A modern cricket player auction platform built with Next.js, Express, MongoDB, and Turbo monorepo.

## 🚀 Features

- **Live Auctions**: Real-time bidding on cricket players
- **Team Management**: Build and manage your cricket team
- **Budget Control**: Manage auction budgets wisely
- **Player Statistics**: Detailed player stats and performance metrics
- **Modern UI**: Beautiful interface built with NextUI and HeroUI components
- **Real-time Updates**: Live auction updates and notifications

## 🏗️ Architecture

This project uses a **monorepo structure** with Turbo for efficient build management:

```
cricket-bidder/
├── apps/
│   ├── api/          # Express.js + MongoDB backend (MVC pattern)
│   └── web/          # Next.js frontend with NextUI components
├── packages/
│   └── shared/       # Shared types and utilities
└── package.json      # Root package.json with Turbo configuration
```

## 🛠️ Tech Stack

### Backend (API)
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend (Web)
- **Next.js 14** - React framework with App Router
- **NextUI** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Framer Motion** - Animations

### Development Tools
- **Turbo** - Monorepo build system
- **pnpm** - Fast package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cricket-bidder
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp apps/api/env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   
   # Edit the files with your configuration
   ```

4. **Start MongoDB** (make sure MongoDB is running locally or update the connection string)

5. **Run the development servers**
   ```bash
   # Start both API and Web servers
   pnpm dev
   
   # Or start individually
   pnpm --filter @cricket-bidder/api dev
   pnpm --filter @cricket-bidder/web dev
   ```

## 🚀 Development

### Available Scripts

```bash
# Root level commands
pnpm dev          # Start all development servers
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm clean        # Clean all build artifacts

# Individual package commands
pnpm --filter @cricket-bidder/api dev     # Start API server
pnpm --filter @cricket-bidder/web dev     # Start Web server
pnpm --filter @cricket-bidder/shared build # Build shared package
```

### Project Structure

#### API Backend (`apps/api/`)
```
src/
├── config/         # Database and app configuration
├── controllers/    # Request handlers (MVC)
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── utils/          # Utility functions
└── index.ts        # Server entry point
```

#### Web Frontend (`apps/web/`)
```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── store/         # State management
└── types/         # TypeScript type definitions
```

#### Shared Package (`packages/shared/`)
```
src/
└── index.ts       # Shared types and utilities
```

## 🔧 Configuration

### Environment Variables

#### API (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cricket_bidder
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

#### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📱 Usage

1. **Register/Login**: Create an account or login to access the platform
2. **Join Auctions**: Browse available auctions and join the ones you're interested in
3. **Bid on Players**: Place bids on players during live auctions
4. **Manage Team**: Build your team with the players you've won
5. **Track Performance**: Monitor your team's performance and budget

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Run tests for specific package
pnpm --filter @cricket-bidder/api test
pnpm --filter @cricket-bidder/web test
```

## 📦 Deployment

### API Deployment
```bash
# Build the API
pnpm --filter @cricket-bidder/api build

# Start production server
pnpm --filter @cricket-bidder/api start
```

### Web Deployment
```bash
# Build the web app
pnpm --filter @cricket-bidder/web build

# Start production server
pnpm --filter @cricket-bidder/web start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

**Happy Bidding! 🏏⚡** 