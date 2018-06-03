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
        }
    }

}

export as namespace server;
export = server;
