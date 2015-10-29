import MainController from './LapsocarteServerController.js'
import * as glbs from '../../Globals.js'

const logString = 'SocketioController';
const logOK  = ' :: ';
const logERR = ' !! ';

let _clients;
let _mainController;

export default class SocketioController {
    constructor() {
        _mainController = new MainController();
        _clients = new Map();
    }

    mc_init(server) {
        this._socket = require('socket.io')(server);
        this._inMsgs();
    }

    mc_sendGeometries(socketId, geoJSON) {
        let client = _clients.get(socketId);
        client.emit(glbs.GIVE_GEOM,geoJSON);
    }

    mc_sendData(socketId, json) {
        let client = _clients.get(socketId);
        client.emit(glbs.GIVE_DATA,json);
    }

    _inMsgs() {
        this._socket.on('connection', function(socket) {
            console.log(logString+logOK+'Socket connection from client '+socket.id);

            // Standard socket administration methods:
            if (!_clients.has(socket.id)) {
                console.log(logString+logOK+'This is a new connection request...');
                _clients.set(socket.id, socket);
            }
            socket.on('disconnect', function() {
                console.log(logString+logOK+'This is a disconnection request...');
                _clients.delete(socket.id);
            });

            // App specific methods:
            socket.on(glbs.INIT, function(msg) {
                console.log(logString+logOK+'Receiving a '+glbs.INIT+' request...');
                _mainController.sc_init(socket.id);
            });
        });
    }
}
