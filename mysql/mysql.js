"use strict";
exports.__esModule = true;
exports.DB = void 0;
//import {mysql} from "mysql"
var mysql = require("mysql");
var moment = require('moment');
var global_1 = require("../lib/global");
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
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                callback(null, rows);
            }
        });
    };
    DB.prototype.getRooms = function (token, callback) {
        this._connection.query('select r.id, r.token, r.password, r.host, r.end_time, r.start_time, r.topic, r.max_num from rooms r, users u, reservations e where u.id=e.userId and r.id=e.roomId and u.token="' + token + '" order by r.start_time desc', function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                callback(null, rows);
            }
        });
    };
    DB.prototype.isHost = function (userToken, roomToken, callback) {
        var _this = this;
        var queryString = 'select * from rooms where token="' + roomToken + '"';
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                if (rows.length === 0) {
                    callback('No Such Room', null);
                }
                else {
                    var host_1 = rows[0].host;
                    var queryString2 = 'select * from users where token="' + userToken + '"';
                    _this._connection.query(queryString2, function (err, rows) {
                        if (err) {
                            global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                            callback('SSE', null);
                        }
                        else {
                            if (rows.length === 0) {
                                callback('No Such User', null);
                            }
                            else if (rows[0].id === host_1) {
                                callback(null, true);
                            }
                            else {
                                callback(null, false);
                            }
                        }
                    });
                }
            }
        });
    };
    DB.prototype.setHost = function (userToken, roomToken, callback) {
        var _this = this;
        var queryString = 'select * from users where token="' + userToken + '"';
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                if (rows.length === 0) {
                    callback('No Such User', null);
                }
                else {
                    var id = rows[0].id;
                    var queryString2 = 'update rooms set host=' + id + ' where token="' + roomToken + '"';
                    _this._connection.query(queryString2, function (err, ok) {
                        if (err) {
                            global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                            callback('SSE', null);
                        }
                        else {
                            if (ok.changedRows === 0) {
                                callback('No Such Room', null);
                            }
                            else {
                                callback(null, true);
                            }
                        }
                    });
                }
            }
        });
    };
    DB.prototype.register = function (token, nickname, password, callback) {
        var queryString = 'update users set nickname="' + nickname + '", password="' + password + '", verify=null where token="' + token + '"';
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                global_1.logger.error('[SQL_INSERT_ERROR] ', err.message);
                callback("SIE", null);
            }
            else {
                if (ok.changedRows > 0) {
                    callback(null, ok);
                }
                else {
                    callback("Wrong Token", null);
                }
            }
        });
    };
    DB.prototype.sendEmail = function (email, callback) {
        var _this = this;
        var verify = randomString(6).toUpperCase();
        var queryString = 'insert into users set email="' + email + '",verify="' + verify + '"';
        send_email_1.sendMail(email, verify, function (succ) {
            if (succ) {
                global_1.logger.info("Email Send: ", verify);
            }
            else {
                global_1.logger.error("Email Send Failed!");
            }
        });
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                var queryString_1 = 'update users set verify="' + verify + '" where email="' + email + '"';
                _this._connection.query(queryString_1, function (err, ok) {
                    if (err) {
                        global_1.logger.error('[SQL_UPDATE_ERROR] ', err.message);
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
    DB.prototype.verify = function (email, verify, callback) {
        var token = randomString(32);
        var queryString = 'update users set token="' + token + '" where verify="' + verify + '" and email="' + email + '"';
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                global_1.logger.error('[SQL_UPDATE_ERROR] ', err.message);
                callback("SUE", null);
            }
            else {
                if (ok.changedRows > 0) {
                    callback(null, token);
                }
                else {
                    callback("Wrong Verify Code", null);
                }
            }
        });
    };
    DB.prototype.login = function (email, password, callback) {
        var _this = this;
        var queryString = 'select * from users where email="' + email + '"and password="' + password + '"';
        var updateString = 'update users set token="' + randomString(32) + '" where email="' + email + '"and password="' + password + '"';
        this._connection.query(updateString, function (err, ok) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('Unauthorized', null);
            }
            else {
                _this._connection.query(queryString, function (err, rows) {
                    if (err) {
                        global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                        callback('SSE', null);
                    }
                    else {
                        callback(null, rows);
                    }
                });
            }
        });
    };
    DB.prototype.autoLogin = function (token, callback) {
        var queryString = 'select * from users where token="' + token + '"';
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                callback(null, rows);
            }
        });
    };
    DB.prototype.appoint = function (token, password, start_time, end_time, max_num, topic, callback) {
        var _this = this;
        if (start_time >= end_time) {
            callback("Invalid End Time", null);
            return;
        }
        else if (moment(start_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm') < moment().format('YYYY-MM-DD HH:mm')) {
            callback("Invalid Start Time", null);
            return;
        }
        var queryString = 'select users.id from users where token="' + token + '"';
        var host;
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
                return;
            }
            else {
                if (rows[0]) {
                    host = rows[0].id;
                    var queryString2 = 'insert into rooms set host=' + host + ',start_time="' + start_time + '",end_time="' + end_time + '",max_num=' + max_num + ',topic="' + topic + '",token="' + randomString() + '",password="' + password + '"';
                    _this._connection.query(queryString2, function (err, ok) {
                        if (err) {
                            global_1.logger.error('[SQL_INSERT_ERROR] ', err.message);
                            callback('SIE', null);
                        }
                        else {
                            _this._connection.query('insert into reservations set userId=' + host + ', roomId=' + ok.insertId, function (err, ok2) {
                                if (err) {
                                    global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                                    callback('SSE', null);
                                }
                                else {
                                    var queryString2_1 = 'select * from rooms where id=' + ok.insertId;
                                    _this._connection.query(queryString2_1, function (err, rows) {
                                        if (err) {
                                            global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                                            callback('SSE', null);
                                        }
                                        else {
                                            callback(null, rows);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                else {
                    callback('Wrong Token', null);
                    return;
                }
            }
        });
    };
    DB.prototype.getRoom = function (id, password, callback) {
        var queryString = 'select * from rooms where id=' + id;
        this._connection.query(queryString, function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SEE', null);
            }
            else {
                var room = rows[0];
                if (room) {
                    room.start_time = moment(room.start_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm');
                    room.end_time = moment(room.end_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm');
                    var now_time = moment().format('YYYY-MM-DD HH:mm');
                    if (room.password === password) {
                        if (room.start_time > now_time || room.end_time < now_time) {
                            global_1.logger.error(room.start_time, room.end_time, now_time);
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
    DB.prototype.getPortrait = function (token, callback) {
        this._connection.query('select users.portrait from users where token="' + token + '"', function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                if (rows.length === 0) {
                    callback("Wrong Token", null);
                }
                else {
                    callback(null, rows[0].portrait);
                }
            }
        });
    };
    DB.prototype.savePortrait = function (token, path, callback) {
        var queryString = 'update users set portrait="' + path + '" where token="' + token + '"';
        this._connection.query(queryString, function (err, ok) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else if (ok.changedRows === 0) {
                callback('Wrong Token', null);
            }
            else {
                callback(null, ok);
            }
        });
    };
    DB.prototype.saveFile = function (token, path, callback) {
        var _this = this;
        this._connection.query('select users.id from users where token="' + token + '"', function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                if (rows.length === 0) {
                    callback("Wrong Token", null);
                }
                else {
                    var queryString = 'insert into files set path="' + path + '", owner=' + rows[0].id;
                    _this._connection.query(queryString, function (err, ok) {
                        if (err) {
                            global_1.logger.error('[SQL_INSERT_ERROR] ', err.message);
                            callback('SIE', null);
                        }
                        else {
                            callback(null, ok);
                        }
                    });
                }
            }
        });
    };
    DB.prototype.reserve = function (token, roomId, password, callback) {
        var _this = this;
        var userId;
        this._connection.query('select users.id from users where token="' + token + '"', function (err, rows) {
            if (err) {
                global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                callback('SSE', null);
            }
            else {
                if (rows.length === 0) {
                    callback("Wrong Token", null);
                }
                else {
                    userId = rows[0].id;
                    var queryString = 'select rooms.id from rooms where id=' + roomId + ' and password="' + password + '"';
                    _this._connection.query(queryString, function (err, rows) {
                        if (err) {
                            global_1.logger.error('[SQL_SELECT_ERROR] ', err.message);
                            callback('SEE', null);
                        }
                        else {
                            if (rows.length === 0) {
                                callback("No Such Room", null);
                            }
                            else {
                                var queryString2 = 'select reservations.id from reservations where userId=' + userId + ' and roomId=' + roomId;
                                _this._connection.query(queryString2, function (err, rows) {
                                    if (err) {
                                        global_1.logger.error('[SQL_INSERT_ERROR] ', err.message);
                                        callback('SIE', null);
                                    }
                                    else if (rows.length > 0) {
                                        callback('Already Reserved', null);
                                    }
                                    else {
                                        var queryString3 = 'insert into reservations set userId=' + userId + ', roomId=' + roomId;
                                        _this._connection.query(queryString3, function (err, ok) {
                                            if (err) {
                                                global_1.logger.error('[SQL_INSERT_ERROR] ', err.message);
                                                callback('SIE', null);
                                            }
                                            else {
                                                callback(null, ok);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    };
    return DB;
}());
exports.DB = DB;
