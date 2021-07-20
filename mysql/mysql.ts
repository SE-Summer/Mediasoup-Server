
import {mysql} from "mysql"

class DB {
    _connection

    init(){
        const mysql = require("mysql")

        this._connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '655566',
                database: 'test'
            });

        this._connection.connect();
    }
}