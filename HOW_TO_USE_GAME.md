# 🚀 Как Использовать Полученную Game на Фронтенде

## Краткий Ответ

На фронтенде в `GameBoard.jsx` вы уже получаете game через WebSocket. Вот как это работает:

```javascript
// 1️⃣ Слушаем WebSocket сообщения
useEffect(() => {
    const socket = userStore?.client;
    const roomId = userStore?.roomId;
    
    if (!socket || !roomId) return;

    // Подписываемся на все сообщения
    const removeListener = socket.addListener((msg) => {
        // 2️⃣ Проверяем тип сообщения
        if (msg?.type === 'game_state' && msg.game) {
            // 3️⃣ Обновляем MobX store
            gameStore.setGame(msg.game);  // ← GAME ПОПАДАЕТ СЮДА
        }
    });

    return () => removeListener();
}, [userStore?.client, userStore?.roomId]);

// 4️⃣ Используем game в компоненте
const currentGame = gameStore.game;  // ← ВОТ ЗДЕСЬ ЕСТЬ ВСЯ ИНФОРМАЦИЯ ОБ ИГРЕ
```

## 📦 Структура Game Объекта

```javascript
{
    id: 123,                          // ID комнаты/игры
    
    // КАРТЫ
    visibleTier1: [{id, cost{}, bonus, points}, ...],  // 4 открытые карты уровня 1
    visibleTier2: [{...}, ...],       // 4 открытые карты уровня 2
    visibleTier3: [{...}, ...],       // 4 открытые карты уровня 3
    deck1: [{...}, ...],              // Оставшиеся карты уровня 1
    deck2: [{...}, ...],              // Оставшиеся карты уровня 2
    deck3: [{...}, ...],              // Оставшиеся карты уровня 3
    deck1Count: 44,                   // Кол-во карт в колоде 1
    deck2Count: 30,                   // Кол-во карт в колоде 2
    deck3Count: 20,                   // Кол-во карт в колоде 3
    
    // БЛАГОРОДНЫЕ
    nobles: [{id, cost{}, points}, ...],  // 3 открытых благородных
    deckNobles: 7,                        // Кол-во благородных в колоде
    
    // ЖЕТОНЫ
    tokens: {                         // Жетоны в банке
        diamond: 7,
        sapphire: 7,
        emerald: 7,
        ruby: 7,
        onyx: 7,
        gold: 5
    },
    
    // ИГРОКИ И ХОД
    players: [
        {
            id: 'user1',
            name: 'Alice',
            tokens: { diamond: 2, gold: 1, ... },
            bonuses: { diamond: 1, sapphire: 2, ... },  // Купленные карты
            purchasedCards: [{...}, ...],               // История купленных карт
            reservedCards: [{...}, ...],                // Зарезервированные карты
            claimedNobles: [{...}, ...],                // Купленные благородные
            points: 15
        },
        { ... }
    ],
    currentPlayerId: 'user1',         // Кто сейчас ходит
    status: 'running',                // 'waiting' или 'running'
    winnerId: null                    // Победитель (если игра закончена)
}
```

## 🎯 Примеры Использования

### Пример 1: Показать Открытые Карты Уровня 1

```javascript
const currentGame = gameStore.game;

currentGame?.visibleTier1.map(card => (
    <Card key={card.id} card={card} />
))
```

### Пример 2: Показать Жетоны в Банке

```javascript
// Все жетоны кроме золота
const coloredTokens = Object.entries(currentGame?.tokens || {})
    .filter(([color]) => color !== 'gold')
    .map(([color, count]) => (
        <Token key={color} color={color} count={count} />
    ));

// Золото отдельно
const goldCount = currentGame?.tokens?.gold || 0;
```

### Пример 3: Получить Текущего Игрока

```javascript
const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
const currentPlayerId = userStore?.playerId || savedUser?.id;

const currentPlayer = currentGame?.players.find(p => p.id === currentPlayerId);

console.log('Мои жетоны:', currentPlayer?.tokens);
console.log('Мои бонусы:', currentPlayer?.bonuses);
console.log('Мои очки:', currentPlayer?.points);
```

### Пример 4: Проверить, МОoriental ЛИ ХОД

```javascript
const isMyTurn = currentGame?.currentPlayerId === currentPlayerId;

if (isMyTurn) {
    console.log('Ваш ход!');
} else {
    console.log('Ход игрока:', currentGame?.players.find(p => p.id === currentGame?.currentPlayerId)?.name);
}
```

### Пример 5: Посчитать Оставшиеся Жетоны

```javascript
const totalTokens = Object.values(currentGame?.tokens || {})
    .reduce((sum, count) => sum + count, 0);
console.log('Всего жетонов в банке:', totalTokens);
```

### Пример 6: Найти Карту по ID

