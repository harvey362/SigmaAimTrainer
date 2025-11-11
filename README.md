# Sigma Aim Trainer

A web-based aim training application that simulates Overwatch 2's Sigma hypersphere mechanics for personal skill development and practice.

## Features

- **Realistic Sigma Hypersphere Physics**: 50 m/s projectile speed, 22m range, bounce mechanics
- **Highly Customizable Difficulty**: Freeform modifier system instead of preset difficulty levels
- **Flexible Training Options**: Timed and untimed sessions with various target types
- **Performance Tracking**: Session history, lifetime stats, and personal best records
- **Clean, Distraction-Free Environment**: Aimlabs-inspired aesthetic focused on practice

## Core Mechanics

### Hypersphere Weapon
- Two-shot burst pattern (customizable)
- 50 meters/second projectile speed
- 22-meter maximum range (auto-implode)
- 3-meter splash radius (toggleable)
- Projectile bounce physics

### Target System
- Multiple target types: stationary bots, flying bots, size variants
- Customizable movement patterns: predictable, random, or both
- Adjustable spawn ranges and respawn behaviors
- Configurable target sizes and movement speeds

### Modifiers
- Attack speed adjustment
- Spheres per burst (2 or 3)
- Splash radius on/off
- Lives system with miss-based depletion
- Max targets on screen

## Project Structure

```
sigma-aim-trainer/
├── src/
│   ├── core/          # Game engine core (scene, renderer, game loop)
│   ├── physics/       # Projectile physics and collision detection
│   ├── targets/       # Target spawning and behavior
│   ├── ui/            # UI components and menus
│   ├── audio/         # Audio management
│   ├── types/         # TypeScript type definitions
│   └── main.ts        # Application entry point
├── public/
│   └── assets/        # Static assets (audio, models, textures)
├── index.html         # HTML entry point
└── package.json       # Dependencies and scripts
```

## Technology Stack

- **Three.js**: 3D graphics and rendering
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Web Audio API**: Sound effects and audio management

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server runs at `http://localhost:3000` with hot module replacement enabled.

## Controls

- **Mouse**: Aim and fire
- **ESC**: Pause menu
- **Spacebar**: Skip countdown

## Gameplay Flow

1. **Main Menu**: Select Play, Settings, or Stats/History
2. **Pre-Session Setup**: Configure session type, target settings, weapon modifiers, and challenge modifiers
3. **Session**: Practice with configured settings
4. **Post-Session Stats**: View performance metrics and compare to personal bests
5. **Quick Restart**: Restart with same settings or return to main menu

## Session Types

- **Untimed**: Infinite practice until manual stop
- **30 seconds**: Quick training session
- **1 minute**: Standard training session
- **Custom**: User-defined duration

## Stats Tracking

### Session Stats
- Accuracy percentage
- Total hits/misses
- Active modifiers
- Comparison to previous session and personal best

### Lifetime Stats
- Total shots fired
- Overall accuracy
- Total time played
- Personal best records
- Last 15 sessions history

## Development Roadmap

### Phase 1: Core Foundation
- [x] Project setup and structure
- [ ] Basic Three.js scene and camera controls
- [ ] Hypersphere projectile physics
- [ ] Hit detection system
- [ ] Basic target spawning

### Phase 2: Gameplay Systems
- [ ] Target movement and behavior
- [ ] Weapon mechanics (burst fire, splash damage)
- [ ] Lives system
- [ ] Session timer and game loop

### Phase 3: UI Implementation
- [ ] Main menu
- [ ] Pre-session setup screen
- [ ] In-game HUD
- [ ] Pause menu
- [ ] Post-session stats screen

### Phase 4: Data & Audio
- [ ] Stats persistence (localStorage)
- [ ] Session history tracking
- [ ] Audio system and sound effects
- [ ] Settings management

### Phase 5: Polish & Optimization
- [ ] Visual themes and customization
- [ ] Performance optimization
- [ ] Crosshair customization
- [ ] Final testing and bug fixes

## Technical Notes

- **Physics**: Custom projectile physics using Three.js Raycaster for hit detection
- **Performance**: Optimized for 60+ FPS with multiple targets and projectiles
- **Storage**: LocalStorage for settings and stats persistence (single user profile)
- **Responsiveness**: Fullscreen default with windowed mode support

## License

MIT License

## Credits

Inspired by Overwatch 2's Sigma character and Aimlabs' training approach.
