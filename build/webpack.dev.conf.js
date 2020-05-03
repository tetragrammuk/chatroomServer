'use strict';
const utils = require('./utils');
const webpack = require('webpack');
const config = require('../config');
const merge = require('webpack-merge');
const path = require('path');
const fs = require('fs')
const baseWebpackConfig = require('./webpack.base.conf');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const portfinder = require('portfinder');
const mysql = require('mysql');

const HOST = process.env.HOST;
const PORT = process.env.PORT && Number(process.env.PORT);

var pool;
const createPool = async () => {
    pool = await mysql.createPool({
        user: 'root', // e.g. 'my-db-user'
        password: 'fatsheepgod', // e.g. 'my-db-password'
        database: 'chatroomTest', // e.g. 'my-database'
        // If connecting via unix domain socket, specify the path
        //socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
        // If connecting via TCP, enter the IP and port instead
        host: '34.80.112.57',
        port: 3306,

        //...
    });
};
createPool();

const devWebpackConfig = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
    },
    // cheap-module-eval-source-map is faster for development
    devtool: config.dev.devtool,

    // these devServer options should be customized in /config/index.js
    devServer: {
        clientLogLevel: 'warning',
        historyApiFallback: {
            rewrites: [{ from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') }]
        },
        hot: true,
        contentBase: false, // since we use CopyWebpackPlugin.
        compress: true,
        host: HOST || config.dev.host,
        port: PORT || config.dev.port,
        open: config.dev.autoOpenBrowser,
        overlay: config.dev.errorOverlay ? { warnings: false, errors: true } : false,
        publicPath: config.dev.assetsPublicPath,
        proxy: config.dev.proxyTable,
        quiet: true, // necessary for FriendlyErrorsPlugin
        watchOptions: {
            poll: config.dev.poll
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': require('../config/dev.env')
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
        new webpack.NoEmitOnErrorsPlugin(),
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: true
        }),
        // copy custom static assets
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, '../static'),
                to: config.dev.assetsSubDirectory,
                ignore: ['.*']
            }
        ])
    ]
});

module.exports = new Promise((resolve, reject) => {
    portfinder.basePort = process.env.PORT || config.dev.port;
    portfinder.getPort((err, port) => {
        if (err) {
            reject(err);
        } else {
            // publish the new Port, necessary for e2e tests
            process.env.PORT = port;
            // add port to devServer config
            devWebpackConfig.devServer.port = port;

            // Add FriendlyErrorsPlugin
            devWebpackConfig.plugins.push(
                new FriendlyErrorsPlugin({
                    compilationSuccessInfo: {
                        messages: [
                            `
Your application is running here:
    im-server:  http://localhost:${port}/#/imServer
    im-client:  http://localhost:${port}/#/imclient
                        `
                        ]
                    },
                    onErrors: config.dev.notifyOnErrors ? utils.createNotifierCallback() : undefined
                })
            );

            resolve(devWebpackConfig);
        }
    });
});

// express
const app = require('express')();
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
app.use(fileUpload()); // for parsing multipart/form-data
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});
// 上传文件
app.post('/upload', function (req, res) {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    // save file
    // <input type="file" name="uploadFile" />
    let file = req.files.uploadFile;
    let encodeFileName = Number.parseInt(Date.now() + Math.random()) + file.name;
    file.mv(path.resolve(__dirname, '../static/upload/') + '/' + encodeFileName, function (err) {
        if (err) {
            return res.status(500).send({
                code: err.code,
                data: err,
                message: '文件上传失败'
            });
        }
        res.send({
            code: 0,
            data: {
                fileName: file.name,
                fileUrl: `http://${devWebpackConfig.devServer.host}:3000/static/upload/${encodeFileName}`
            },
            message: '文件上传成功'
        });
    });
});

