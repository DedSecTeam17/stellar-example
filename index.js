const restify = require('restify');
const mongoose = require('mongoose');
const restify_jwt = require('restify-jwt-community');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

const  {receive} =require('./controller/my_app_ctrl');


const stlr = require('./routes/my_app');

// protect all routes unless registration and login entry point
// server.use(restify_jwt({secret: process.env.JWT_SECRET}).unless({path:['/auth']}));

// when server listen connect to the data base
app.listen(3000, () => {
    receive();
    console.log("server started")
    app.use("/api", stlr);
});

