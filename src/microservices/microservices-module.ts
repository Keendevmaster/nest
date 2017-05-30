import { InstanceWrapper } from '@nestjs/core/injector/container';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { ListenersController } from './listeners-controller';
import { CustomTransportStrategy } from './interfaces';
import { Server } from './server/server';

export class MicroservicesModule {
    private static readonly listenersController = new ListenersController();

    public static setupListeners(container, server: Server & CustomTransportStrategy) {
        const modules = container.getModules();
        modules.forEach(({ routes }) => this.bindListeners(routes, server));
    }

    public static setupClients(container) {
        const modules = container.getModules();
        modules.forEach(({ routes, components }) => {
            this.bindClients(routes);
            this.bindClients(components);
        });
    }

    public static bindListeners(
        controllers: Map<string, InstanceWrapper<Controller>>,
        server: Server & CustomTransportStrategy) {

        controllers.forEach(({ instance }) => {
            this.listenersController.bindPatternHandlers(instance, server);
        });
    }

    public static bindClients(controllers: Map<string, InstanceWrapper<Controller>>) {
        controllers.forEach(({ instance, isNotMetatype }) => {
            !isNotMetatype && this.listenersController.bindClientsToProperties(instance);
        });
    }
}