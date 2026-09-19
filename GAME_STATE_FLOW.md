# 🎮 Как Игра Передается с Сервера на Клиент

## 📊 Полный Процесс (Шаг за Шагом)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ФРОНТЕНД (React)                           │
│  GameBoard.jsx                                                  │
│                                                                 │
│  useEffect(() => {                                              │
│    socket.addListener((msg) => {                                │
│      if (msg.type === 'game_state') {                           │
│        gameStore.setGame(msg.game)  ← ПОЛУЧАЕМ ИГРУ ЗДЕСЬ       │
│      }                                                          │
│    })                                                           │
│  })                                                             │
│                                                                 │
│  ↑                    (WebSocket)                                │
│  │                    msg: { type: 'game_state', game: {...} }   │
│  │                                                              │
└──┼──────────────────────────────────────────────────────────────┘
   │
┌──┼──────────────────────────────────────────────────────────────┐
│  │                    БЭКЕНД (Node.js)                          │
│  │                    wsServer.js                               │
│  │                                                              │
│  └─→ onStartGame() или make_move() {                           │
│        const game = createInitialGame(gameId, playersCount)     │
│        games.set(gameId, game)  ← СОХРАНЯЕМ ИГРУ В MAP           │
│        broadcastGame(gameId)    ← ОТПРАВЛЯЕМ ВСЕ КЛИЕНТАМ       │
│      }                                                          │
│                                                                 │
│      broadcastGame(roomId) {                                    │
│        const game = games.get(roomId)                           │
│        for (const [ws, info] of clients.entries()) {            │
│          if (info.roomId === roomId) {                          │
│            send(ws, { type: 'game_state', game }) ← ОТПРАВЛЯЕМ  │
│          }                                                      │
│        }                                                        │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Проверка: Каждый Шаг Отладки

### 1. Клиент отправляет start_game
```javascript
// GameBoard.jsx (строка 105)
const onStartGame = () => {
    const rid = userStore?.roomId;
    socket.send({
        type: 'start_game',
        gameId: rid,
        playerId: currentPlayerId,
        initGame: gameStore.game ?? gameStore.initGame()
    });
};
```

**Проверка в консоли браузера:**
```javascript
// Перед отправкой
console.log('Отправляю start_game для roomId:', rid);
```

---

### 2. На Сервере: Игра Создается и Сохраняется
**Файл: wsServer.js, строка 260-295**

Проверьте логи сервера:
```bash
🎮 START_GAME: gameId=123, playerId=user1
👥 Игроков в комнате: 2
✅ Игра создана. Players: 0, Game ID: 123
💾 Игра сохранена в games Map для ID=123
✅ broadcastGame: отправлена игра 123 для 2 клиентов
```

**Если видите ошибку:**
```
❌ start_game: Комната 123 не найдена
```
→ Проверьте, что roomId совпадает на клиенте и сервере!

---

### 3. На Сервере: Игра Отправляется Клиентам
**Файл: wsServer.js, функция `broadcastGame()`, строка 99**

Логи подтвердят отправку:
```
✅ broadcastGame: отправлена игра 123 для 2 клиентов
```

**Если видите:**
```
⚠️ broadcastGame: game not found for roomId 123
```
→ Игра не была сохранена! Проверьте `games.set()`

---

### 4. На Клиенте: Получаем Сообщение
**Файл: GameBoard.jsx, useEffect, строка 67-72 (исправленный код)**

В консоли браузера должно быть:
```
msg from socket: {type: 'game_state', game: {...}}
```

**Если это не появляется:**
- Проверьте WebSocket соединение: DevTools → Network → WS → Messages
- Убедитесь, что слушатель зарегистрирован: логируйте `removeListener` вызов

---

### 5. На Клиенте: GameStore Обновляется
**Файл: GameBoard.jsx, строка 70**

```javascript
if (msg?.type === 'game_state' && msg.game && String(msg.game.id) === String(roomId)) {
    console.log('✅ GameStore.setGame() вызывается с игрой:', msg.game);
    gameStore.setGame(msg.game);  // ← MobX обновит поле game
}
```

Это должно вызвать перерендер GameBoard (т.к. компонент обернут в `observer`)

---

## 🧪 Чек-лист Отладки

### На Сервере (Node.js консоль)
- [ ] `🎮 START_GAME:` логируется?
- [ ] `👥 Игроков в комнате:` правильное число?
- [ ] `✅ Игра создана.` логируется?
- [ ] `💾 Игра сохранена` логируется?
- [ ] `✅ broadcastGame:` показывает кол-во клиентов > 0?

### На Клиенте (Browser DevTools)
- [ ] `msg from socket:` появляется в консоли?
- [ ] Объект game содержит: `id`, `players[]`, `tokens{}`, `nobles[]`?
- [ ] `GameStore.setGame()` вызывается?
- [ ] Компонент перерендерится (проверьте UI обновление)?

### WebSocket Messages (DevTools Network)
- [ ] Найдите вкладку WS в Network tab
- [ ] Найдите сообщение с `type: 'game_state'`
- [ ] Проверьте, что `game.id` совпадает с вашим `roomId`

---

## ⚠️ Типичные Проблемы и Решения

| Проблема | Причина | Решение |
|----------|--------|---------|
| `game_state` не приходит | Клиент не в `clients` Map | Убедитесь, что `join_game` выполнился успешно |
| `game is undefined` | Игра не сохранена в `games` Map | Проверьте `games.set()` был вызван |
| roomId не совпадает | Ошибка в преобразовании типов | Используйте `String(msg.game.id) === String(roomId)` |
| `removeListener()` не вызывается | Dependency array неправильный | Используйте `[userStore?.client, userStore?.roomId]` |
| GameStore обновляется, но UI не меняется | Компонент не обернут в `observer()` | Проверьте: `export default observer(GameBoard)` |

---

## 📝 Как Проверить в Реальном Коде

### 1. Добавьте в GameBoard.jsx:
```javascript
useEffect(() => {
    const socket = userStore?.client;
    const roomId = /* ... */;
    
    if (!socket || !roomId) {
        console.warn('❌ useEffect skipped: socket=' + !!socket + ', roomId=' + roomId);
        return undefined;
    }

    console.log('🔌 WebSocket listener registered for roomId:', roomId);

    const removeListener = socket.addListener((msg) => {
        console.log('📨 Received message:', msg.type, msg);
        
        if (msg?.type === 'game_state') {
            console.log('🎮 Game state received:', msg.game?.id, 'Players:', msg.game?.players?.length);
            
            if (msg.game && String(msg.game.id) === String(roomId)) {
                console.log('✅ Updating GameStore with game:', msg.game.id);
                gameStore.setGame(msg.game);
            }
        }
    });

    return () => {
        console.log('🧹 Cleaning up listener for roomId:', roomId);
        removeListener();
    };
}, [userStore?.client, userStore?.roomId]);
```

### 2. Смотрите консоль браузера при start_game:
```
🔌 WebSocket listener registered for roomId: 123
🎮 START_GAME: gameId=123, playerId=user1    ← Сервер логирует
✅ broadcastGame: отправлена игра 123 для 1 клиентов  ← Сервер отправил
📨 Received message: game_state {type: 'game_state', ...}  ← Клиент получил
🎮 Game state received: 123 Players: 0
✅ Updating GameStore with game: 123
```

Если видите `🧹 Cleaning up` БЕЗ `✅ Updating`, значит `roomId` не совпадает!

---

## 🎯 Результат

После всех исправлений:
1. ✅ Сервер логирует создание игры
2. ✅ Сервер логирует отправку игры клиентам
3. ✅ Клиент логирует получение сообщения `game_state`
4. ✅ GameStore обновляется
5. ✅ UI перерендерится с новой игрой

