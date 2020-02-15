var express = require('express');
var router = express.Router();


const restify_jwt = require('restify-jwt-community');


const MyAppCtrl = require('../controller/my_app_ctrl');

router.get('/account/create', MyAppCtrl.create);
router.get('/account/load_account/:pk', MyAppCtrl.loadAccount);
router.post('/account/send_money', MyAppCtrl.send);
router.get('/account/receive_money', MyAppCtrl.receive);


module.exports = router;
