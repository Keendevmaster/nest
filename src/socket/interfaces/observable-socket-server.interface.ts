import { Subject, ReplaySubject } from "rxjs";

export interface ObservableSocketServer {
    server: any;
    init: ReplaySubject<any>;
    connection: Subject<any>;
    disconnect: Subject<any>;
}

