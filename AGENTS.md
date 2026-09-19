# AGENTS.md - Splendor Online Codebase Guide

## Project Overview
Splendor Online is a real-time multiplayer card game implementation combining:
- **Frontend**: React 19 with MobX state management and React Router
- **Backend**: Node.js/Express with WebSocket server (two separate processes)
- **Database**: PostgreSQL with Sequelize ORM
- **Communication**: Dual HTTP (REST) + WebSocket protocols

The architecture intentionally separates HTTP server (`index.js:3000`) and WebSocket server (`wsServer.js:8080`) as independent processes spawned by `server.js`.

---

## Architecture & Critical Data Flows

### 1. Dual Server Architecture (Must Understand)
**Server Structure** (`server/server.js`):
- Spawns two child processes with `child_process.spawn()` that run simultaneously
- `index.js` → HTTP server (REST API for auth, room CRUD)
- `wsServer.js` → WebSocket server (real-time game state & moves)
- Both share PostgreSQL database; WS server syncs rooms on startup

**Why This Matters**: When debugging or adding features, changes may need to go to both processes. WS server maintains in-memory game state (`games` Map) separate from the HTTP database.

### 2. Game State Management (Three Layers)
1. **Database Layer** (`User`, `Room` models via Sequelize)
   - Users: `id`, `name`, `password`, `token`
   - Rooms: `id`, `name`, `roomToken` (bcrypt hash of name)
   - Located in: `server/models/models.js`

2. **In-Memory Game State** (`games` Map in `wsServer.js`)
   - Active game instances stored as: `games.get(roomId) → gameObject`
   - Structure: `{id, players[], currentPlayerId, visibleTier1/2/3[], deckTier1/2/3[], nobles[], tokens{}, status, winnerId}`
   - Expires when room is empty (not persisted to DB)

3. **Client State** (MobX stores)
   - `GameStore`: Current game instance, room info
   - `UserStore`: Authenticated user, authentication token
   - `SplendorStore`: Token pool, card management logic

### 3. Real-Time Communication Pattern
**Message-Based Protocol** (JSON over WebSocket):
```javascript
// Client sends:
{ type: 'make_move', gameId, playerId, move: { type: 'take_tokens', tokens: {...} } }

// Server broadcasts to room:
{ type: 'game_state', game: {...} }
```

**Key Message Types**:
- `auth` → Authenticate with server
- `list_rooms` / `rooms_list` → Room discovery
- `create_room` / `room_created` → Room creation
- `join_game` / `joined` → Player joins room
- `start_game` → Initialize game and create initial state
- `make_move` → Submit player action
- `game_state` → Broadcast updated game to all players
- `room_info` → Broadcast room state changes
- `leave_game` / `left` → Player disconnects

**Broadcast Pattern**: When a game move happens, `broadcastGame(roomId)` sends to all WebSocket clients in that room via `clients` Map lookup.

### 4. Game Logic Engine (Splendor Rules)
**Move Validation** in `server/game/engine.js`:
- `handleMove(game, playerId, move)` is the entry point for all actions
- Validates turn ownership (`game.currentPlayerId === playerId`)
- Routes to handlers: `handleTakeTokens`, `handleBuyCard`, `handleReserveCard`, `handleBuyNoble`
- **Critical Pattern**: All handlers return a NEW game object (immutable); never mutate directly
- After each move, `applyQualifyingNobles()` auto-completes noble purchases if player meets requirements

**Token Rules** (essential for validation):
- Player can take: 3 different colors OR 2 identical (only if 4+ tokens available)
- Player max 10 tokens total
- Gold token (wildcard) used to pay deficits

**Key Game Structures**:
- Cards: `{id, tier, color, cost{}, bonus[], points}`
- Nobles: `{id, cost{}, points}`
- Player: `{id, name, tokens{}, bonuses{}, purchasedCards[], reservedCards[], claimedNobles[], points}`

---

## Project-Specific Patterns

### 1. Room & Game Lifecycle
```
Database Room created → Player joins → Game starts → Moves happen → Room cleaned up
   (HTTP)              (WS connection)    (WS)         (WS)          (on last player leave)
```

