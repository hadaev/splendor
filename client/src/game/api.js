export class GameClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.listeners = new Set();   // исправлено
        this.queue = [];
        this.isOpen = false;

        this.ws.onopen = () => {
            this.isOpen = true;

            // отправляем всё, что накопилось
            this.queue.forEach((msg) => this.ws.send(msg));
            this.queue = [];
        };

        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            for (const fn of this.listeners) {
                fn(msg);
            }
        };
    }

    addListener(fn) {
        this.listeners.add(fn);
    }

    removeListener(fn) {
        this.listeners.delete(fn);
    }

    send(msg) {
        const json = JSON.stringify(msg);

        if (this.isOpen) {
            this.ws.send(json);
        } else {
            // соединение ещё не готово — ставим в очередь
            this.queue.push(json);
        }
    }
}