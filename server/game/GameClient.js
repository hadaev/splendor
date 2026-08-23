export class GameClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.listeners = [];
        this.queue = [];
        this.isOpen = false;

        this.ws.onopen = () => {
            this.isOpen = true;

            // отправляем очередь
            this.queue.forEach((msg) => this.ws.send(msg));
            this.queue = [];
        };

        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            this.listeners.forEach((l) => l(msg));
        };

        this.ws.onclose = () => {
            console.warn("WebSocket closed");
        };

        this.ws.onerror = (err) => {
            console.error("WebSocket error", err);
        };
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    send(msg) {
        const json = JSON.stringify(msg);

        if (this.isOpen) {
            this.ws.send(json);
        } else {
            this.queue.push(json);
        }
    }
}