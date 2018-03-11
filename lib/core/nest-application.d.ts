/// <reference types="node" />
import * as http from 'http';
import {
  CanActivate,
  ExceptionFilter,
  NestInterceptor,
  PipeTransform,
  WebSocketAdapter,
} from '@nestjs/common';
import { INestApplication, INestMicroservice } from '@nestjs/common';
import { MicroserviceConfiguration } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';
import { ApplicationConfig } from './application-config';
import { NestContainer } from './injector/container';
import { NestApplicationContext } from './nest-application-context';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
export declare class NestApplication extends NestApplicationContext
  implements INestApplication {
  private readonly express;
  private readonly config;
  private readonly appOptions;
  private readonly logger;
  private readonly middlewaresModule;
  private readonly middlewaresContainer;
  private readonly microservicesModule;
  private readonly socketModule;
  private readonly httpServer;
  private readonly routesResolver;
  private readonly microservices;
  private isInitialized;
  constructor(
    container: NestContainer,
    express: any,
    config: ApplicationConfig,
    appOptions?: NestApplicationOptions,
  );
  applyOptions(): this;
  createServer(): any;
  setupModules(): Promise<void>;
  init(): Promise<this>;
  setupParserMiddlewares(): void;
  isMiddlewareApplied(app: any, name: string): boolean;
  setupRouter(): Promise<void>;
  connectMicroservice(config: MicroserviceConfiguration): INestMicroservice;
  getMicroservices(): INestMicroservice[];
  getHttpServer(): http.Server;
  startAllMicroservices(callback?: () => void): this;
  startAllMicroservicesAsync(): Promise<void>;
  use(...args: any[]): this;
  engine(...args: any[]): this;
  set(...args: any[]): this;
  disable(...args: any[]): this;
  enable(...args: any[]): this;
  enableCors(options?: CorsOptions): this;
  listen(port: number | string, callback?: () => void): any;
  listen(port: number | string, hostname: string, callback?: () => void): any;
  listenAsync(port: number | string, hostname?: string): Promise<any>;
  close(): void;
  setGlobalPrefix(prefix: string): this;
  useWebSocketAdapter(adapter: WebSocketAdapter): this;
  useGlobalFilters(...filters: ExceptionFilter[]): this;
  useGlobalPipes(...pipes: PipeTransform<any>[]): this;
  useGlobalInterceptors(...interceptors: NestInterceptor[]): this;
  useGlobalGuards(...guards: CanActivate[]): this;
  private setupMiddlewares(instance);
  private listenToPromise(microservice);
  private callInitHook();
  private callModuleInitHook(module);
  private hasOnModuleInitHook(instance);
  private callDestroyHook();
  private callModuleDestroyHook(module);
  private hasOnModuleDestroyHook(instance);
}
