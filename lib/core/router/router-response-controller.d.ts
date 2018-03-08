import { RequestMethod, HttpServer } from '@nestjs/common';
export declare class RouterResponseController {
    private readonly applicationRef;
    constructor(applicationRef: HttpServer);
    apply(resultOrDeffered: any, response: any, httpStatusCode: number): Promise<any>;
    render(resultOrDeffered: any, response: any, template: string): Promise<void>;
    transformToResult(resultOrDeffered: any): Promise<any>;
    getStatusByMethod(requestMethod: RequestMethod): number;
}
