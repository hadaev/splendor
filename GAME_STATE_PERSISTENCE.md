# 💾 Сохранение Состояния Игры (Game State Persistence)

## 🎯 Что Было Проблемой

Раньше:
```
1. Открыли GameBoard
2. Игра инициализировалась через gameStore.initGame()
3. Перезагрузили страницу (F5)
4. Игра ПЕРЕИНИЦИАЛИЗИРОВАЛАСЬ → карты перемешались заново
5. Все данные об игре потеряны 😞
```

## ✅ Как Это Работает Теперь

```
1. Открыли GameBoard
   ↓
2. gameStore.constructor() загружает игру из localStorage (если была сохранена)
   ↓
3. Если игры нет, вызываем gameStore.initGame()
   ↓
4. gameStore.setGame() автоматически сохраняет в localStorage
   ↓
5. Перезагрузили страницу (F5)
   ↓
6. gameStore.constructor() загружает ту же игру из localStorage ✅
   ↓
7. Карты остаются те же самые!
```

## 🔄 Жизненный Цикл Сохранения

### GameStore.js
```javascript
class GameStore {
    constructor() {
        makeAutoObservable(this);
        // ✅ При создании store - загружаем сохраненную игру
        const savedGame = this.loadGame();
        if (savedGame) {
            this.game = savedGame;
            console.log('✅ Игра загружена из localStorage');
        }
    }

    loadGame() {
        // Читаем из localStorage
        const raw = localStorage.getItem('splendor-game-state');
        return raw ? JSON.parse(raw) : null;
    }

    saveGame = (game) => {
        // Записываем в localStorage
        if (!game) {
            localStorage.removeItem('splendor-game-state');
        } else {
            localStorage.setItem('splendor-game-state', JSON.stringify(game));
        }
    }

    setGame = (game) => {
        this.game = game;
        this.saveGame(game);  // ← АВТОМАТИЧЕСКИ СОХРАНЯЕТ!
    }
}
```

### GameBoard.jsx
```javascript
useEffect(() => {
    // Инициализируем игру ТОЛЬКО если её нет
    if (!gameStore.game) {
        gameStore.initGame();  // ← Создает новую
    }
    
    // Если была сохранена - используем её
    const game = gameStore.game;
    // ... добавляем игроков в существующую игру
}, [gameStore, userStore, navigate]);
```

## 📝 Где Сохраняется Состояние

В браузере: **DevTools → Application → Local Storage**

Ключ: `splendor-game-state`
Значение: JSON с полным состоянием игры

```json
{
    "id": 123,
    "players": [...],
    "visibleTier1": [...],
    "visibleTier2": [...],
    "visibleTier3": [...],
    "tokens": {...},
    "currentPlayerId": "user1",
    ...
}
```

## 🧪 Как Проверить

### Сценарий 1: Новая игра при первом входе
1. Откройте GameBoard
2. Смотрите консоль:
   ```
   🎮 Инициализируем новую игру (первый вход)
   💾 Игра сохранена в localStorage, ID: 123
   ```
3. Откройте DevTools → Local Storage → `splendor-game-state` содержит JSON

### Сценарий 2: Восстановление при перезагрузке
1. Откройте GameBoard
2. Отметьте ID игры и позицию карт
3. Нажмите F5 (перезагрузка)
4. Смотрите консоль:
   ```
   ✅ Игра загружена из localStorage
   ✅ Игра уже загружена из localStorage, ID: 123
   ```
5. Карты остались ТЕ ЖЕ ✅

### Сценарий 3: Выход из комнаты очищает состояние
1. В GameBoard нажмите "Покинуть комнату"
2. Смотрите консоль:
   ```
   🚪 Выходим из комнаты, очищаем состояние
   🗑️ Игра удалена из localStorage
   ```
3. Откройте DevTools → Local Storage → `splendor-game-state` пуста

## ⚠️ Когда Очищается Сохраненное Состояние

