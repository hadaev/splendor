export const validate = (name, password, setErrors, repeat = 'login') => {
    const newErrors = {};

    if (name.trim().length < 3) {
        newErrors.name = "Имя должно содержать минимум 3 символа";
    }

    if (password.length < 6) {
        newErrors.password = "Пароль должен быть не короче 6 символов";
    }
    if (repeat !== 'login' && repeat !== password) {
        newErrors.repeat = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};