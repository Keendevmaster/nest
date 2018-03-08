import { WebSocketAdapter } from './websockets/web-socket-adapter.interface';
import { ExceptionFilter } from './exceptions/exception-filter.interface';
import { PipeTransform } from './features/pipe-transform.interface';
import { NestInterceptor } from './features/nest-interceptor.interface';
import { CanActivate } from './features/can-activate.interface';
import { INestApplicationContext } from './nest-application-context.interface';
export interface INestMicroservice extends INestApplicationContext {
    /**
     * Starts the microservice.
     *
     * @param  {Function} callback
     * @returns Promise
     */
    listen(callback: () => void): any;
    /**
     * Starts the microservice and can be awaited.
     *
     * @returns Promise
     */
    listenAsync(): Promise<any>;
    /**
     * Setup Ws Adapter which will be used inside Gateways.
     * Use, when you want to override default `socket.io` library.
     *
     * @param  {WebSocketAdapter} adapter
     * @returns void
     */
    useWebSocketAdapter(adapter: WebSocketAdapter): this;
    /**
     * Setups exception filters as a global filters (will be used within every message pattern handler)
     *
     * @param  {ExceptionFilter[]} ...filters
     */
    useGlobalFilters(...filters: ExceptionFilter[]): this;
    /**
     * Setups pipes as a global pipes (will be used within every message pattern handler)
     *
     * @param  {PipeTransform[]} ...pipes
     */
    useGlobalPipes(...pipes: PipeTransform<any>[]): this;
    /**
     * Setups interceptors as a global interceptors (will be used within every message pattern handler)
     *
     * @param  {NestInterceptor[]} ...interceptors
     */
    useGlobalInterceptors(...interceptors: NestInterceptor[]): this;
    /**
     * Setups guards as a global guards (will be used within every message pattern handler)
     *
     * @param  {CanActivate[]} ...guards
     */
    useGlobalGuards(...guards: CanActivate[]): this;
    /**
     * Terminates the application (both NestMicroservice and Gateways)
     *
     * @returns void
     */
    close(): void;
}
