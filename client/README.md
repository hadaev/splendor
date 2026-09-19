# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

splendor-online/
package.json
client/
package.json
src/
index.jsx
App.jsx
components/
GameBoard.jsx
CardRow.jsx
TokenPool.jsx
PlayerPanel.jsx
game/
api.js        // работа с WebSocket
state.js      // клиентский стейт (если надо)
types.js      // НЕ типы TS, а просто константы/хелперы

server/
package.json
src/
index.js       // запуск сервера
wsServer.js    // WebSocket-сервер
game/
engine.js    // логика ходов
state.js     // структура и операции со state
data.js      // стартовые карты, nobles, токены
roomManager.js

~~• 	🎨 красивый дизайн (цвета, тени, анимации)~~
• 	🎴 полноценные карточки Splendor в стиле оригинала
• 	🧩 drag‑and‑drop для жетонов
• 	📱 адаптивную версию
• 	🎬 анимации покупки карт и перехода хода
~~- Привести NoblesRow и TokenPool к такому же “полированному” виду.~~
- Добавить подсветку доступных действий (например, если не твой ход — дизейблим кнопки/жетоны).
- Сделать простую адаптивность (чтобы на меньшем экране оно не разваливалось).
~~- Подсветка доступных действий (если не твой ход — всё дизейблится).~~
- Красивые карточки Splendor (как в оригинале — с фоном, иконками, цветами).
- Адаптивность (чтобы всё красиво складывалось на ноутбуке/планшете).
- Анимации (взятие жетонов, покупка карты, переход хода).

1. 🔔 Подсказку “Ожидайте хода соперника”
   Полупрозрачный оверлей поверх стола.
2. ✨ Подсветку доступных действий
   Например, если можно взять только 3 разных жетона — подсвечивать только доступные.
3. 🎬 Анимацию перехода хода
   Мягкая вспышка или подсветка активного игрока.
4. 🧠 Валидацию на клиенте
   Чтобы игрок видел, что ход невозможен ещё до отправки на сервер.
   Что выбираем следующим шагом?

~~1. ~~~~Фоновое изображение (арт карты)~~
~~- либо абстрактный фон,~~
- ~~либо стилизованный рисунок,~~
~~- либо твои собственные арты~~.~~~~
~~2. Иконки камней вместо текста
   Могу нарисовать SVG‑иконки под каждый камень.~~
~~3. Редкие карты (Tier 2, Tier 3)
   У них другой стиль рамки и фона.~~
4. Анимации покупки карты
   Плавное исчезновение, перелёт в панель игрока.
5. Полный набор карт Splendor
   Сгенерировать JSON с 90 картами.
1. Текстуру холста (эффект рисованной поверхности)
   CSS‑noise + grain.
2. Световые блики (как на лакированных картах)
   Градиенты + маски.
3. Анимацию при наведении
   Лёгкий наклон, подсветка рамки.
4. ~~SVG‑иконки камней вместо цветных кружков
   Очень сильно улучшает стиль.~~
5. Фоны для разных типов карт
   Например, карты с очками — более «дорогие».

🚀 Хочешь — могу сгенерировать:
✔ Полный набор благородных (nobles.json)
✔ Полный набор жетонов (tokens.json)
✔ Полный набор оригинальных карт Splendor (но в переработанном виде, без копирования оригинала)
✔ Скрипт для перемешивания и раздачи карт по уровням
✔ Генератор карт (CLI), чтобы ты мог сам создавать новые карты

• 	добавить автоматическое переподключение WebSocket,
• 	сделать пинг/понг, чтобы сервер не отваливался,
• 	сделать очередь с retry, как в реальных играх,
~~• 	или перейти к следующему шагу — выбор комнаты / лобби.~~

⭐ количество игроков в каждой комнате
⭐ статус комнаты (ожидание / игра идёт)
⭐ кнопку «Начать игру»
⭐ авто‑обновление списка комнат
⭐ аватарки игроков в лобби
⭐ чат комнаты
