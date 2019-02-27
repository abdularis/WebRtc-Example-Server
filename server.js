const express = require('express');
const IO = require('socket.io');
const Http = require('http');

const PORT = 3000;
const app = express();
const httpClient = Http.Server(app);
const io = IO(httpClient);

const EVENT_CREATE_ID = "/api/create";
const EVENT_OFFER_CALL = "/api/offerCall";
const EVENT_RECEIVE_CALL = "/api/receiveCall";
const EVENT_SEND_NEW_ICE = "/api/newIce";
const EVENT_RECEIVE_NEW_ICE = "/api/receiveIce";
const EVENT_ANSWER_CALL = "/api/answerCall";
const EVENT_RECEIVE_ANSWER_CALL = "/api/receiveAnswerCall";

const peers = new Map();
const UserIdBySockId = new Map();

io.on('connection', (socket) => {
    socket.on(EVENT_CREATE_ID, (data, ack) => {
        console.log(`new id ${data.id}`);
        peers[data.id] = socket.id;
        UserIdBySockId[socket.id] = data.id;
        ack();
    });

    socket.on(EVENT_OFFER_CALL, (data, ack) => {
        const peerSock = io.sockets.connected[peers[data.to_id]];
        if (peerSock) {
            peerSock.emit(EVENT_RECEIVE_CALL, {
                from_id: UserIdBySockId[socket.id],
                sdp: data.sdp
            });

            console.log('sent call offer to ' + data.to_id);
        } else {
            console.log('there is no ' + data.to_id);
        }
        ack();
    });

    socket.on(EVENT_SEND_NEW_ICE, (data, ack) => {
        const peerSock = io.sockets.connected[peers[data.to_id]];
        if (peerSock) {
            peerSock.emit(EVENT_RECEIVE_NEW_ICE, {
                from_id: UserIdBySockId[socket.id],
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex,
                sdp: data.sdp
            });

            console.log('sent ice candidate to ' + data.to_id);
        }
        ack();
    });

    socket.on(EVENT_ANSWER_CALL, (data, ack) => {
        const peerSock = io.sockets.connected[peers[data.to_id]];
        if (peerSock) {
            peerSock.emit(EVENT_RECEIVE_ANSWER_CALL, {
                from_id: UserIdBySockId[socket.id],
                sdp: data.sdp
            });

            console.log('sent answer call to ' + data.to_id);
        }

        ack();
    });

    socket.on('disconnect', () => {
        console.log('disconnect');
    })
});

httpClient.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});