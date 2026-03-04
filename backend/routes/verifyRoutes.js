const express = require('express');
const router = express.Router();
const { verifyNews } = require('../controllers/verifyController');

router.post('/', verifyNews);

module.exports = router;
