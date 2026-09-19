export class WebSocketClient {
    constructor({ onMessage, onOpen, onClose } = {}) {
        this.onMessage = onMessage;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.listeners = [];
        this.isManuallyClosed = false;

        this.ws = null;
        this.reconnectDelay = 500;
        this.maxDelay = 5000;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket("ws://localhost:8080");

        this.ws.onopen = () => {
            this.reconnectDelay = 500;
            this.onOpen && this.onOpen();
        };

        this.ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            this.onMessage && this.onMessage(msg);
            this.listeners.forEach((listener) => listener(msg));
        };

        this.ws.onclose = () => {
            this.onClose && this.onClose();

            if (this.isManuallyClosed) return;

            setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
                this.connect();
            }, this.reconnectDelay);
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    addListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((item) => item !== listener);
        };
    }

    close() {
        this.isManuallyClosed = true;
        this.ws.close();
    }
}
