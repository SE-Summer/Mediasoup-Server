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

    getRooms(callback){
        this._connection.query(
            'select * from rooms',
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

    register(email, verify, nickname, password, callback){
        const queryString = 'select * from users where email="'+email + '"';
        this._connection.query(
            queryString,
            (err, rows)=>{
                if(err){
                    console.log('[SQL_INSERT_ERROR] ', err.message);
                    callback("SIE", null)
                }else{
                    const user = rows[0];
                    if (verify !== user.verify){
                        callback("WVC", null)
                    }else{
                        const queryString2 = 'update users set password="'+password+'",nickname="'+nickname+'",verify=null where email="'+email+'"';
                        this._connection.query(
                            queryString2,
                            (err, ok)=>{
                                if(err){
                                    console.log('[SQL_UPDATE_ERROR] ', err.message);
                                    callback("SUE", null)
                                }else{
                                    callback(null, user)
                                }
                            }
                        )
                    }
                }
            }
        )
    }

    verify(email, callback){
        const verify = randomString(6);
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

    appoint(host, password, start_time, end_time, max_num, topic, callback){
        const queryString = 'insert into rooms set host='+host+',start_time="'+start_time+'",end_time="'+end_time+'",max_num='+max_num+',topic="'+topic+'",token="'+randomString()+'",password="'+password+'"'
        this._connection.query(
            queryString,
            (err, ok)=>{
                if(err){
                    console.log('[SQL_INSERT_ERROR] ', err.message);
                    callback('SIE', null)
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
                        room.start_time = moment(room.start_time).format('YYYY-MM-DD HH:mm:ss');
                        room.end_time = moment(room.end_time).format('YYYY-MM-DD HH:mm:ss');
                        if(room.password === password){
                            if(room.start_time > moment().format('YYYY-MM-DD HH:mm:ss')
                                || room.end_time < moment().format('YYYY-MM-DD HH:mm:ss')){
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

}