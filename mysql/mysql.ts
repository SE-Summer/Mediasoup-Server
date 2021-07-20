//import {mysql} from "mysql"
const mysql = require("mysql")

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

    async getUsers(){
        this._connection.query(
            'select * from users',
            (err, rows)=>{
                if(err){
                    console.log('[SQL SELECT ERROR] ', err.message);
                    return;
                }

            }
        )
    }
}