// 获取文件
app.get('/static/upload/:fileName', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../static/upload') + '/' + req.params.fileName);
});
// 获取im客服列表
app.get('/getIMServerList', function (req, res) {
    res.json({
        code: 0,
        data: Array.from(serverChatDic.values()).map((item) => {
            return item.serverChatEn;
        }) // 只需要serverChatDic.values内的serverChatEn
    });
});
app.post('/api/msgList_read', (req, res) => {
    var msgs = [];
    pool.getConnection(function (err, connection) {
        connection.query('SELECT msg_content FROM historyMsg where server_id = ? AND client_id = ? ORDER BY date',
            [req.body.serverChatId, req.body.clientChatId],
            function (err, rows) {
                for (var row of rows) {
                    msgs.push(JSON.parse(row.msg_content))
                }
                console.log("query success and release");
                // console.log(req.body.serverChatId,req.body.clientChatId)
                // console.log(msgs)
                res.send({
                    msgList: msgs
                })
            });
        connection.release();
    });
});
app.post('/api/ChatEn_update', (req, res) => {
    pool.getConnection(function (err, connection) {
        connection.query('UPDATE ChatEn SET ChatEnList=?, done_ChatEnList=? WHERE server_id=?',
            [JSON.stringify(req.body.ChatEnList), JSON.stringify(req.body.done_ChatEnList), req.body.serverChatId],
            function (err, rows) {
                console.log("ChatEn_update query success and release");
                res.send(req.body)
            });
        connection.release();
    });
});
app.post('/api/ChatEn_read', (req, res) => {
    pool.getConnection(function (err, connection) {
        connection.query('SELECT ChatEnList, done_ChatEnList FROM ChatEn where server_id = ?',
            [req.body.serverChatId],
            function (err, rows) {
                console.log("ChatEn_read query success and release");
                //console.log(JSON.parse(rows[0].ChatEnList))
                res.send(rows[0])
            });
        connection.release();
    });
});
app.listen(3000);

// socket
const privateKey = fs.readFileSync('/home/bob41777/tempp/sslforfree/private.key', 'utf8')
const certificate = fs.readFileSync('/home/bob41777/tempp/sslforfree/certificate.crt', 'utf8')
const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: process.env.PASSPHRASE
}

