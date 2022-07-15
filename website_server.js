'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');
var socketIo = require('socket.io');

var log4js = require('log4js');

log4js.configure({
	appenders: {
		file: {
			type: 'file',
			filename: 'app.log',
			layout: {
				type: 'pattern',
				pattern: '%r %p - %m',
			}
		}
	},
	categories: {
		default: {
			appenders: ['file'],
			level: 'debug'
		}
	}
});

var logger = log4js.getLogger();

var app = express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var http_server = http.createServer(app);
http_server.listen(80, '0.0.0.0');

var options = {
	key : fs.readFileSync('./bubblezjt.top_other/bubblezjt.top.key'),
	cert: fs.readFileSync('./bubblezjt.top_other/bubblezjt.top_bundle.pem')
}

var https_server = https.createServer(options, app);
var io = socketIo.listen(https_server);

io.sockets.on('connection', (socket)=>{

	socket.on('message', (room, data) => {
		socket.to(room).emit('message', room, socket.id, data);
	});

	socket.on('join', (room)=>{
		socket.join(room);
            	var myRoom = io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;
		logger.log('joined the number of user in room ' + room + ' is: ' + users);

		// socket.emit('joined', room, socket.id);	// 发送给该用户
		socket.to(room).emit('joined', room, socket.id); // 发送给该房间内的其他用户（不包括自己）
		// io.in(room).emit('joined', room, socket.id); // 发送给该房间内所有的用户（包括自己）
		// socket.broadcast.emit('joined', room, socket.id); // 发送给连接该站点的全体用户（不包括自己）
	});
	socket.on('leave', (room)=>{
		socket.leave(room);
            	var myRoom = io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;
		logger.log('leaved the number of user in room ' + room + ' is: ' + users);

		// socket.emit('leaved', room, socket.id);	// 发送给该用户
		socket.to(room).emit('leaved', room, socket.id); // 发送给该房间内的其他用户（不包括自己）
		// io.in(room).emit('joined', room, socket.id); // 发送给该房间内所有的用户（包括自己）
		// socket.broadcast.emit('leaved', room, socket.id); // 发送给连接该站点的全体用户（不包括自己）
	});

});

https_server.listen(443, '0.0.0.0');
