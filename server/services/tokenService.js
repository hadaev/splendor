const jwt = require('jsonwebtoken');
const { User } = require('../models/models');

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return {
      accessToken,
      refreshToken,
    };
  }

  generateUserTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return {
      accessToken,
      refreshToken,
    };
  }

  generateIdToken(payload) {
    const authToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET);
    return authToken;
  }

  async saveToken(adminId, refreshToken) {
    const tokenData = await Token.findOne({ where: { adminId } });

    if (tokenData !== null) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }

    const token = await Token.create({ adminId, refreshToken });
    return token;
  }

  async saveUserToken(userId, refreshToken) {

    console.log(userId, refreshToken)
    const tokenData = await User.findOne({ where: { id: userId } });

    if (tokenData !== null) {
      tokenData.token = refreshToken;
      return tokenData.save();
    }

    const t = await User.update({token: refreshToken}, {
      where: {id: userId}
    });

    console.log('========',t);
    return refreshToken
  }

  validateAccessToken(token) {
    try {
      const data = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      return data;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const data = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return data;
    } catch (e) {
      return null;
    }
  }

  validateUserActivationLink(activationLink) {
    try {
      return jwt.verify(activationLink, process.env.JWT_ACCESS_SECRET);
    } catch (e) {
      return null;
    }
  }

  async removeToken(refreshToken) {
    const tokenData = await Token.destroy({ where: { refreshToken } });
    return tokenData;
  }

  async removeUserToken(refreshToken) {
    const tokenData = await UserToken.destroy({ where: { refreshToken } });
    return tokenData;
  }

  async findToken(refreshToken) {
    const tokenData = await Token.findOne({ where: { refreshToken } });
    return tokenData;
  }

  async findUserToken(refreshToken) {
    return await User.findOne({where: {token: refreshToken}});
  }

  async findTokenByIdAdmin(adminId) {
    const tokenData = await Token.findOne({ where: { adminId } });
    return tokenData;
  }

  async findTokenByIdUser(userId) {
    const tokenData = await UserToken.findOne({ where: { userId } });
    return tokenData;
  }
}
module.exports = new TokenService();
