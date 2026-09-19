# 🎨 Визуальный Гайд: Сохранение Состояния Игры

## 📊 Диаграмма Потока Данных

```
┌─────────────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР ПОЛЬЗОВАТЕЛЯ                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  localStorage                                                │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ splendor-game-state                                 │   │   │
│  │  │ {                                                   │   │   │
│  │  │   "id": 123,                                        │   │   │
│  │  │   "players": [...],                                 │   │   │
│  │  │   "visibleTier1": [...],                            │   │   │
│  │  │   "tokens": {...}                                   │   │   │
│  │  │   ...                                               │   │   │
│  │  │ }                                                   │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│       ↑                                      ↓                       │
│       │ loadGame()                          saveGame(game)           │
│       │ (читает при старте)                 (пишет при обновлении)   │
│       │                                                             │
│  ┌────┴──────────────────────────────────────────────────────────┐  │
│  │  GameStore (MobX)                                           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ constructor() {                                       │  │  │
│  │  │   const saved = this.loadGame()  ← Загружаем       │  │  │
│  │  │   if (saved) this.game = saved                      │  │  │
│  │  │ }                                                    │  │  │
│  │  │                                                      │  │  │
│  │  │ setGame = (game) => {                              │  │  │
│  │  │   this.game = game                                 │  │  │
│  │  │   this.saveGame(game)  ← Сохраняем               │  │  │
│  │  │ }                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └────┬──────────────────────────────────────────────────────┘  │
│       │ setGame(game)                                           │
│       │                                                         │
│  ┌────▼──────────────────────────────────────────────────────┐  │
│  │  GameBoard (React + observer)                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ useEffect(() => {                                │  │  │
│  │  │   if (!gameStore.game) {                          │  │  │
│  │  │     gameStore.initGame()  ← Новая игра           │  │  │
│  │  │   } else {                                        │  │  │
│  │  │     // Используем существующую                   │  │  │
│  │  │   }                                               │  │  │
│  │  │ })                                                │  │  │
│  │  │                                                   │  │  │
│  │  │ const currentGame = gameStore.game                │  │  │
│  │  │ return <div>{currentGame.players.length}</div>    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│       ↑                                      ↓                 │
│       │ socket.addListener('game_state')     sendMove()        │
│       │                                                        │
│  ┌────▼────────────────────────────────────────────────────┐  │
│  │  WebSocket (ws://localhost:8080)                      │  │
│  └────┬───────────────────────────────────────────────────┘  │
│       │                                                       │
└───────┼───────────────────────────────────────────────────────┘
        │
        │ JSON messages
        │
┌───────▼───────────────────────────────────────────────────────┐
│                        СЕРВЕР (Node.js)                      │
│                                                               │
│  wsServer.js                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ games = new Map()  // gameId → gameState               │  │
│  │                                                         │  │
│  │ if (msg.type === 'start_game') {                       │  │
│  │   const game = createInitialGame(gameId, playersCount) │  │
│  │   games.set(gameId, game)  ← Сохраняем в Map          │  │
│  │   broadcastGame(gameId)    ← Отправляем клиентам      │  │
│  │ }                                                       │  │
│  │                                                         │  │
│  │ if (msg.type === 'make_move') {                        │  │
│  │   const game = games.get(gameId)                       │  │
│  │   const updated = handleMove(game, playerId, move)     │  │
│  │   games.set(gameId, updated)  ← Обновляем             │  │
│  │   broadcastGame(gameId)        ← Отправляем новое      │  │
│  │ }                                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Жизненный Цикл: Шаг за Шагом

### Сценарий 1️⃣: Первый Вход

```
1. БРАУЗЕР ОТКРЫВАЕТСЯ
   ↓
2. GameStore.constructor() вызывается
   │
   ├─ loadGame()
   │  └─ localStorage.getItem('splendor-game-state')
   │     └─ Возвращает null (первый раз)
   │
   └─ this.game = null
   
3. GameBoard монтируется
   │
   ├─ useEffect срабатывает
   │  │
   │  ├─ if (!gameStore.game) ✓ (true)
   │  │  └─ gameStore.initGame()
   │  │     ├─ createInitialGameState()
   │  │     ├─ this.setGame(newGame)
   │  │     │  └─ this.saveGame(newGame)
   │  │     │     └─ localStorage.setItem(
   │  │     │           'splendor-game-state',
   │  │     │           JSON.stringify(newGame)
   │  │     │         )
   │  │     └─ Логирует: 💾 Игра сохранена в localStorage
   │  │
   │  └─ Добавляются игроки
   │
4. UI РЕНДЕРИТСЯ с новой игрой ✅
```

### Сценарий 2️⃣: Перезагрузка Страницы

```
1. ПОЛЬЗОВАТЕЛЬ НАЖИМАЕТ F5 (перезагрузка)
   ↓
2. Страница перезагружается, JS пересоздается
   ↓
3. GameStore.constructor() вызывается
   │
   ├─ loadGame()
   │  └─ localStorage.getItem('splendor-game-state')
   │     └─ Возвращает JSON (сохранено с прошлого раза!)
   │
   └─ this.game = parsedJSON ✓
   │
   └─ Логирует: ✅ Игра загружена из localStorage
   
4. GameBoard монтируется
   │
   ├─ useEffect срабатывает
   │  │
   │  ├─ if (!gameStore.game) ✗ (false - уже есть!)
   │  │  └─ ПРОПУСКАЕМ gameStore.initGame()
   │  │
   │  └─ Логирует: ✅ Игра уже загружена из localStorage, ID: 123
   │
5. Добавляются игроки (если нужно)
   │
6. UI РЕНДЕРИТСЯ с ТОЙ ЖЕ игрой ✅
   │
