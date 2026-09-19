import React from "react";
import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
    return (
        <div className="home-wrapper">
            <div className="home-card">
                <h1 className="home-title">Pebbles</h1>

                <p className="home-subtitle">
                    Лёгкая стратегическая игра, где каждый ход имеет значение.
                    Собирайте камни, улучшайте свои возможности и опережайте соперников.
                </p>

                <div className="home-features">
                    <div className="home-feature">• Быстрые партии</div>
                    <div className="home-feature">• Простые правила</div>
                    <div className="home-feature">• Глубокая стратегия</div>
                    <div className="home-feature">• Онлайн‑матчи</div>
                </div>

                <div className="home-actions">
                    <Link to="/register" className="home-btn home-btn-primary">
                        Регистрация
                    </Link>

                    <Link to="/login" className="home-btn home-btn-secondary">
                        Вход
                    </Link>
                </div>
            </div>
        </div>
    );
}
