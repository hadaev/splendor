import { makeAutoObservable } from "mobx";

class SplendorStore {
    // Общий банк камней
    bank = { diamond: 7, sapphire: 7, emerald: 7, ruby: 7, onyx: 7, gold: 5 };

    players = [
        { id: 1, gems: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 }, cards: [], score: 0 },
        { id: 2, gems: { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 }, cards: [], score: 0 },
    ];

    currentPlayerIndex = 0;

    constructor() {
        makeAutoObservable(this);
    }

    // Вычисляемое свойство: бонусы игрока от купленных карт
    get playerBonuses() {
        const player = this.players[this.currentPlayerIndex];
        return player.cards.reduce((acc, card) => {
            acc[card.type] = (acc[card.type] || 0) + 1;
            return acc;
        }, {});
    }

    // Экшен: взять 3 разных камня
    takeThreeGems(colors) {
        const player = this.players[this.currentPlayerIndex];
        colors.forEach(color => {
            if (this.bank[color] > 0) {
                this.bank[color]--;
                player.gems[color]++;
            }
        });
        this.nextTurn();
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
}

export const store = new SplendorStore();