import {Route, Routes} from 'react-router-dom';
import React from "react";
import LobbyScreen from "./components/LobbyScreen/LobbyScreen";
import GameBoard from "./pages/gameBoard/GameBoard";
import Home from "./pages/home/Home";
import Register from "./pages/register/Register";
import Login from "./pages/login/Login";
import Rooms from "./pages/rooms/Rooms";
import RequireAuth from "./components/RequireAuth";

const Router = () => {
    // const {userStore} = useContext(Context);
    // useMemo(() => {
    //     if (localStorage.getItem('playerId')) {
    //         userStore.checkAuth();
    //     }
    // }, []);
    return (
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/rooms" element={<Rooms/>}/>
            <Route path='/game-board' element={<RequireAuth><GameBoard/></RequireAuth>}/>
            <Route path='/lobby' element={<RequireAuth><LobbyScreen/></RequireAuth>}/>
        </Routes>
    )
}

export default Router;