import React, {useContext, useEffect} from "react";
import {BrowserRouter} from 'react-router-dom';

import Router from "./Routes";
import {Context} from "./index";

export function App() {
    const {userStore} = useContext(Context);

    useEffect(() => {
        if (localStorage.getItem('tokenUser')) {
            userStore.checkAuth();
        }
    }, [userStore]);

    return (
        <BrowserRouter>
            <Router/>
        </BrowserRouter>
    );
}
