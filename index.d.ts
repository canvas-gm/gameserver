/// <reference types="node" />
/// <reference types="@types/node" />
/// <reference types="@types/es6-shim" />
import * as net from "net";

declare namespace server {

    export interface Configuration {
        mordor: {
            socket: {
                port: number;
                host?: string;
            },
            retryInterval: number;
        },
        server: {
            port: number;
        }
    }

    export interface Manifest {
        uid: string;
        name: string;
        projects: any[];
    }

    /**
     * Socket Message interface
     */
    export interface SocketMessage {
        title: string;
        body: any;
    }

}

export as namespace server;
export = server;
