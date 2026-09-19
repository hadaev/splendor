import React, {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import "./register.css";
import "../../styles/validate.css"
import {validate} from "../../utils/validate";
import {Context} from "../../index";
import {observer} from "mobx-react-lite";

function RegisterPage() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [repeat, setRepeat] = useState("");
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
        console.log('Register = ', repeat);
        if (!validate(name, password, setErrors, repeat)) return;

        const response = await userStore.registration(name, password);
        console.log(response);

        if (response?.error){
            setErrors({name: response.error})
            return;
        }

        // Успешная регистрация — переходим в список комнат
        history('/rooms', { replace: true });

    };
    console.log(errors.name);
    if (spinner) return <>Load</>;
    else
        return (
            <div className="reg-wrapper">
                <div className="reg-card">
                    <h1 className="reg-title">Регистрация</h1>

                    <form className="reg-form" onSubmit={handleSubmit}>
                        <label className="reg-label">Имя</label>
                        <input
                            className={`reg-input ${errors.name ? "input-error" : ""}`}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <div className="error-text">{errors.name}</div>}

                        <label className="reg-label">Пароль</label>
                        <input
                            className={`reg-input ${errors.password ? "input-error" : ""}`}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && <div className="error-text">{errors.password}</div>}

                        <label className="reg-label">Повторите пароль</label>
                        <input
                            className={`reg-input ${errors.repeat ? "input-error" : ""}`}
                            type="password"
                            value={repeat}
                            onChange={(e) => setRepeat(e.target.value)}
                        />
                        {errors.repeat && <div className="error-text">{errors.repeat}</div>}

                        <button className="reg-btn" type="submit">
                            Создать аккаунт
                        </button>
                    </form>

                    <div className="reg-footer">
                        Уже есть аккаунт? <Link to="/login">Войти</Link>
                    </div>
                </div>
            </div>
        );
}

export default observer(RegisterPage)