**Room Object Structure**:
```javascript
{
  players: Map(playerId → playerName),
  status: 'waiting' | 'running',
  name: string,
  currentPlayerId: string,
  playerCount: number
}
```

### 2. MobX + React Context Pattern (Client)
- **No Redux**: Uses MobX with `makeAutoObservable()` for reactive updates
- Stores auto-trigger component re-renders when properties change
- Context injection at root (`Context` provider in `index.js`)
- Accessed via: `const { gameStore, userStore } = useContext(Context)`

### 3. WebSocket Auto-Reconnect
`WebSocketClient` (`client/src/ws/WebSocketClient.js`):
- Automatic reconnection with exponential backoff (500ms → 5000ms)
- Flag `isManuallyClosed` prevents reconnect on intentional close
- Listener pattern: `ws.addListener(callback)` returns unsubscribe function

### 4. Card Data Management
- Static card data in `server/data/pabblesData.json` and `client/src/game/pabblesData.json`
- Contains: `cardsLevel1`, `cardsLevel2`, `cardsLevel3`, `nobles`, `tokens`, `tokensByPlayers`
- Shuffled fresh on each game start (not re-used between games)

---

## Critical Development Workflows

### Starting the Application
**For full stack**:
```bash
cd server && npm install && npm start
# Terminal output: "WS server listening on ws://localhost:8080"
# HTTP server should also be running on port 3000
```

**For client only** (if server is running):
```bash
cd client && npm install && npm start
# React dev server runs on http://localhost:3000 with proxy to backend
```

### Database Setup (Must Do Before First Run)
```bash
# In server directory
npm install sequelize-cli  # if not installed

# Create database and run migrations
npx sequelize-cli db:migrate

# Seed with demo user
npx sequelize-cli db:seed:all
```

**Add New Migration**:
```bash
npx sequelize-cli migration:generate --name your-migration-name
# Edit migrations/TIMESTAMP-your-migration-name.js
npx sequelize-cli db:migrate
```

