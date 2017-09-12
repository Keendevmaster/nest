import { Application } from 'express';
import { NestContainer, InstanceWrapper } from '../injector/container';
import { RouterProxy } from './router-proxy';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Logger } from '@nestjs/common/services/logger.service';
import { ControllerMappingMessage } from '../helpers/messages';
import { Resolver } from './interfaces/resolver.interface';
import { RouterExceptionFilters } from './router-exception-filters';
import { MetadataScanner } from '../metadata-scanner';
import { RouterExplorer } from './interfaces/explorer.inteface';
import { ExpressRouterExplorer } from './router-explorer';
import { ApplicationConfig } from './../application-config';

export class RoutesResolver implements Resolver {
    private readonly logger = new Logger(RoutesResolver.name);
    private readonly routerProxy = new RouterProxy();
    private readonly routerExceptionsFilter: RouterExceptionFilters;
    private readonly routerBuilder: RouterExplorer;

    constructor(
        private readonly container: NestContainer,
        private readonly expressAdapter,
        private readonly config: ApplicationConfig) {

        this.routerExceptionsFilter = new RouterExceptionFilters(config);
        this.routerBuilder = new ExpressRouterExplorer(
            new MetadataScanner(), this.routerProxy, expressAdapter,
            this.routerExceptionsFilter, config, this.container,
        );
    }

    public resolve(express: Application) {
        const modules = this.container.getModules();
        modules.forEach(({ routes }, moduleName) => this.setupRouters(routes, moduleName, express));
    }

    public setupRouters(
        routes: Map<string, InstanceWrapper<Controller>>,
        moduleName: string,
        express: Application) {

        routes.forEach(({ instance, metatype }) => {
            this.logger.log(ControllerMappingMessage(metatype.name));

            const { path, router } = this.routerBuilder.explore(instance, metatype, moduleName);
            express.use(path, router);
        });
        this.setupExceptionHandler(express);
    }

    public setupExceptionHandler(express: Application) {
        const callback = (err, req, res, next) => {
            throw err;
        };
        const exceptionHandler = this.routerExceptionsFilter.create({}, callback as any);
        const proxy = this.routerProxy.createExceptionLayerProxy(callback, exceptionHandler);
        express.use(proxy);
    }
}