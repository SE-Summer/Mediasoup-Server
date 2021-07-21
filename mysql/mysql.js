"use strict";
exports.__esModule = true;
exports.DB = void 0;
//import {mysql} from "mysql"
var mysql = require("mysql");
var moment = require('moment');
var send_email_1 = require("./send-email");
var randomString = require("string-random");
var DB = /** @class */ (function () {
    function DB() {
        this._connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '655566',
            database: 'test'
        });
        this._connection.connect();
    }
    DB.prototype.getUsers = function (callback) {
        this._connection.query('select * from users', function (err, rows) {
            if (err) {
                console.log('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                callback(null, rows);
            }
        });
    };
    DB.prototype.getRooms = function (callback) {
        this._connection.query('select * from rooms', function (err, rows) {
            if (err) {
                console.log('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                callback(null, rows);
            }
        });
    };
    DB.prototype.register = function (email, verify, nickname, password, callback) {
        var _this = this;
        var queryString = 'select * from users where email="' + email + '"';
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                console.log('[SQL_INSERT_ERROR] ', err.message);
                callback("SIE", null);
            }
            else {
                var user_1 = rows[0];
                if (verify !== user_1.verify) {
                    callback("WVC", null);
                }
                else {
                    var queryString2 = 'update users set password="' + password + '",nickname="' + nickname + '",verify=null where email="' + email + '"';
                    _this._connection.query(queryString2, function (err, ok) {
                        if (err) {
                            console.log('[SQL_UPDATE_ERROR] ', err.message);
                            callback("SUE", null);
                        }
                        else {
                            callback(null, user_1);
                        }
                    });
                }
            }
        });
    };
    DB.prototype.verify = function (email, callback) {
        var _this = this;
        var verify = randomString(6);
        var queryString = 'insert into users set email="' + email + '",verify="' + verify + '"';
        send_email_1.sendMail(email, verify, function (succ) {
            if (succ) {
                console.log("Email Send: ", verify);
            }
            else {
                console.log("Email Send Failed!");
            }
        });
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                var queryString_1 = 'update users set verify="' + verify + '" where email="' + email + '"';
                _this._connection.query(queryString_1, function (err, ok) {
                    if (err) {
                        console.log('[SQL_UPDATE_ERROR] ', err.message);
                        callback("SUE", null);
                    }
                    else {
                        callback(null, ok);
                    }
                });
            }
            else {
                callback(null, ok);
            }
        });
    };
    DB.prototype.login = function (email, password, callback) {
        var _this = this;
        var queryString = 'select * from users where email="' + email + '"and password="' + password + '"';
        var updateString = 'update users set token="' + randomString(32) + '" where email="' + email + '"and password="' + password + '"';
        this._connection.query(updateString, function (err, ok) {
            if (err) {
                console.log('[SQL_SELECT_ERROR] ', err.message);
                callback('Unauthorized', null);
            }
            else {
                _this._connection.query(queryString, function (err, rows) {
                    if (err) {
                        console.log('[SQL_SELECT_ERROR] ', err.message);
                        callback('SSE', null);
                    }
                    else {
                        callback(null, rows);
                    }
                });
            }
        });
    };
    DB.prototype.appoint = function (host, password, start_time, end_time, max_num, topic, callback) {
        var _this = this;
        var queryString = 'insert into rooms set host=' + host + ',start_time="' + start_time + '",end_time="' + end_time + '",max_num=' + max_num + ',topic="' + topic + '",token="' + randomString() + '",password="' + password + '"';
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                console.log('[SQL_INSERT_ERROR] ', err.message);
                callback('SIE', null);
            }
            else {
                var queryString2 = 'select * from rooms where id=' + ok.insertId;
                _this._connection.query(queryString2, function (err, rows) {
                    if (err) {
                        console.log('[SQL_SELECT_ERROR] ', err.message);
                        callback('SSE', null);
                    }
                    else {
                        callback(null, rows);
                    }
                });
            }
        });
    };
    DB.prototype.getRoom = function (id, password, callback) {
        var queryString = 'select * from rooms where id=' + id;
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                console.log('[SQL_SELECT_ERROR] ', err.message);
                callback('SEE', null);
            }
            else {
                var room = rows[0];
                if (room) {
                    room.start_time = moment(room.start_time).format('YYYY-MM-DD HH:mm:ss');
                    room.end_time = moment(room.end_time).format('YYYY-MM-DD HH:mm:ss');
                    if (room.password === password) {
                        if (room.start_time > moment().format('YYYY-MM-DD HH:mm:ss')
                            || room.end_time < moment().format('YYYY-MM-DD HH:mm:ss')) {
                            callback("Invalid Time", room);
                        }
                        else {
                            callback(null, room);
                        }
                    }
                    else {
                        callback('Unauthorized', null);
                    }
                }
                else {
                    callback("No Such Room", null);
                }
            }
        });
    };
    return DB;
}());
exports.DB = DB;