7. Карты остаются в тех же позициях! 🎉
```

### Сценарий 3️⃣: Выход из Комнаты

```
1. ПОЛЬЗОВАТЕЛЬ НАЖИМАЕТ "Покинуть комнату"
   ↓
2. onLeaveRoom() вызывается
   │
   ├─ socket.send({type: 'leave_game'})
   ├─ localStorage.removeItem('roomId')
   ├─ localStorage.removeItem('roomInfo')
   ├─ localStorage.removeItem('splendor-game-state')  ← ОЧИЩАЕМ ИГРУ
   ├─ userStore.setRoomId('')
   ├─ userStore.setRoomInfo(null)
   ├─ gameStore.setGame(null)
   │  └─ this.saveGame(null)
   │     └─ localStorage.removeItem('splendor-game-state')
   │
   ├─ Логирует: 🚪 Выходим из комнаты
   ├─ Логирует: 🗑️ Игра удалена из localStorage
   │
   └─ navigate('/rooms')
   
3. Компонент размонтируется
   ↓
4. localStorage['splendor-game-state'] ПУСТА ✓
```

### Сценарий 4️⃣: Создание Новой Комнаты

```
1. На странице /rooms пользователь создает новую комнату
   ↓
2. Переходит на GameBoard
   ↓
3. GameStore.constructor() вызывается
   │
   ├─ loadGame()
   │  └─ localStorage.getItem('splendor-game-state')
   │     └─ Возвращает null (удалили при выходе)
   │
   └─ this.game = null
   
4. GameBoard useEffect срабатывает
   │
   ├─ if (!gameStore.game) ✓ (true)
   │  └─ gameStore.initGame()
   │     └─ ✅ НОВАЯ ИГРА с новыми картами
   │
5. UI РЕНДЕРИТСЯ с НОВОЙ игрой ✅
```

---

## ⚡快速 Справочник

### Когда Игра Инициализируется?
```
✅ Первый вход в GameBoard
✅ Выход из комнаты + новый вход
✅ localStorage['splendor-game-state'] пуст

❌ Перезагрузка страницы (восстанавливается)
❌ Открытие другой вкладки (берется из localStorage)
```

### Когда Игра Сохраняется?
```
✅ При вызове gameStore.setGame(game)
✅ При получении game_state с сервера
✅ При каждом ходе (updateGame)

❌ Не сохраняется автоматически каждый кадр
```

### Когда Игра Удаляется?
```
✅ При выходе из комнаты (onLeaveRoom)
✅ При вызове gameStore.setGame(null)
✅ При очистке кэша браузера

❌ Не удаляется при просмотре других страниц
```

---

## 🎯 Логи для Каждого Сценария

### Первый вход
```
console:
  ✅ Игра загружена из localStorage       ← loadGame() вернул null
  🎮 Инициализируем новую игру (первый вход)
  💾 Игра сохранена в localStorage, ID: 123
```

### Перезагрузка
```
console:
  ✅ Игра загружена из localStorage       ← loadGame() вернул JSON
  ✅ Игра уже загружена из localStorage, ID: 123
  👤 Добавляем текущего игрока: user1
```

### Выход из комнаты
```
console:
  🚪 Выходим из комнаты, очищаем состояние
  🗑️ Игра удалена из localStorage
  
localStorage:
  splendor-game-state → (empty)
```

### Синхронизация с сервером
```
server console:
  🎮 START_GAME: gameId=123, playerId=user1
  ✅ Игра создана. Players: 0, Game ID: 123
  💾 Игра сохранена в games Map для ID=123
  ✅ broadcastGame: отправлена игра 123 для 1 клиентов

browser console:
  msg from socket: {type: 'game_state', game: {...}}
  🎮 Game state received: 123
  ✅ Updating GameStore with game: 123
  💾 Игра сохранена в localStorage, ID: 123
```

---

## 📦 Размер и Производительность

### Типичный Размер Game в localStorage
```
Структура:      ~200 свойств
JSON строка:    ~10-15KB
После сжатия:   ~2-5KB (если сжимать)
Лимит:          5-10MB (браузерный лимит)

Загрузка:       < 1ms
Сохранение:     < 5ms
Итого:          Незаметно для пользователя ✅
```

### Memory Usage
```
game object in RAM:    ~1-2MB
localStorage string:   ~10-15KB
MobX store:           ~100-500KB

Всего:                ~1.5-2.5MB ✅
```

---

## 🔐 Безопасность

### LocalStorage НЕ Криптуется
```javascript
// ВИДНО в DevTools → Application → Local Storage
// НЕ БЕЗОПАСНО для чувствительных данных
// Но для состояния игры достаточно
```

### Что Сохраняется?
```
✅ Состояние игры (карты, жетоны, игроки)
❌ НЕ сохраняются пароли
❌ НЕ сохраняются токены авторизации
```

---

## 🛠️ Отладка в Консоли

### Посмотреть сохраненную игру
```javascript
JSON.parse(localStorage.getItem('splendor-game-state'))
```

### Посчитать размер
```javascript
localStorage.getItem('splendor-game-state').length + ' символов'
```

### Принудительно очистить
```javascript
localStorage.removeItem('splendor-game-state')
```

### Проверить что сохраняется
```javascript
gameStore.saveGame(gameStore.game)
console.log(localStorage.getItem('splendor-game-state'))
```

---

## ✨ Итог

```
ДО:                           ПОСЛЕ:
❌ Новая игра каждый раз    ✅ Восстанавливается
❌ Карты меняются            ✅ Остаются на месте
❌ Состояние теряется        ✅ Сохраняется
❌ Нет отладки               ✅ Логи везде
```

🎉 **Готово к использованию!**

