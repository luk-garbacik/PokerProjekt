import { Socket } from "socket.io";

export const playerSocketMap = new Map<number, string>();

export function registerPlayerSocket(playerId: number, socket: Socket) {
    playerSocketMap.set(playerId, socket.id);
}

export function removePlayerSocket(playerId: number) {
    playerSocketMap.delete(playerId);
}

export function getSocketIdByPlayer(playerId: number) {
    return playerSocketMap.get(playerId);
}