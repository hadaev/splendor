import React, {useContext, useEffect, useState} from "react";
import "./gameBoard.css";
import {useNavigate} from "react-router-dom";

import NobleRow from "../../components/nobleRow/NobleRow";
import {Context} from "../../index";
import TokenPool from "../../components/tokenPool/TokenPool";
import PlayerPanel from "../../components/playerPanel/PlayerPanel";
import DeckStack from "../../components/deckStack/DeckStack";
import CardRow from "../../components/cardRow/CardRow";
import {observer} from 'mobx-react-lite';

function GameBoard() {
    const {gameStore, userStore} = useContext(Context);
    const navigate = useNavigate();

    const [waitingLocal, setWaitingLocal] = useState(false);

    const startInit = () => {
        if (waitingLocal) return;
        const socket = userStore?.client;
        const rid = userStore?.roomId || userStore?.roomInfo?.roomId || JSON.parse(localStorage.getItem('roomInfo') || 'null')?.roomId || localStorage.getItem('roomId');
        setWaitingLocal(true);
        const promise = gameStore.initGame(socket, rid);
        promise.finally(() => {
            setWaitingLocal(false);
        });
    };

    useEffect(() => {
        let storedUser = null;
        try {
            storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (e) {
            storedUser = null;
        }

        const currentUser = (userStore?.user?.id && userStore?.user?.name) ? userStore.user : storedUser;
        if (!currentUser || !currentUser.id || !currentUser.name) {
            navigate('/login', {replace: true, state: {from: '/game-board'}});
            return;
        }

        // ✅ Инициализируем игру ТОЛЬКО если её ещё нет (при первом входе)
        // При перезагрузке страницы она загружается из localStorage в конструкторе GameStore
        const roomId = userStore?.roomId || userStore?.roomInfo?.roomId || JSON.parse(localStorage.getItem('roomInfo') || 'null')?.roomId || localStorage.getItem('roomId');
        const hasCurrentRoomGame = gameStore.game && String(gameStore.game.id) === String(roomId);
        if (!hasCurrentRoomGame) {
            if (gameStore.game) gameStore.setGame(null);
            console.log('🎮 Запрашиваем начальное состояние игры у сервера (первый вход)');
            startInit();
        }

    }, [userStore?.roomInfo?.players, navigate, gameStore.game?.id]);

    useEffect(() => {
        const socket = userStore?.client;
        const roomId = userStore?.roomId || userStore?.roomInfo?.roomId || JSON.parse(localStorage.getItem('roomInfo') || 'null')?.roomId || localStorage.getItem('roomId');

        // ✅ Главное: регистрируем cleanup function ВСЕГДА, даже если socket/roomId отсутствуют
        if (!socket || !roomId) {
            console.log('useEffect skipped: socket or roomId missing', { socket: !!socket, roomId });
            return undefined; // Нет cleanup функции нужно — ничего не добавляли
        }

        console.log('WebSocket listener registered for roomId:', roomId);

        // ✅ Добавляем слушателя
        const removeListener = socket.addListener((msg) => {
            console.log('msg from socket:', msg);
            if (msg?.type === 'game_state' && msg.game && String(msg.game.id) === String(roomId)) {
                gameStore.setGame(msg.game);
            }
        });

        // ✅ Cleanup function ГАРАНТИРУЕТ вызов removeListener
        return () => {
            console.log('WebSocket listener cleanup for roomId:', roomId);
            removeListener(); // Вызываем функцию, которую вернул addListener
        };
    }, [userStore?.client, userStore?.roomId]); // ✅ Минимальный, стабильный dependency array

    const currentGame = gameStore.game;
    const storedRoomInfo = JSON.parse(localStorage.getItem('roomInfo') || 'null');
    const storedRoomId = localStorage.getItem('roomId');
    const roomTitle = (
        gameStore.room?.name ||
        userStore?.roomInfo?.name ||
        storedRoomInfo?.name ||
        (userStore?.roomInfo?.roomId ? `Комната #${userStore.roomInfo.roomId}` : null) ||
        (storedRoomInfo?.roomId ? `Комната #${storedRoomInfo.roomId}` : null) ||
        (storedRoomId ? `Комната #${storedRoomId}` : 'Комната')
    );
    console.log('currentGame===', currentGame);
    const roomStatus = userStore?.roomInfo?.status || storedRoomInfo?.status || null;
    const [selectedTokens, setSelectedTokens] = useState({});
    const [tokenTakeMode, setTokenTakeMode] = useState('three');
    const [firstTurnSelection, setFirstTurnSelection] = useState({});
    const [firstTurnMode, setFirstTurnMode] = useState('three');
    const [showTakeConfirm, setShowTakeConfirm] = useState(false);
    const [takeConfirmData, setTakeConfirmData] = useState({
        type: null,
        tokens: {},
        color: null,
        cardId: null,
        cardLabel: ''
    });
    const [selectedReserveCardId, setSelectedReserveCardId] = useState(null);
    const [selectedBuyCardId, setSelectedBuyCardId] = useState(null);
    const [selectedNobleId, setSelectedNobleId] = useState(null);

    const onStartGame = () => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentPlayerId = userStore?.playerId || savedUser?.id;
        const rid = userStore?.roomId || userStore?.roomInfo?.roomId || storedRoomInfo?.roomId || storedRoomId;
        const socket = userStore?.client;
        if (!socket || !rid || !currentPlayerId) return;
        socket.send({
            type: 'start_game',
            gameId: rid,
            playerId: currentPlayerId
        });
    };
    console.log('currentGame', currentGame);
    if (!currentGame) {
        const isWaiting = waitingLocal || gameStore.waitingForServerGame;
        return (
            <div style={{padding: 24, color: '#fff', textAlign: 'center'}}>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
                    <div className="room-title">{roomTitle}</div>
                    <div style={{color: '#dce2ff'}}>
                        {isWaiting ? 'Получаем состояние игры с сервера...' : 'Ожидание начала игры'}
                    </div>
                    <div style={{display: 'flex', gap: 8}}>
                        {roomStatus === 'waiting' && <button className="start-button" onClick={onStartGame}>Начать игру</button>}
                        <button className="start-button" onClick={startInit} disabled={isWaiting}>Обновить</button>
                        <button className="leave-button" onClick={() => {
                            localStorage.removeItem('splendor-game-state');
                            gameStore.setGame(null);
                            navigate('/rooms');
                        }}>Выйти</button>
                    </div>
                </div>
            </div>
        );
    }

    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentPlayerId = userStore?.playerId || savedUser?.id;
    const player = currentGame.players.find(
        (item) => String(item.id) === String(currentPlayerId)
    );
    const activePlayer = currentGame.players.find(
        (item) => String(item.id) === String(currentGame.currentPlayerId)
    );
    const isMyTurn = Boolean(activePlayer) && String(activePlayer.id) === String(currentPlayerId);

    const isFirstTurn = player && (Object.values(player.tokens || {}).reduce((a, b) => a + (b || 0), 0) === 0) && (player.purchasedCards || []).length === 0 && (player.reservedCards || []).length === 0 && currentGame.currentPlayerId === currentPlayerId;


    const sendMove = (move) => {
        const rid = userStore?.roomId || userStore?.roomInfo?.roomId || JSON.parse(localStorage.getItem('roomInfo') || 'null')?.roomId || localStorage.getItem('roomId');
        const socket = userStore?.client;
        if (!socket || !rid || !currentPlayerId) return;
        socket.send({type: 'make_move', gameId: rid, playerId: currentPlayerId, move});
        // keep preview until server syncs the real game state
    };

    // Game state is only committed from a server `game_state` message.
    const commitLocalPreview = () => {};

    const handleFirstTurnSelection = (color) => {
        if (!currentGame || !currentGame.tokens || color === 'gold') return;
        if ((currentGame.tokens[color] || 0) <= 0) return;

        setFirstTurnSelection((prev) => {
            const next = {...prev};
            if (next[color]) {
                delete next[color];
                return next;
            }
            if (Object.keys(next).length >= 3) {
                return next;
            }
            next[color] = 1;
            return next;
        });
    };

    const canConfirmThreeColors = Object.keys(firstTurnSelection).length === 3 &&
        Object.values(firstTurnSelection).every(value => value === 1);

    const confirmFirstTurnTakeThree = () => {
        if (!canConfirmThreeColors) return;

        const payload = firstTurnSelection;
        const prev = gameStore.game;
        if (prev) {
            const nextPlayers = prev.players.map((p) => {
                if (p.id !== currentPlayerId) return p;
                const nextTokens = {...p.tokens};
                Object.entries(payload).forEach(([color, amount]) => {
                    nextTokens[color] = (nextTokens[color] || 0) + Number(amount || 0);
                });
                return {...p, tokens: nextTokens};
            });
            const nextTokens = {...prev.tokens};
            Object.entries(payload).forEach(([color, amount]) => {
                nextTokens[color] = (nextTokens[color] || 0) - Number(amount || 0);
            });
            commitLocalPreview({...prev, players: nextPlayers, tokens: nextTokens});
        }

        sendMove({type: 'take_tokens', tokens: payload});
        setFirstTurnSelection({});
        setFirstTurnMode('three');
    };

    const onTakeTwoSame = () => {
        const color = Object.keys(currentGame.tokens).find(c => c !== 'gold' && currentGame.tokens[c] >= 4);
        if (!color) return;
        const payload = {[color]: 2};
        setTakeConfirmData({type: 'double', tokens: payload, color});
        setShowTakeConfirm(true);
    };

    const reserveableCards = [
        ...(currentGame?.openCards1 || []),
        ...(currentGame?.openCards2 || []),
        ...(currentGame?.openCards3 || [])
    ];

    const isCardAffordable = (card, currentPlayer = player) => {
        if (!card || !currentPlayer) return false;

        let goldNeeded = 0;
        for (const [color, need] of Object.entries(card.cost || {})) {
            const bonus = currentPlayer.bonuses?.[color] || 0;
            const owned = currentPlayer.tokens?.[color] || 0;
            const payable = Math.max(0, need - bonus);
            if (owned >= payable) continue;
            goldNeeded += payable - owned;
        }

        return goldNeeded <= ((currentPlayer.tokens?.gold || 0));
    };

    const canReserveCard = (currentPlayer = player) => {
        if (!currentPlayer) return false;
        return (currentPlayer.reservedCards || []).length < 3;
    };

    const handleReserveChoice = (card) => {
        if (!card) return;

        if (!canReserveCard()) {
            setSelectedReserveCardId(null);
            setSelectedBuyCardId(null);
            setTakeConfirmData({
                type: 'reserve_blocked',
                tokens: {},
                color: null,
                cardId: card.id,
                cardLabel: `#${card.id}`
            });
            setShowTakeConfirm(true);
            return;
        }

        const affordable = isCardAffordable(card);
        setSelectedReserveCardId(card.id);
        setSelectedBuyCardId(null);
        setTakeConfirmData({
            type: 'reserve',
            tokens: {gold: 1},
            color: null,
            cardId: card.id,
            cardLabel: `#${card.id}`,
            canBuy: affordable
        });
        setShowTakeConfirm(true);
    };

    const handleBuyChoice = (card) => {
        if (!card) return;

        const affordable = isCardAffordable(card);
        setSelectedReserveCardId(null);
        setSelectedBuyCardId(card.id);
        setSelectedNobleId(null);

        setTakeConfirmData({
            type: affordable ? 'buy' : 'buy_blocked',
            tokens: {},
            color: null,
            cardId: card.id,
            cardLabel: `#${card.id}`
        });
        setShowTakeConfirm(true);
    };

    const isNobleAffordable = (noble, currentPlayer = player) => {
        if (!noble || !currentPlayer) return false;

        for (const [color, need] of Object.entries(noble.cost || {})) {
            if ((currentPlayer.bonuses?.[color] || 0) < need) {
                return false;
            }
        }

        return true;
    };

    const handleNobleChoice = (noble) => {
        if (!noble) return;

        const affordable = isNobleAffordable(noble);
        setSelectedReserveCardId(null);
        setSelectedBuyCardId(null);
        setSelectedNobleId(noble.id);

        setTakeConfirmData({
            type: affordable ? 'buy_noble' : 'noble_blocked',
            tokens: {},
            color: null,
            cardId: noble.id,
            cardLabel: `#${noble.id}`
        });
        setShowTakeConfirm(true);
    };

    const handleCardSelection = (card) => {
        if (!card) return;

        if (firstTurnMode === 'buy') {
            handleBuyChoice(card);
            return;
        }

        handleReserveChoice(card);
    };

    const onTokenClick = (color) => {
        if (!currentGame || !player || showTakeConfirm) return;
        if (color === 'gold') {
            setTakeConfirmData({
                type: 'gold_locked',
                tokens: {},
                color: null,
                cardId: null,
                cardLabel: 'Золото'
            });
            setShowTakeConfirm(true);
            return;
        }

        const bankCount = currentGame.tokens[color] || 0;
        const sel = {...selectedTokens};

        if (tokenTakeMode === 'double') {
            if (bankCount < 4) return;
            const payload = {[color]: 2};
            setSelectedTokens(payload);
            setTakeConfirmData({type: 'double', tokens: payload, color, cardId: null, cardLabel: ''});
            setShowTakeConfirm(true);
            return;
        }

        // if color not selected yet
        if (!sel[color]) {
            const distinct = Object.keys(sel).length;
            if (distinct >= 3) return;
            sel[color] = 1;
            if (Object.keys(sel).length === 3) {
                setSelectedTokens(sel);
                setTakeConfirmData({type: 'three', tokens: sel, color: null, cardId: null, cardLabel: ''});
                setShowTakeConfirm(true);
                return;
            }
            setSelectedTokens(sel);
            return;
        }

        if (sel[color] === 1) {
            delete sel[color];
            setSelectedTokens(sel);
            return;
        }
    };

    const confirmReserveCard = (cardId) => {
        const prev = gameStore.game;
        if (prev) {
            const nextPlayers = prev.players.map((p) => {
                if (p.id !== currentPlayerId) return p;
                const nextTokens = {...(p.tokens || {})};
                nextTokens.gold = (nextTokens.gold || 0) + 1;
                const nextReserved = [...(p.reservedCards || [])];
                const card = [
                    ...(prev.openCards1 || []),
                    ...(prev.openCards2 || []),
                    ...(prev.openCards3 || [])
                ].find(item => item.id === cardId);
                if (card) {
                    nextReserved.push(card);
                }
                return {...p, tokens: nextTokens, reservedCards: nextReserved};
            });

            const nextTokens = {...(prev.tokens || {})};
            nextTokens.gold = (nextTokens.gold || 0) - 1;

            const nextState = refillOpenCardFromDeck(cardId, {
                ...prev,
                players: nextPlayers,
                tokens: nextTokens,
            });

            commitLocalPreview(nextState);
        }

        sendMove({type: 'reserve_card', cardId});
        setSelectedTokens({});
        setFirstTurnSelection({});
        setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
        setShowTakeConfirm(false);
    };

    const confirmBuyNoble = (nobleId) => {
        const prev = gameStore.game;
        if (prev && nobleId) {
            const noble = (prev.nobles || []).find(item => item.id === nobleId);
            if (!noble) return;

            const nextPlayers = prev.players.map((p) => {
                if (p.id !== currentPlayerId) return p;

                const claimedNobles = [...(p.claimedNobles || [])];
                claimedNobles.push(noble);

                return {
                    ...p,
                    points: (p.points || 0) + (noble.points || 0),
                    claimedNobles
                };
            });

            const remainingNobles = (prev.nobles || []).filter(item => item.id !== nobleId);
            const nextDeckNobles = [...(prev.deckNobles || [])];
            const nextNobles = [...remainingNobles];
            if (nextDeckNobles.length > 0 && nextNobles.length < 3) {
                nextNobles.push(nextDeckNobles[0]);
                nextDeckNobles.shift();
            }

            commitLocalPreview({
                ...prev,
                players: nextPlayers,
                nobles: nextNobles,
                deckNobles: nextDeckNobles
            });
        }

        sendMove({type: 'buy_noble', nobleId});
        setSelectedTokens({});
        setFirstTurnSelection({});
        setSelectedNobleId(null);
        setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
        setShowTakeConfirm(false);
    };

    const refillOpenCard = (state, cardId) => {
        const targetTier = [1, 2, 3].find((tier) => {
            const openKey = `openCards${tier}`;
            return (state?.[openKey] || []).some((card) => card.id === cardId);
        });

        if (!targetTier) return state;

        const openKey = `openCards${targetTier}`;
        const deckKey = `deck${targetTier}`;
        const countKey = `deck${targetTier}Count`;

        const openCards = [...(state[openKey] || [])];
        const deckCards = [...(state[deckKey] || [])];

        if (!openCards.some((card) => card.id === cardId)) {
            return state;
        }

        const remainingCards = openCards.filter((card) => card.id !== cardId);
        const replacementCard = deckCards[0];
        const nextOpenCards = replacementCard ? [...remainingCards, replacementCard] : remainingCards;

        return {
            ...state,
            [openKey]: nextOpenCards,
            [deckKey]: replacementCard ? deckCards.slice(1) : deckCards,
            [countKey]: replacementCard ? Math.max(0, deckCards.length - 1) : deckCards.length,
        };
    };

    const refillOpenCardFromDeck = (cardId, state) => refillOpenCard(state, cardId);

    const confirmBuyCard = (cardId) => {
        const prev = gameStore.game;
        if (prev && cardId) {
            const card = [
                ...(prev.openCards1 || []),
                ...(prev.openCards2 || []),
                ...(prev.openCards3 || []),
                ...(player?.reservedCards || [])
            ].find(item => item.id === cardId);

            if (!card) return;

            const nextPlayers = prev.players.map((p) => {
                if (p.id !== currentPlayerId) return p;

                const nextTokens = {...(p.tokens || {})};
                const nextBonuses = {...(p.bonuses || {})};
                const nextPurchased = [...(p.purchasedCards || [])];

                for (const [color, need] of Object.entries(card.cost || {})) {
                    const bonus = nextBonuses[color] || 0;
                    const spend = Math.max(0, need - bonus);
                    if ((nextTokens[color] || 0) >= spend) {
                        nextTokens[color] = (nextTokens[color] || 0) - spend;
                    } else {
                        const deficit = spend - (nextTokens[color] || 0);
                        nextTokens[color] = 0;
                        nextTokens.gold = (nextTokens.gold || 0) - deficit;
                    }
                }

                if (card.bonus && card.bonus !== 'none') {
                    nextBonuses[card.bonus] = (nextBonuses[card.bonus] || 0) + 1;
                }

                nextPurchased.push(card);

                return {
                    ...p,
                    tokens: nextTokens,
                    bonuses: nextBonuses,
                    points: (p.points || 0) + (card.points || 0),
                    purchasedCards: nextPurchased
                };
            });

            const nextState = refillOpenCardFromDeck(cardId, {
                ...prev,
                players: nextPlayers,
            });

            commitLocalPreview(nextState);
        }

        sendMove({type: 'buy_card', cardId});
        setSelectedTokens({});
        setFirstTurnSelection({});
        setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
        setShowTakeConfirm(false);
    };

    const confirmSelectedTokens = () => {
        if (takeConfirmData.type === 'gold_locked' || takeConfirmData.type === 'reserve_blocked') {
            setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
            setShowTakeConfirm(false);
            return;
        }

        if (takeConfirmData.type === 'reserve') {
            const cardId = takeConfirmData.cardId;
            if (!cardId) return;
            confirmReserveCard(cardId);
            return;
        }

        if (takeConfirmData.type === 'buy') {
            const cardId = takeConfirmData.cardId;
            if (!cardId) return;
            confirmBuyCard(cardId);
            return;
        }

        if (takeConfirmData.type === 'buy_noble') {
            const nobleId = takeConfirmData.cardId;
            if (!nobleId) return;
            confirmBuyNoble(nobleId);
            return;
        }

        if (takeConfirmData.type === 'buy_blocked' || takeConfirmData.type === 'noble_blocked') {
            setSelectedReserveCardId(null);
            setSelectedBuyCardId(null);
            setSelectedNobleId(null);
            setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
            setShowTakeConfirm(false);
            return;
        }

        const payload = takeConfirmData.type === 'double'
            ? takeConfirmData.tokens
            : selectedTokens;

        if (!payload || Object.keys(payload).length === 0) return;

        const prev = gameStore.game;
        if (prev) {
            const nextPlayers = prev.players.map((p) => {
                if (p.id !== currentPlayerId) return p;

                const nextTokens = {...p.tokens};
                Object.entries(payload).forEach(([color, amount]) => {
                    nextTokens[color] = (nextTokens[color] || 0) + Number(amount || 0);
                });

                return {...p, tokens: nextTokens};
            });

            const nextTokens = {...prev.tokens};
            Object.entries(payload).forEach(([color, amount]) => {
                nextTokens[color] = (nextTokens[color] || 0) - Number(amount || 0);
            });

            commitLocalPreview({
                ...prev,
                players: nextPlayers,
                tokens: nextTokens,
            });
        }

        sendMove({type: 'take_tokens', tokens: payload});
        setSelectedTokens({});
        setTokenTakeMode('three');
        setFirstTurnSelection({});
        setSelectedReserveCardId(null);
        setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
        setShowTakeConfirm(false);
    };

    const cancelSelectedTokens = () => {
        setSelectedTokens({});
        setTokenTakeMode('three');
        setFirstTurnSelection({});
        setSelectedReserveCardId(null);
        setSelectedBuyCardId(null);
        setSelectedNobleId(null);
        setTakeConfirmData({type: null, tokens: {}, color: null, cardId: null, cardLabel: ''});
        setShowTakeConfirm(false);
    };
    // gameStore.takeTokens(storedUser.id, ["red", "blue", "green"]);


    const cardLevels = [
        {
            level: 3,
            deckCount: currentGame.deck3Count,
            cards: currentGame.openCards3
        },
        {
            level: 2,
            deckCount: currentGame.deck2Count,
            cards: currentGame.openCards2
        },
        {
            level: 1,
            deckCount: currentGame.deck1Count,
            cards: currentGame.openCards1
        }
    ];

    const onLeaveRoom = () => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentPlayerId = userStore?.playerId || savedUser?.id;
        const rid = userStore?.roomId || userStore?.roomInfo?.roomId || JSON.parse(localStorage.getItem('roomInfo') || 'null')?.roomId || localStorage.getItem('roomId');
        const socket = userStore?.client;

        if (socket && rid && currentPlayerId) {
            try {
                socket.send({type: 'leave_game', gameId: rid, playerId: currentPlayerId});
            } catch (e) { /* ignore */
            }
        }

        // ✅ Очищаем ВСЕ локальные данные игры и комнаты
        console.log('🚪 Выходим из комнаты, очищаем состояние');
        localStorage.removeItem('roomId');
        localStorage.removeItem('roomInfo');
        localStorage.removeItem('splendor-game-state');  // ✅ Явно очищаем сохраненную игру
        userStore.setRoomId('');
        userStore.setRoomInfo(null);
        gameStore.setGame(null);  // ← Вызовет saveGame(null) → очистит localStorage
        navigate('/rooms');
    };

    return (
        <div className="board-wrapper">
            {showTakeConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#171b2f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: 24,
                        minWidth: 320,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                        color: '#fff'
                    }}>
                        <div style={{fontSize: 20, fontWeight: 700, marginBottom: 12}}>
                            {takeConfirmData.type === 'gold_locked'
                                ? 'Золото берётся через резервирование'
                                : takeConfirmData.type === 'reserve_blocked'
                                    ? 'Нельзя резервировать больше 3 карт'
                                    : takeConfirmData.type === 'reserve' || takeConfirmData.type === 'buy' || takeConfirmData.type === 'buy_noble'
                                        ? 'Выберите действие для карты'
                                        : takeConfirmData.type === 'buy_blocked' || takeConfirmData.type === 'noble_blocked'
                                            ? 'Недостаточно ресурсов для покупки'
                                            : takeConfirmData.type === 'double'
                                                ? 'Взять 2 одинаковых жетона?'
                                                : 'Взять выбранные жетоны?'}
                        </div>
                        <div style={{marginBottom: 18, color: '#dce2ff'}}>
                            {takeConfirmData.type === 'gold_locked'
                                ? 'Сначала зарезервируйте карту, чтобы получить 1 золотой жетон.'
                                : takeConfirmData.type === 'reserve_blocked'
                                    ? 'У игрока уже 3 зарезервированные карты. Сначала используйте одну из них.'
                                    : takeConfirmData.type === 'reserve' || takeConfirmData.type === 'buy' || takeConfirmData.type === 'buy_noble'
                                        ? `${takeConfirmData.cardLabel}`
                                        : takeConfirmData.type === 'buy_blocked' || takeConfirmData.type === 'noble_blocked'
                                            ? `${takeConfirmData.cardLabel} пока нельзя купить — не хватает ресурсов.`
                                            : takeConfirmData.type === 'double'
                                                ? `${takeConfirmData.color}: 2`
                                                : Object.entries(takeConfirmData.tokens || {}).map(([color, count]) => (
                                                    <span key={color} style={{marginRight: 10}}>
                                                        {color}: {count}
                                                    </span>
                                                ))}
                        </div>
                        <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                            {takeConfirmData.type === 'gold_locked' || takeConfirmData.type === 'buy_blocked' || takeConfirmData.type === 'reserve_blocked' || takeConfirmData.type === 'noble_blocked' ? (
                                <button className="start-button" onClick={confirmSelectedTokens}>Понятно</button>
                            ) : takeConfirmData.type === 'reserve' || takeConfirmData.type === 'buy' || takeConfirmData.type === 'buy_noble' ? (
                                <>
                                    <button
                                        className="start-button"
                                        onClick={() => {
                                            if (takeConfirmData.type === 'reserve') {
                                                confirmReserveCard(takeConfirmData.cardId);
                                                return;
                                            }
                                            if (takeConfirmData.type === 'buy_noble') {
                                                confirmBuyNoble(takeConfirmData.cardId);
                                                return;
                                            }
                                            confirmBuyCard(takeConfirmData.cardId);
                                        }}
                                    >
                                        {takeConfirmData.type === 'reserve' ? 'Резервировать' : takeConfirmData.type === 'buy_noble' ? 'Купить нобеля' : 'Купить'}
                                    </button>
                                    <button
                                        className="start-button"
                                        disabled={takeConfirmData.type === 'reserve' && takeConfirmData.canBuy === false}
                                        style={{
                                            opacity: takeConfirmData.type === 'reserve' && takeConfirmData.canBuy === false ? 0.45 : 1,
                                            cursor: takeConfirmData.type === 'reserve' && takeConfirmData.canBuy === false ? 'not-allowed' : 'pointer'
                                        }}
                                        onClick={() => {
                                            if (takeConfirmData.type === 'reserve') {
                                                if (takeConfirmData.canBuy === false) return;
                                                confirmBuyCard(takeConfirmData.cardId);
                                                return;
                                            }
                                            if (takeConfirmData.type === 'buy_noble') {
                                                cancelSelectedTokens();
                                                return;
                                            }
                                            confirmReserveCard(takeConfirmData.cardId);
                                        }}
                                    >
                                        {takeConfirmData.type === 'reserve' ? (takeConfirmData.canBuy === false ? 'Купить (нет ресурсов)' : 'Купить') : takeConfirmData.type === 'buy_noble' ? 'Отмена' : 'Резервировать'}
                                    </button>
                                    <button className="leave-button" onClick={cancelSelectedTokens}>Отменить</button>
                                </>
                            ) : (
                                <>
                                    <button className="start-button" onClick={confirmSelectedTokens}>Взять фишки
                                    </button>
                                    <button className="leave-button" onClick={cancelSelectedTokens}>Отменить</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <main className={`game-table${isMyTurn ? '' : ' game-table-locked'}`}>
                <div className="board-header">
                    <div className="room-title">{roomTitle}</div>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                        <div className={`turn-status${isMyTurn ? ' turn-status-active' : ''}`} role="status">
                            {isMyTurn ? 'Ваш ход' : `Ход выполняет ${activePlayer?.name || 'другой игрок'}`}
                        </div>
                        {roomStatus === 'waiting' && (
                            <button className="start-button" onClick={onStartGame}>Начать игру</button>
                        )}
                        <button className="leave-button" onClick={onLeaveRoom}>Покинуть комнату</button>
                    </div>
                </div>
                {!isMyTurn && (
                    <div className="turn-lock" aria-hidden="true">
                        <span>Ход выполняет {activePlayer?.name || 'другой игрок'}</span>
                    </div>
                )}
                {/* First-turn actions use the same click-and-confirm flow as every other turn. */}
                {false && isFirstTurn && (
                    <div style={{padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
                        <div style={{fontWeight: 600}}>Первый ход</div>
                        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center'}}>
                            <button className="start-button" onClick={() => {
                                setFirstTurnMode('three');
                                setFirstTurnSelection({});
                                setSelectedReserveCardId(null);
                                setSelectedBuyCardId(null);
                            }}>Взять 3 разных
                            </button>
                            <button className="start-button" onClick={() => {
                                setFirstTurnMode('two');
                                setFirstTurnSelection({});
                                setSelectedReserveCardId(null);
                                setSelectedBuyCardId(null);
                            }}>Взять 2 одинаковых
                            </button>
                            <button className="start-button" onClick={() => {
                                setFirstTurnMode('reserve');
                                setFirstTurnSelection({});
                                setSelectedBuyCardId(null);
                            }}>Зарезервировать + золото
                            </button>
                            <button className="start-button" onClick={() => {
                                setFirstTurnMode('buy');
                                setFirstTurnSelection({});
                                setSelectedReserveCardId(null);
                            }}>Купить карту
                            </button>
                        </div>

                        {firstTurnMode === 'three' ? (
                            <>
                                <TokenPool
                                    tokens={Object.fromEntries(
                                        Object.entries(currentGame.tokens || {}).filter(([color]) => color !== 'gold')
                                    )}
                                    onTake={handleFirstTurnSelection}
                                    selected={firstTurnSelection}
                                />
                                <button
                                    className="start-button"
                                    disabled={!canConfirmThreeColors}
                                    onClick={confirmFirstTurnTakeThree}
                                >
                                    Подтвердить выбор
                                </button>
                            </>
                        ) : firstTurnMode === 'two' ? (
                            <>
                                <div style={{color: '#dce2ff'}}>Выберите цвет, где есть минимум 4 жетона</div>
                                <TokenPool
                                    tokens={Object.fromEntries(
                                        Object.entries(currentGame.tokens || {}).filter(([color, count]) => color !== 'gold' && Number(count || 0) >= 4)
                                    )}
                                    onTake={onTakeTwoSame}
                                    selected={takeConfirmData.type === 'double' && takeConfirmData.color ? {[takeConfirmData.color]: 2} : {}}
                                />
                            </>
                        ) : firstTurnMode === 'reserve' ? (
                            <div style={{width: '100%'}}>
                                <div style={{color: '#dce2ff', marginBottom: 12}}>Выберите карту для резервирования
                                </div>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center'}}>
                                    {reserveableCards.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            onClick={() => handleCardSelection(card)}
                                            style={{
                                                width: 140,
                                                padding: 10,
                                                borderRadius: 10,
                                                border: `1px solid ${selectedReserveCardId === card.id ? '#ffd166' : 'rgba(255,255,255,0.15)'}`,
                                                background: selectedReserveCardId === card.id ? 'rgba(255,209,102,0.12)' : 'rgba(255,255,255,0.04)',
                                                boxShadow: selectedReserveCardId === card.id ? '0 0 12px rgba(255,209,102,0.45)' : 'none',
                                                cursor: 'pointer',
                                                color: '#fff',
                                                textAlign: 'center',
                                                font: 'inherit'
                                            }}
                                        >
                                            <div style={{fontWeight: 700}}>{card.id}</div>
                                            <div style={{fontSize: 12, opacity: 0.8}}>{card.points}⭐</div>
                                            <div style={{fontSize: 11, marginTop: 6}}>
                                                {Object.entries(card.cost).map(([color, amount]) => (
                                                    <span key={color} style={{margin: '0 3px'}}>{color}:{amount}</span>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{width: '100%'}}>
                                <div style={{color: '#dce2ff', marginBottom: 12}}>Выберите карту для покупки</div>
                                <CardRow
                                    cards={reserveableCards}
                                    onCardClick={(card) => handleCardSelection(card)}
                                    selectedCardId={selectedBuyCardId}
                                    disableIfUnaffordable={true}
                                    isAffordable={isCardAffordable}
                                />
                            </div>
                        )}
                    </div>
                )}
                <div className="board-top">
                    <div className="nobles-area">
                        <NobleRow
                            nobles={currentGame.nobles}
                            onNobleClick={handleNobleChoice}
                            selectedNobleId={selectedNobleId}
                        />
                    </div>
                    <div className="decks-area">
                        <DeckStack
                            level={3}
                            count={Array.isArray(currentGame.deckNobles)
                                ? currentGame.deckNobles.length
                                : currentGame.deckNobles || 0}
                        />
                    </div>
                </div>

                <div className="board-center">
                    <div className="card-levels">
                        {cardLevels.map(({level, deckCount, cards}) => (
                            <div className="board-row" key={level}>
                                <DeckStack level={level} count={deckCount}/>
                                <CardRow
                                    cards={cards}
                                    onCardClick={(card) => {
                                        if (firstTurnMode === 'buy') {
                                            handleBuyChoice(card);
                                        } else {
                                            handleReserveChoice(card);
                                        }
                                    }}
                                    selectedCardId={selectedReserveCardId || selectedBuyCardId}
                                    disableIfUnaffordable={firstTurnMode === 'buy'}
                                    isAffordable={isCardAffordable}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="tokens-area">
                        <div className="token-take-mode" role="group" aria-label="Способ взять фишки">
                            <button
                                type="button"
                                className={tokenTakeMode === 'three' ? 'token-take-mode-active' : ''}
                                onClick={() => {
                                    setTokenTakeMode('three');
                                    setSelectedTokens({});
                                }}
                            >3 разных</button>
                            <button
                                type="button"
                                className={tokenTakeMode === 'double' ? 'token-take-mode-active' : ''}
                                onClick={() => {
                                    setTokenTakeMode('double');
                                    setSelectedTokens({});
                                }}
                            >2 одинаковых</button>
                        </div>
                        <TokenPool tokens={currentGame.tokens} onTake={onTokenClick} selected={selectedTokens}/>
                        {tokenTakeMode === 'double' && (
                            <span className="token-take-hint">Выберите цвет, которого в банке не менее 4</span>
                        )}
                    </div>
                </div>
                {/*<div className="placeholder">Токены</div>*/}
            </main>
            <aside className="players-area">
                <div className="players-area-header">
                    <span>Игроки</span>
                    <span className="players-count">{currentGame.players.length}</span>
                </div>
                <PlayerPanel
                    players={currentGame.players}
                    activePlayerId={currentGame.currentPlayerId}
                    viewerPlayerId={currentPlayerId}
                    canBuyReservedCards={isMyTurn}
                    onReservedCardClick={handleBuyChoice}
                    selectedTokens={selectedTokens}
                />
            </aside>
            <div className="placeholder">Игроки</div>
        </div>
    );
}

export default observer(GameBoard)
