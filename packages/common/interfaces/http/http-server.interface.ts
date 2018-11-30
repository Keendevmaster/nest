import { RequestMethod } from '../../enums';
import { NestApplicationOptions } from './../../interfaces/nest-application-options.interface';

export type ErrorHandler<TRequest = any, TResponse = any> = (
  error: any,
  req: TRequest,
  res: TResponse,
  next?: Function,
) => any;
export type RequestHandler<TRequest = any, TResponse = any> = (
  req: TRequest,
  res: TResponse,
  next?: Function,
) => any;

export interface HttpServer<TRequest = any, TResponse = any> {
  use(
    handler:
      | RequestHandler<TRequest, TResponse>
      | ErrorHandler<TRequest, TResponse>,
  ): any;
  use(
    path: string,
    handler:
      | RequestHandler<TRequest, TResponse>
      | ErrorHandler<TRequest, TResponse>,
  ): any;
  get(handler: RequestHandler<TRequest, TResponse>): any;
  get(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  post(handler: RequestHandler<TRequest, TResponse>): any;
  post(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  head(handler: RequestHandler<TRequest, TResponse>): any;
  head(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  delete(handler: RequestHandler<TRequest, TResponse>): any;
  delete(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  put(handler: RequestHandler<TRequest, TResponse>): any;
  put(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  patch(handler: RequestHandler<TRequest, TResponse>): any;
  patch(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  options(handler: RequestHandler<TRequest, TResponse>): any;
  options(path: string, handler: RequestHandler<TRequest, TResponse>): any;
  listen(port: number | string, callback?: () => void): any;
  listen(port: number | string, hostname: string, callback?: () => void): any;
  reply(response: any, body: any, statusCode: number): any;
  render(response: any, view: string, options: any): any;
  setHeader(response: any, name: string, value: string): any;
  setErrorHandler?(handler: Function): any;
  setNotFoundHandler?(handler: Function): any;
  useStaticAssets?(...args: any[]): this;
  setBaseViewsDir?(path: string): this;
  setViewEngine?(engineOrOptions: any): this;
  createMiddlewareFactory(
    method: RequestMethod,
  ): (path: string, callback: Function) => any;
  getRequestMethod?(request: TRequest): string;
  getRequestUrl?(request: TResponse): string;
  getInstance(): any;
  registerParserMiddleware(): any;
  getHttpServer(): any;
  initHttpServer(options: NestApplicationOptions): void;
  close(): any;
}
