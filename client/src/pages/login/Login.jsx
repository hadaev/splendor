import React, {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import "./login.css";
import "../../styles/validate.css"
import {validate} from "../../utils/validate";
import {Context} from "../../index";
import {observer} from "mobx-react-lite";

function Login() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const {userStore} = useContext(Context);
    const history = useNavigate();
    const [spinner, setSpinner] = useState(true);

    useEffect(() => {
        console.log('userStore.isAuth', userStore.isAuth);
        if (userStore.isAuth) {
            history('/rooms', {replace: true});
        }
        setSpinner(userStore.isLoading);
    }, [userStore.isAuth, userStore.isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate(name, password, setErrors)) return;

        console.log("LOGIN:", {name, password});
        // отправка на сервер
        const response = await userStore.login(name, password);
        console.log(response);

        if (response) history('/rooms')
    };

    if (spinner) return <>Load</>;
    else
        return (
            <div className="login-wrapper">
                <div className="login-card">
                    <h1 className="login-title">Вход</h1>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <label className="login-label">Имя</label>
                        <input
                            className={`login-input ${errors.name ? "input-error" : ""}`}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <div className="error-text">{errors.name}</div>}

                        <label className="login-label">Пароль</label>
                        <input
                            className={`login-input ${errors.password ? "input-error" : ""}`}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && <div className="error-text">{errors.password}</div>}

                        <button className="login-btn" type="submit">
                            Войти
                        </button>
                    </form>

                    <div className="login-footer">
                        Нет аккаунта? <Link to="/register">Создать</Link>
                    </div>
                </div>
            </div>
        );
}

export default observer(Login)