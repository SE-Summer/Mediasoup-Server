//import {mysql} from "mysql"
const mysql = require("mysql")
const moment = require('moment');
import {sendMail} from './send-email'

const randomString = require("string-random")

export class DB {
    private _connection;

    constructor() {
        this._connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '655566',
            database: 'test'
        });

        this._connection.connect();
    }

    getUsers(callback){
        this._connection.query(
            'select * from users',
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    callback(null, rows)
                }
            }
        )
    }

    getRooms(token, callback){
        this._connection.query(
            'select r.id, r.token, r.password, r.host, r.end_time, r.start_time, r.topic, r.max_num from rooms r, users u, reservations e where u.id=e.userId and r.id=e.roomId and u.token="' + token +'" order by r.start_time desc',
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    callback(null, rows)
                }
            }
        )
    }

    isHost(userToken, roomToken, callback){
        const queryString = 'select * from rooms where token="'+roomToken+'"';
        this._connection.query(
            queryString,
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    if (rows.length === 0){
                        callback('No Such Room', null);
                    }else{
                        const host = rows[0].host;
                        const queryString2 = 'select * from users where token="'+userToken+'"';
                        this._connection.query(
                            queryString2,
                            (err, rows)=>{
                                if(err){
                                    console.log('[SQL_SELECT_ERROR] ', err.message);
                                    callback('SSE', null)
                                }else{
                                    if (rows.length === 0){
                                        callback('No Such User', null);
                                    }else if (rows[0].id === host){
                                        callback(null, true);
                                    }else{
                                        callback(null, false);
                                    }
                                }
                            }
                        )
                    }
                }
            }
        )
    }

    setHost(userToken, roomToken, callback){
        const queryString = 'select * from users where token="'+userToken+'"';
        this._connection.query(
            queryString,
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    if (rows.length === 0){
                        callback('No Such User', null);
                    }else{
                        const id = rows[0].id;
                        const queryString2 = 'update rooms set host='+id+' where token="'+roomToken+'"';
                        this._connection.query(
                            queryString2,
                            (err, ok)=>{
                                if(err){
                                    console.log('[SQL_SELECT_ERROR] ', err.message);
                                    callback('SSE', null)
                                }else{
                                    if (ok.changedRows === 0){
                                        callback('No Such Room', null);
                                    }else{
                                        callback(null, true);
                                    }
                                }
                            }
                        )
                    }
                }
            }
        )
    }

    register(token, nickname, password, callback){
        const queryString = 'update users set nickname="'+ nickname +'", password="'+password+'", verify=null where token="'+token+'"';
        this._connection.query(
            queryString,
            (err, ok)=>{
                if(err){
                    console.log('[SQL_INSERT_ERROR] ', err.message);
                    callback("SIE", null)
                }else{
                    if (ok.changedRows > 0){
                        callback(null, ok)
                    }else{
                        callback("Wrong Token", null);
                    }
                }
            }
        )
    }

    sendEmail(email, callback){
        const verify = randomString(6).toUpperCase();
        const queryString = 'insert into users set email="'+email+'",verify="'+verify+'"';
        sendMail(email, verify, (succ)=>{
            if (succ){
                console.log("Email Send: ", verify);
            }else{
                console.log("Email Send Failed!")
            }
        })
        this._connection.query(
            queryString,
            (err, ok)=>{
                if(err){
                    const queryString = 'update users set verify="'+verify+'" where email="'+email+'"';
                    this._connection.query(
                        queryString,
                        (err, ok)=>{
                            if(err){
                                console.log('[SQL_UPDATE_ERROR] ', err.message);
                                callback("SUE", null)
                            }else{
                                callback(null, ok)
                            }
                        }
                    )
                }else{
                    callback(null, ok)
                }
            }
        )
    }

    verify(email, verify, callback){
        const token = randomString(32);
        const queryString = 'update users set token="'+ token +'" where verify="'+verify+'" and email="'+email+'"';
        this._connection.query(
            queryString,
            (err, ok)=>{
                if(err){
                    console.log('[SQL_UPDATE_ERROR] ', err.message);
                    callback("SUE", null)
                }else{
                    if (ok.changedRows > 0){
                        callback(null, token);
                    }else{
                        callback("Wrong Verify Code", null);
                    }
                }
            }
        )
    }

    login(email, password, callback){
        const queryString = 'select * from users where email="'+email+'"and password="'+password+'"'
        const updateString = 'update users set token="'+ randomString(32) +'" where email="'+email+'"and password="'+password+'"'
        this._connection.query(
            updateString,(err, ok)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('Unauthorized', null)
                }else{
                    this._connection.query(
                        queryString,
                        (err, rows)=>{
                            if(err){
                                console.log('[SQL_SELECT_ERROR] ', err.message);
                                callback('SSE', null)
                            }else{
                                callback(null, rows)
                            }
                        }
                    )
                }
            }
        )
    }

    autoLogin(token, callback){
        const queryString = 'select * from users where token="'+token+'"'
        this._connection.query(
            queryString,
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    callback(null, rows)
                }
            }
        )

    }

    appoint(token, password, start_time, end_time, max_num, topic, callback){
        if(start_time >= end_time){
            callback("Invalid End Time", null);
            return;
        }else if (moment(start_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm') < moment().format('YYYY-MM-DD HH:mm')){
            callback("Invalid Start Time", null);
            return;
        }
        const queryString = 'select users.id from users where token="' + token + '"';
        let host;
        this._connection.query(
            queryString,
            (err, rows)=> {
                if (err) {
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null);
                    return;
                } else {
                    if (rows[0]){
                        host = rows[0].id
                        const queryString2 = 'insert into rooms set host='+host+',start_time="'+start_time+'",end_time="'+end_time+'",max_num='+max_num+',topic="'+topic+'",token="'+randomString()+'",password="'+password+'"'
                        this._connection.query(
                            queryString2,
                            (err, ok)=>{
                                if(err){
                                    console.log('[SQL_INSERT_ERROR] ', err.message);
                                    callback('SIE', null)
                                }else{
                                    this._connection.query(
                                        'insert into reservations set userId='+host+', roomId='+ok.insertId,
                                        (err, ok2)=>{
                                            if(err){
                                                console.log('[SQL_SELECT_ERROR] ', err.message);
                                                callback('SSE', null)
                                            }else{
                                                const queryString2 = 'select * from rooms where id='+ok.insertId;
                                                this._connection.query(
                                                    queryString2,
                                                    (err, rows)=>{
                                                        if(err){
                                                            console.log('[SQL_SELECT_ERROR] ', err.message);
                                                            callback('SSE', null)
                                                        }else{
                                                            callback(null, rows);
                                                        }
                                                    }
                                                )
                                            }
                                        }
                                    )

                                }
                            }
                        )
                    }else{
                        callback('Wrong Token', null);
                        return;
                    }
                }
            }
        )
    }

    getRoom(id, password, callback){
        const queryString = 'select * from rooms where id='+id
        this._connection.query(
            queryString,
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SEE', null)
                }else{
                    const room = rows[0];
                    if(room){
                        room.start_time = moment(room.start_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm');
                        room.end_time = moment(room.end_time, moment.ISO_8601).format('YYYY-MM-DD HH:mm');
                        const now_time = moment().format('YYYY-MM-DD HH:mm');
                        if(room.password === password){
                            if(room.start_time > now_time || room.end_time < now_time){
                                console.log(room.start_time, room.end_time, now_time)
                                callback("Invalid Time", room);
                            }else{
                                callback(null, room);
                            }
                        }else{
                            callback('Unauthorized', null)
                        }
                    }else{
                        callback("No Such Room", null)
                    }
                }
            }
        )
    }

    getPortrait(token, callback){
        this._connection.query(
            'select users.portrait from users where token="'+token+'"',
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    if (rows.length === 0){
                        callback("Wrong Token", null);
                    }else{
                        callback(null, rows[0].portrait);
                    }
                }
            }
        )
    }

    savePortrait(token, path, callback){
        const queryString = 'update users set portrait="'+path+'" where token="'+token+'"';
        this._connection.query(
            queryString,
            (err, ok)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null);
                }else if (ok.changedRows === 0){
                    callback('Wrong Token', null);
                }else{
                    callback(null, ok);
                }
            }
        )
    }
    saveFile(token, path, callback){
        this._connection.query(
            'select users.id from users where token="'+token+'"',
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    if (rows.length === 0){
                        callback("Wrong Token", null);
                    }else{
                        const queryString = 'insert into files set path="'+path+'", owner='+rows[0].id;
                        this._connection.query(
                            queryString,
                            (err, ok)=>{
                                if(err){
                                    console.log('[SQL_INSERT_ERROR] ', err.message);
                                    callback('SIE', null);
                                }else {
                                    callback(null, ok);
                                }
                            }
                        )
                    }
                }
            }
        )
    }

    reserve(token, roomId, password, callback){
        let userId;
        this._connection.query(
            'select users.id from users where token="'+token+'"',
            (err, rows)=>{
                if(err){
                    console.log('[SQL_SELECT_ERROR] ', err.message);
                    callback('SSE', null)
                }else{
                    if (rows.length === 0){
                        callback("Wrong Token", null);
                    }else{
                        userId = rows[0].id
                        const queryString = 'select rooms.id from rooms where id='+roomId+' and password="'+password+'"';
                        this._connection.query(
                            queryString,
                            (err, rows)=>{
                                if(err){
                                    console.log('[SQL_SELECT_ERROR] ', err.message);
                                    callback('SEE', null);
                                }else {
                                    if (rows.length === 0){
                                        callback("No Such Room", null);
                                    }else{
                                        const queryString2 = 'insert into reservations set userId='+ userId +', roomId='+roomId;
                                        this._connection.query(
                                            queryString2,
                                            (err, ok)=>{
                                                if(err){
                                                    console.log('[SQL_INSERT_ERROR] ', err.message);
                                                    callback('SIE', null);
                                                }else {
                                                    callback(null, ok);
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        )
                    }
                }
            }
        )
    }
}