var server = require('https').createServer(credentials);
// var server = require('https').createServer();
var io = require('socket.io')(server);
var serverChatDic = new Map(); // 服务端
var clientChatDic = new Map(); // 客户端
var serverSocketList = [];
io.on('connection', function (socket) {
    // 服务端上线
    socket.on('SERVER_ON', function (data) {
        serverSocketList.push(socket);
        let serverChatEn = data.serverChatEn;
        console.log(`有新的服务端socket连接了，服务端Id：${serverChatEn.serverChatId}`);
        serverChatDic.set(serverChatEn.serverChatId, {
            serverChatEn: serverChatEn,
            socket: serverSocketList
        });
        console.log(`現有的serverChatDic：${serverChatDic}`);
        console.log(serverChatEn.serverChatId + ' Count : ' + serverChatDic.get(serverChatEn.serverChatId).socket.length);
    });

    // 服务端下线
    socket.on('SERVER_OFF', function (data) {
        let serverChatEn = data.serverChatEn;
        let serverChatId = serverChatEn.serverChatId;
        let index = serverChatDic.get(serverChatId).socket.indexOf(serverChatDic.get(serverChatId).socket);
        serverChatDic.get(serverChatId).socket.splice(index, 1);
        console.log(serverChatId + ' Count : ' + serverChatDic.get(serverChatId).socket.length);
        if (serverChatDic.get(serverChatId).socket.length == 0) {
            serverChatDic.delete(serverChatId);
            console.log('delete Host: serverChatEn.serverChatId')
        }

    });

    // 服务端发送了信息
    socket.on('SERVER_SEND_MSG', function (data) {
        if (clientChatDic.has(data.clientChatId)) {
            clientChatDic.get(data.clientChatId).socket.emit('SERVER_SEND_MSG', { msg: data.msg });
        }
        if (serverChatDic.has(data.serverChatId)) {
            serverChatDic.get(data.serverChatId).socket.forEach((socketUnit) => {
                if (socketUnit != socket) {
                    socketUnit.emit('SERVER_SEND_MSG', {
                        clientChatId: data.clientChatId,
                        msg: data.msg
                    });
                }
            })
        }
        // 41add
        pool.getConnection(function (err, connection) {
            connection.query('INSERT INTO historyMsg (msg_content, server_id, client_id, date, server_on) VALUES (?, ?, ?, NOW(), ?)',
                [JSON.stringify(data.msg), data.serverChatId, data.clientChatId, 1],
                function (err, rows) {
                    console.log("query success and release");
                });
            connection.release();
        });
    });


    socket.on('disconnect', function () {
        // console.log('disconnect:socket id =' + socket.id);
        clientChatDic.forEach(mapcallback);
        function mapcallback(value, key, map) {
            // console.log("this is vaule.id=" + value.socket.id);
            // console.log("this is key=" + key);
            // console.log("this is mpa=" + map);

            if (value.socket.id == socket.id) {  // 找到對應socketid
                clientChatDic.delete(key); // key = clientid
                //對 server 端的socket傳送 client off
                if (serverChatDic.has('ieat')) {
                    serverChatDic.get('ieat').socket.forEach((socketUnit) => {
                        socketUnit.emit('CLIENT_OFF', {
                            clientChatEn: value.clientChatEn
                        });
                    })
                }
            }
        }
    });
    // 客户端事件；'CLIENT_ON'(上线), 'CLIENT_OFF'(离线), 'CLIENT_SEND_MSG'(发送消息)
    ['CLIENT_ON', 'CLIENT_OFF', 'CLIENT_SEND_MSG'].forEach((eventName) => {
        socket.on(eventName, (data) => {
            let clientChatEn = data.clientChatEn;
            let serverChatId = data.serverChatId;
            let clientChatId = clientChatEn.clientChatId;
            let server_on = 1;

            console.log('server get')
            // 1.通知服务端
            if (serverChatDic.has(serverChatId)) {
                console.log('eventName=' + eventName + '__' + 'clientChatEn=' + clientChatEn + 'msg=' + data.msg)
                serverChatDic.get(serverChatId).socket.forEach((socketUnit) => {
                    socketUnit.emit(eventName, {
                        clientChatEn: clientChatEn,
                        msg: data.msg
                    });
                })
                // serverChatDic.get(serverChatId).socket.emit(eventName, {
                //     clientChatEn: clientChatEn,
                //     msg: data.msg
                // });
            } else {
                socket.emit('SERVER_SEND_MSG', {
                    msg: {
                        content: '未找到客服'
                    }
                });
            }

            // 2.对不同的事件特殊处理
            if (eventName === 'CLIENT_ON') {
                // 1)'CLIENT_ON'，通知客户端正确连接
                console.log(`有新的客户端socket连接了，客户端Id：${clientChatEn.clientChatId}`);
                clientChatDic.set(clientChatEn.clientChatId, {
                    clientChatEn: clientChatEn,
                    socket: socket
                });
                // 在客戶連線時載入 歷史訊息
                //41add
                pool.getConnection(function (err, connection) {
                    connection.query('SELECT msg_content FROM historyMsg where server_id = ? AND client_id = ? ORDER BY date',
                        [serverChatId, clientChatId],
                        function (err, rows) {
                            let msgs = [];
                            for (var row of rows) {
                                msgs.push(JSON.parse(row.msg_content))
                            }
                            socket.emit('HISTORY_MSG', {
                                msgList: msgs
                            });
                        });
                    connection.release();
                });

                console.log('client_on & clientchatDic =' + clientChatDic)
                serverChatDic.has(serverChatId) &&
                    socket.emit('SERVER_CONNECTED', {
                        serverChatEn: serverChatDic.get(serverChatId).serverChatEn
                    });

            } else if (eventName === 'CLIENT_OFF') {
                // 2)'CLIENT_OFF'，删除连接
                clientChatDic.delete(clientChatEn.clientChatId);
            } else if (eventName === 'CLIENT_SEND_MSG') {
                // 41add
                pool.getConnection(function (err, connection) {
                    connection.query('INSERT INTO historyMsg (msg_content, server_id, client_id, date, server_on) VALUES (?, ?, ?, NOW(), ?)',
                        [JSON.stringify(data.msg), serverChatId, clientChatId, server_on],
                        function (err, rows) {
                            console.log("query success and release");
                        });
                    connection.release();
                });

            }
        });
    });
});
server.listen(3001);