Состояние УДАЛЯЕТСЯ когда:
- ✅ Нажимаете "Покинуть комнату"
- ✅ Открываете другую комнату
- ✅ Очищаете кэш браузера
- ✅ Закрыли окно и открыли в режиме Inognito

Состояние СОХРАНЯЕТСЯ когда:
- ✅ Просто перезагружаете страницу (F5)
- ✅ Закрыли и открыли окно (если не режим Inognito)

## 🔌 Синхронизация с Сервером

**ВАЖНО:** Локальное состояние используется как "предпросмотр" до тех пор, пока:
1. Не придет `game_state` с сервера
2. `gameStore.setGame(msg.game)` обновит состояние из сервера
3. Новое состояние сохранится в localStorage

Последовательность:
```
1. Пользователь делает ход (локально обновляется)
2. Ход отправляется на сервер
3. Сервер валидирует и обновляет состояние
4. Сервер отправляет `game_state` обратно
5. Клиент получает истинное состояние и сохраняет в localStorage ✅
```

## 📚 API

### GameStore методы

```javascript
// Сохранить игру в localStorage
gameStore.saveGame(game);

// Загрузить игру из localStorage
const game = gameStore.loadGame();

// Установить текущую игру (автоматически сохраняет)
gameStore.setGame(game);

// Инициализировать новую игру
gameStore.initGame();

// Получить текущую игру
const game = gameStore.game;
```

## 🎯 Результат

Теперь:
1. ✅ Новая игра инициализируется один раз при первом входе
2. ✅ При перезагрузке страницы состояние восстанавливается
3. ✅ Карты остаются те же самые
4. ✅ Все данные об игре сохраняются и восстанавливаются
5. ✅ При выходе из комнаты состояние очищается

---

## 📊 Диаграмма Потока

```
┌─────────────────────────────────────────────────────────┐
│  БРАУЗЕР ОТКРЫВАЕТСЯ                                    │
│  ↓                                                      │
│  GameStore constructor()                                │
│  ├─ loadGame() читает localStorage                      │
│  ├─ Если есть сохраненная игра → загружаем             │
│  │  console.log('✅ Игра загружена из localStorage')   │
│  └─ Если нет → game = null                             │
│                                                         │
│  ↓                                                      │
│  GameBoard useEffect                                    │
│  ├─ Если gameStore.game === null                       │
│  │  ├─ Вызываем gameStore.initGame()                  │
│  │  └─ console.log('🎮 Инициализируем новую игру')    │
│  └─ Если gameStore.game уже есть                       │
│     └─ console.log('✅ Игра уже загружена...')         │
│                                                         │
│  ↓                                                      │
│  gameStore.setGame(game)                               │
│  ├─ Обновляет this.game                                │
│  └─ Вызывает saveGame()                                │
│     └─ localStorage.setItem('splendor-game-state', ...) │
│                                                         │
│  ↓                                                      │
│  GameBoard перерендерится (observer реагирует)         │
│                                                         │
│  ↓                                                      │
│  ПОЛЬЗОВАТЕЛЬ ПЕРЕЗАГРУЖАЕТ СТРАНИЦУ (F5)             │
│  ↓                                                      │
│  Весь процесс повторяется с loadGame() ✅              │
└─────────────────────────────────────────────────────────┘
```

## 💡 Pro Tips

### Как Вручную Очистить Сохраненную Игру

В консоли браузера:
```javascript
localStorage.removeItem('splendor-game-state');
// Теперь при перезагрузке будет новая игра
```

### Как Посмотреть Сохраненную Игру

В консоли браузера:
```javascript
JSON.parse(localStorage.getItem('splendor-game-state'));
// Выведет весь объект игры
```

### Как Вручную Сохранить Текущее Состояние

В консоли браузера:
```javascript
// Если нужно сохранить текущее состояние
localStorage.setItem('splendor-game-state', JSON.stringify(gameStore.game));
```

---

✅ **Готово!** Теперь состояние игры сохраняется и восстанавливается при перезагрузке страницы.