```javascript
const cardId = 'card_123';
const card = [
    ...(currentGame?.visibleTier1 || []),
    ...(currentGame?.visibleTier2 || []),
    ...(currentGame?.visibleTier3 || [])
].find(c => c.id === cardId);
```

### Пример 7: Проверить, Может ли Игрок Купить Карту

```javascript
const isAffordable = (card, player = currentPlayer) => {
    if (!card || !player) return false;
    
    let goldNeeded = 0;
    for (const [color, need] of Object.entries(card.cost || {})) {
        const bonus = player.bonuses?.[color] || 0;
        const owned = player.tokens?.[color] || 0;
        const payable = Math.max(0, need - bonus);
        if (owned >= payable) continue;
        goldNeeded += payable - owned;
    }
    
    return goldNeeded <= (player.tokens?.gold || 0);
};

const canBuy = isAffordable(card);
console.log('Можно купить карту?', canBuy);
```

### Пример 8: Получить Благородных, которых Может Купить Игрок

```javascript
const affordableNobles = (currentGame?.nobles || []).filter(noble => {
    for (const [color, need] of Object.entries(noble.cost || {})) {
        if ((currentPlayer?.bonuses?.[color] || 0) < need) {
            return false;
        }
    }
    return true;
});

console.log('Доступные благородные:', affordableNobles);
```

## 🔄 Жизненный Цикл Game Обновлений

```javascript
// 1️⃣ Игра приходит с сервера
socket.addListener((msg) => {
    if (msg.type === 'game_state') {
        gameStore.setGame(msg.game);  // ← MobX обновляет
    }
});

// 2️⃣ MobX реактивно обновляет компонент
// (потому что GameBoard обернут в observer())

// 3️⃣ Компонент перерендерится с новыми данными
const GameBoard = observer(() => {
    const { gameStore } = useContext(Context);
    const game = gameStore.game;  // ← Новое значение здесь
    
    // Компонент автоматически перерендерится
    return <div>{game?.players.length} игроков</div>;
});
```

## 🎮 Отправка Ходов с Использованием Game

После получения game можно делать ходы:

```javascript
const sendMove = (move) => {
    const rid = userStore?.roomId;
    const socket = userStore?.client;
    const currentPlayerId = userStore?.playerId;
    
    if (!socket || !rid || !currentPlayerId) return;
    
    socket.send({
        type: 'make_move',
        gameId: rid,
        playerId: currentPlayerId,
        move  // {type: 'take_tokens', tokens: {...}} или другие
    });
};

// Примеры ходов:
sendMove({ type: 'take_tokens', tokens: { diamond: 1, sapphire: 1, emerald: 1 } });
sendMove({ type: 'buy_card', cardId: 'card_123' });
sendMove({ type: 'reserve_card', cardId: 'card_456' });
sendMove({ type: 'buy_noble', nobleId: 'noble_789' });
```

## ⚠️ Типичные Ошибки

### ❌ Не обновляется UI
```javascript
// НЕПРАВИЛЬНО: компонент не обернут в observer()
function GameBoard() {
    const game = gameStore.game;
    return <div>{game?.players.length}</div>;
}
export default GameBoard;  // ← Забыли observer()
```

**Исправить:**
```javascript
export default observer(GameBoard);  // ✅ Правильно
```

### ❌ Game приходит пустой
```javascript
// Может быть, условие проверки неправильное?
if (msg?.type === 'game_state' && msg.game && 
    String(msg.game.id) === String(roomId)) {  // ← Проверьте roomId!
    gameStore.setGame(msg.game);
}
```

### ❌ Мутируем state напрямую
```javascript
// НЕПРАВИЛЬНО: мутируем вместо замены
const game = gameStore.game;
game.players[0].tokens.gold = 10;  // ← MobX не заметит изменение

// ПРАВИЛЬНО: создаем новый объект
gameStore.setGame({
    ...game,
    players: game.players.map((p, i) => 
        i === 0 ? { ...p, tokens: { ...p.tokens, gold: 10 } } : p
    )
});
```

## 🎁 Бонус: useGame() Hook

Чтобы не писать `const { gameStore } = useContext(Context)` каждый раз, создайте hook:

```javascript
// client/src/hooks/useGameStore.js
import { useContext } from 'react';
import { Context } from '../index';

export function useGameStore() {
    const { gameStore } = useContext(Context);
    return gameStore;
}

// Использование:
import { useGameStore } from '../hooks/useGameStore';

function GameBoard() {
    const gameStore = useGameStore();
    const game = gameStore.game;  // ← Меньше кода!
    
    return <div>{game?.id}</div>;
}
```

---

**Итого:** Game поступает на фронтенд через `socket.addListener()` → `gameStore.setGame()` → MobX обновляет компонент → UI перерендерится. Используйте `currentGame` для доступа ко всем данным об игре в компоненте!

