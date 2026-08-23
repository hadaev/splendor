const { validationResult } = require('express-validator');
const userService = require('../services/userService')
class UserController {
    async registration(req, res, next) {
        // console.log(req);
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(errors.array());
            }

            const { name, password } = req.body;
            const userData = await userService.registration(name, password);
            if (userData?.error) {
                return next(res.json(userData));
            }
            res.cookie('refreshUserToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            console.log('reg userData====',userData);
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        console.log('login = ', req.body, req.cookies);
        try {
            const { name, password } = req.body;

            const userData = await userService.login(name, password);
            res.cookie('refreshUserToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (e) {
            next(e.message);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshUserToken } = req.cookies;
            console.log('refreshUserToken3333333=========', req.cookies);
            const userData = await userService.refresh(refreshUserToken);

            res.cookie('refreshUserToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }
}
module.exports = new UserController();