### Environment Setup
`server/.env` required variables:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=splendor
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_SSL=false  # or 'true' for production
```

---

## Integration Points & Message Flow Examples

### Example 1: Creating and Joining a Room
1. **Client** sends HTTP POST to `/rooms` with room name
2. **HTTP Server** creates Room in database, returns roomId
3. **Client** sends WS message: `{ type: 'join_game', gameId: roomId, playerId, playerName }`
4. **WS Server** adds player to in-memory room, broadcasts `rooms_list` to ALL connected clients
5. **All Clients** update their room list display

### Example 2: Making a Move
1. **Client** MobX action dispatches move
2. **Client** sends WS: `{ type: 'make_move', gameId, playerId, move }`
3. **WS Server** validates in `handleMove()`, returns updated game object
4. **WS Server** broadcasts `{ type: 'game_state', game }` to room players
5. **Client** receives, MobX GameStore updates, components re-render via observer pattern

### Example 3: Starting a Game
1. **Client** sends: `{ type: 'start_game', gameId, playerId, initGame }`
2. **WS Server** calls `createInitialGame(gameId, playersCount)` to generate:
   - Shuffled card decks (tier 1, 2, 3)
   - 4 visible cards per tier
   - 3 random nobles + rest in deck
   - Token pool (adjusted by player count)
   - Empty players array
3. **WS Server** stores in `games.set(gameId, game)` and broadcasts to room

---

## File Structure by Responsibility

### Server
- **`wsServer.js`**: Main event handler, room management, game broadcasts
- **`game/engine.js`**: All move logic, validation, state immutability
- **`game/state.js`**: Game/player object structure definitions
- **`services/gameService.js`**: Room CRUD logic, client tracking
- **`utils/userService.js`**: WebSocket message sending, authentication
- **`models/models.js`**: Sequelize schema definitions

### Client
- **`context/GameContext.jsx`, `context/AuthContext.jsx`**: React context setup
- **`store/GameStore.js`, `store/UserStore.js`**: MobX stores with game/auth logic
- **`ws/WebSocketClient.js`**: WebSocket connection management
- **`pages/gameBoard/GameBoard.jsx`**: Main game UI, move handling (898 lines, complex)
- **`components/`**: Reusable UI components (cards, tokens, player panels)
- **`services/GameService.js`**: HTTP API client calls

### Shared
- **`pabblesData.json`**: Static card/noble/token definitions (must match between client & server)

---

## Key Quirks & Important Details

1. **Immutability Pattern**: All game handlers must create new objects and arrays, never mutate. Example:
   ```javascript
   const newGame = { ...game };
   newGame.players = game.players.map(p => p.id === playerId ? newPlayer : p);
   return newGame;  // not: game.players.push(...); return game;
   ```

2. **Nobles Auto-Complete**: After certain moves (buy card, take tokens), `applyQualifyingNobles()` automatically grants nobles if player's bonuses match. Clients must be aware nobles can appear without explicit action.

3. **Turn Management**: `currentPlayerId` is calculated by `getNextPlayerId()` which cycles through `game.players` array. Not stored separately.

4. **Map Normalization**: Code has defensive `normalizeRoom()` function because rooms can be serialized to JSON and lose Map type. Always normalize before accessing `room.players`.

5. **Gold Token is Special**: It's a wildcard for paying deficits. Separate from colored gem tokens.

6. **Client-Server Desynchronization Risk**: 
   - Client-side MobX stores can diverge from server game state if WS messages are missed
   - No permanent move replay; only current state is broadcast
   - Consider adding state hash verification in production

---

## Common Debugging Patterns

**Game State Not Updating**:
- Check if GameStore is wrapped in `observer()` component
- Verify `setGame()` is called (MobX won't auto-trigger if you mutate directly)
- Check browser console for missing WS messages

**Move Validation Failures**:
- Look at `engine.js` error messages (throw Error with descriptive message)
- Client sees error in WS response: `{ type: 'error', message }`
- Common: `not_your_turn`, `cannot_afford`, `too_many_tokens`

**Room Sync Issues**:
- WS server syncs rooms from DB on startup only
- Check `syncRoomsFromDb()` in `wsServer.js` for DB connection errors
- In-memory `rooms` Map might be stale; force re-fetch with `list_rooms` message

**Database Migration Issues**:
- Sequelize looks for migrations in `server/migrations/` directory
- Use ISO timestamp format for filenames
- Check `.sequelizerc` config file location if exists

---

## Testing & Validation

**No formal test suite found** in project. Manual testing pattern:
1. Start server: `npm start` in `server/`
2. Start client: `npm start` in `client/`
3. Create two browser tabs, log in with different users
4. Create room, join, start game, make moves
5. Verify game state broadcasts correctly
6. Check browser DevTools → Network tab for WebSocket frames

**Critical Scenarios to Test**:
- Multi-player move validation (token overflow, affordability)
- Noble auto-completion after moves
- Reconnection after closing WebSocket
- Room cleanup when last player leaves
- Concurrent moves from multiple players (race condition potential)

---

## Performance Considerations

1. **In-Memory Game Limit**: All active games stored in `games` Map. Unbounded growth risk if games aren't cleaned up.
2. **WebSocket Broadcasting**: O(N) clients in room. Optimize by sending deltas instead of full state for large games.
3. **Card Shuffle Algorithm**: Uses `Math.random().sort()` which is not cryptographically secure; fine for gameplay, not for randomness verification.
4. **Database Queries**: No pagination on `Room.findAll()`. Could be slow with many rooms.

---

## Extension Points for AI Agents

When adding features:
1. **New Move Type**: Add case to `handleMove()` switch, implement handler in `engine.js`
2. **New Message Type**: Add handler in `wsServer.js` message event
3. **New UI Component**: Follow MobX observer pattern in `pages/` or `components/`
4. **Database Schema Change**: Generate migration with `sequelize-cli`, update `models.js`
5. **Game Rule Addition**: Modify player object structure in `state.js`, update handlers in `engine.js`, broadcast with new schema

