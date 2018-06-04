import * as net from "net";
import * as events from "events";

/**
 * socketMessageWrapper
 */
declare class SocketMessageWrapper extends events {
    constructor();

    // Properties
    public currConnectedSockets: Set<Mordor.Socket>;

    // Methods
    public broadcastAll(title: string, body?: server.SocketMessage): void;
    public removeSocket(socket: net.Socket): boolean;
    public send(socket: net.Socket, title: string, body: server.SocketMessage): void;
    public disconnectAllSockets(): void;
}

export as namespace SocketMessageWrapper;
export = SocketMessageWrapper;
