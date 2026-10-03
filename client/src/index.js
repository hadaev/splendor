import React, {createContext} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import './index.css';
import UserStore from "./store/UserStore";
import GameStore from "./store/GameStore";

const userStore = new UserStore();
const gameStore = new GameStore();
export const Context = createContext(null);

const root = createRoot(document.getElementById('root'));
root.render(
    <Context.Provider
        value={{
            userStore,
            gameStore
        }}
    >
        <App/>
    </Context.Provider>
);
