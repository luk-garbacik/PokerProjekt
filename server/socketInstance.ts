import { Server } from "socket.io";

let ioInstance: Server;

export function setIO(io: Server) {
    ioInstance = io;
}

export function getIO(): Server {
    return ioInstance;
}
