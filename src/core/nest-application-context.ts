import { ModuleTokenFactory } from './injector/module-token-factory';
import { NestContainer, InstanceWrapper } from './injector/container';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { INestApplicationContext } from '@nestjs/common';

export class NestApplicationContext implements INestApplicationContext {
  private readonly moduleTokenFactory = new ModuleTokenFactory();

  constructor(
    protected readonly container: NestContainer,
    private readonly scope: Type<any>[],
    protected contextModule,
  ) {}

  public selectContextModule() {
    const modules = this.container.getModules().values();
    this.contextModule = modules.next().value;
  }

  public select<T>(module: Type<T>): INestApplicationContext {
    const modules = this.container.getModules();
    const moduleMetatype = this.contextModule.metatype;
    const scope = this.scope.concat(moduleMetatype);

    const token = this.moduleTokenFactory.create(module as any, scope);
    const selectedModule = modules.get(token);
    return selectedModule
      ? new NestApplicationContext(this.container, scope, selectedModule)
      : null;
  }

  public get<T>(typeOrToken: Type<T> | string | symbol): T | null {
    return this.findInstanceByPrototypeOrToken<T>(
      typeOrToken,
      this.contextModule,
    );
  }

  public find<T>(typeOrToken: Type<T> | string | symbol): T | null {
    const modules = this.container.getModules();
    const flattenModule = [...modules.values()].reduce(
      (flatten, curr) => ({
        components: [...flatten.components, ...curr.components],
        routes: [...flatten.routes, ...curr.routes],
        injectables: [...flatten.injectables, ...curr.injectables],
      }),
      {
        components: [],
        routes: [],
        injectables: [],
      },
    );
    return this.findInstanceByPrototypeOrToken<T>(typeOrToken, flattenModule);
  }

  private findInstanceByPrototypeOrToken<T>(
    metatypeOrToken: Type<T> | string | symbol,
    contextModule,
  ): T | null {
    const dependencies = new Map([
      ...contextModule.components,
      ...contextModule.routes,
      ...contextModule.injectables,
    ]);
    const name = isFunction(metatypeOrToken)
      ? (metatypeOrToken as any).name
      : metatypeOrToken;
    const instanceWrapper = dependencies.get(name);
    return instanceWrapper
      ? (instanceWrapper as InstanceWrapper<any>).instance
      : null;
  }
}
