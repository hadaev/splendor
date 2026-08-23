const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const gameController = require('../controllers/gameController')

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.post('/create-room', gameController.createRoom);
router.get('/rooms', gameController.getRooms);
router.get('/refresh', userController.refresh);


module.exports = router;
