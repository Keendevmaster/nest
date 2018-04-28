"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = require("./builder");
const resolver_1 = require("./resolver");
const invalid_middleware_exception_1 = require("../errors/exceptions/invalid-middleware.exception");
const request_method_enum_1 = require("@nestjs/common/enums/request-method.enum");
const routes_mapper_1 = require("./routes-mapper");
const router_proxy_1 = require("../router/router-proxy");
const router_method_factory_1 = require("../helpers/router-method-factory");
const runtime_exception_1 = require("../errors/exceptions/runtime.exception");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const router_exception_filters_1 = require("../router/router-exception-filters");
class MiddlewareModule {
    constructor() {
        this.routerProxy = new router_proxy_1.RouterProxy();
        this.routerMethodFactory = new router_method_factory_1.RouterMethodFactory();
    }
    register(middlewareContainer, container, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const appRef = container.getApplicationRef();
            this.routerExceptionFilter = new router_exception_filters_1.RouterExceptionFilters(container, config, appRef);
            this.routesMapper = new routes_mapper_1.RoutesMapper(container);
            this.resolver = new resolver_1.MiddlewareResolver(middlewareContainer);
            const modules = container.getModules();
            yield this.resolveMiddleware(middlewareContainer, modules);
        });
    }
    resolveMiddleware(middlewareContainer, modules) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([...modules.entries()].map(([name, module]) => __awaiter(this, void 0, void 0, function* () {
                const instance = module.instance;
                this.loadConfiguration(middlewareContainer, instance, name);
                yield this.resolver.resolveInstances(module, name);
            })));
        });
    }
    loadConfiguration(middlewareContainer, instance, module) {
        if (!instance.configure)
            return;
        const middlewareBuilder = new builder_1.MiddlewareBuilder(this.routesMapper);
        instance.configure(middlewareBuilder);
        if (!(middlewareBuilder instanceof builder_1.MiddlewareBuilder))
            return;
        const config = middlewareBuilder.build();
        middlewareContainer.addConfig(config, module);
    }
    registerMiddleware(middlewareContainer, applicationRef) {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = middlewareContainer.getConfigs();
            const registerAllConfigs = (module, middlewareConfig) => middlewareConfig.map((config) => __awaiter(this, void 0, void 0, function* () {
                yield this.registerMiddlewareConfig(middlewareContainer, config, module, applicationRef);
            }));
            yield Promise.all([...configs.entries()].map(([module, moduleConfigs]) => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(registerAllConfigs(module, [...moduleConfigs]));
            })));
        });
    }
    registerMiddlewareConfig(middlewareContainer, config, module, applicationRef) {
        return __awaiter(this, void 0, void 0, function* () {
            const { forRoutes } = config;
            yield Promise.all(forRoutes.map((routePath) => __awaiter(this, void 0, void 0, function* () {
                yield this.registerRouteMiddleware(middlewareContainer, routePath, config, module, applicationRef);
            })));
        });
    }
    registerRouteMiddleware(middlewareContainer, routePath, config, module, applicationRef) {
        return __awaiter(this, void 0, void 0, function* () {
            const middlewareCollection = [].concat(config.middleware);
            yield Promise.all(middlewareCollection.map((metatype) => __awaiter(this, void 0, void 0, function* () {
                const collection = middlewareContainer.getMiddleware(module);
                const middleware = collection.get(metatype.name);
                if (shared_utils_1.isUndefined(middleware)) {
                    throw new runtime_exception_1.RuntimeException();
                }
                const { instance } = middleware;
                yield this.bindHandler(instance, metatype, applicationRef, request_method_enum_1.RequestMethod.ALL, routePath);
            })));
        });
    }
    bindHandler(instance, metatype, applicationRef, method, path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (shared_utils_1.isUndefined(instance.resolve)) {
                throw new invalid_middleware_exception_1.InvalidMiddlewareException(metatype.name);
            }
            const exceptionsHandler = this.routerExceptionFilter.create(instance, instance.resolve, undefined);
            const router = this.routerMethodFactory
                .get(applicationRef, method)
                .bind(applicationRef);
            const bindWithProxy = obj => this.bindHandlerWithProxy(exceptionsHandler, router, obj, path);
            const resolve = instance.resolve();
            if (!(resolve instanceof Promise)) {
                bindWithProxy(resolve);
                return;
            }
            const middleware = yield resolve;
            bindWithProxy(middleware);
        });
    }
    bindHandlerWithProxy(exceptionsHandler, router, middleware, path) {
        const proxy = this.routerProxy.createProxy(middleware, exceptionsHandler);
        router(path, proxy);
    }
}
exports.MiddlewareModule = MiddlewareModule;
