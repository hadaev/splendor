const {User} = require("../models/models");
const bcrypt = require('bcrypt');
const tokenService = require('./tokenService')

class UserService {

    async registration(name, password) {
        let isUser = {};
        if (name) {
            isUser = await User.findOne({where: {name}});
            if (isUser) {
                return {error: `User with name ${name} already exists`}
            }
        }

        const paramsUser = {};
        const fieldsUser = [];

        if (name) {
            paramsUser.name = name;
            fieldsUser.push('name');
        }


        const hashPassword = await bcrypt.hash(password, 3);
        // const activationLink = jwt.sign({ email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '24h' });

        if (password) {
            paramsUser.password = hashPassword;
            fieldsUser.push('password');
        }
        // console.log(paramsUser, { fields: fieldsUser })
        const dataUser = await User.create(paramsUser, {fields: fieldsUser});

        const tokens = tokenService.generateUserTokens({ id: dataUser.id, name: dataUser.name });
        await tokenService.saveUserToken(dataUser.id, tokens.refreshToken);
        // console.log(dataUser)

        return {
            ...tokens,
            name: dataUser.name,
            user: {
                id: dataUser.id,
                name: dataUser.name
            }
        };
    }

    async login(name, password) {

        const user = await User.findOne({where: {name}});
        if (!user) {
            return {error: 'No user found with this email or Incorrect password'};
        }

        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            return {error: 'No user found with this email or Incorrect password'};
        }
        const tokens = tokenService.generateTokens({
            id: user.id,
            name: user.name,
        });

        await tokenService.saveUserToken(user.id, tokens.refreshToken);

        return {
            refreshToken: tokens.refreshToken,
            user: {
                name: user.name,
                id: user.id
            }

        };
    }

    async refresh(refreshToken) {
        if (!refreshToken || refreshToken === 'undefined') {
            return {message:'Not found a token'};
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findUserToken(refreshToken);
        if (!userData || !tokenFromDb) {
            return {message: 'Not valid token'}
        }

        const user = await User.findByPk(userData.id);
        const tokens = tokenService.generateUserTokens({
            id: user.id,
            name: user.name,
        });
        await tokenService.saveUserToken(user.id, tokens.refreshToken);

        return {
            name: user.name,
            refreshToken: tokens.refreshToken,
            accessToken: tokens.accessToken,
            user: {
                id: user.id,
                name: user.name
            }
        };
    }


}

module.exports = new UserService()