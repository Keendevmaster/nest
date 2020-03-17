import { CanActivate } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Controller } from '@nestjs/common/interfaces';
import { isEmpty, isFunction } from '@nestjs/common/utils/shared.utils';
import { iterate } from 'iterare';
import { ApplicationConfig } from '../application-config';
import { ContextCreator } from '../helpers/context-creator';
import { STATIC_CONTEXT } from '../injector/constants';
import { NestContainer } from '../injector/container';
import { InstanceWrapper } from '../injector/instance-wrapper';

export class GuardsContextCreator extends ContextCreator {
  private moduleContext: string;

  constructor(
    private readonly container: NestContainer,
    private readonly config?: ApplicationConfig,
  ) {
    super();
  }

  public create(
    instance: Controller,
    callback: (...args: unknown[]) => unknown,
    module: string,
    contextId = STATIC_CONTEXT,
    inquirerId?: string,
  ): CanActivate[] {
    this.moduleContext = module;
    return this.createContext(
      instance,
      callback,
      GUARDS_METADATA,
      contextId,
      inquirerId,
    );
  }

  public createConcreteContext<T extends unknown[], R extends unknown[]>(
    metadata: T,
    contextId = STATIC_CONTEXT,
    inquirerId?: string,
  ): R {
    if (isEmpty(metadata)) {
      return [] as R;
    }
    return iterate(metadata)
      .filter((guard: any) => guard && (guard.name || guard.canActivate))
      .map(guard =>
        this.getGuardInstance(guard as Function, contextId, inquirerId),
      )
      .filter((guard: CanActivate) => guard && isFunction(guard.canActivate))
      .toArray() as R;
  }

  public getGuardInstance(
    guard: Function | CanActivate,
    contextId = STATIC_CONTEXT,
    inquirerId?: string,
  ): CanActivate | null {
    const isObject = (guard as CanActivate).canActivate;
    if (isObject) {
      return guard as CanActivate;
    }
    const instanceWrapper = this.getInstanceByMetatype(guard);
    if (!instanceWrapper) {
      return null;
    }
    const instanceHost = instanceWrapper.getInstanceByContextId(
      contextId,
      inquirerId,
    );
    return instanceHost && instanceHost.instance;
  }

  public getInstanceByMetatype<T extends Record<string, any> | Function>(
    guard: T,
  ): InstanceWrapper | undefined {
    if (!this.moduleContext) {
      return;
    }
    const collection = this.container.getModules();
    const moduleRef = collection.get(this.moduleContext);
    if (!moduleRef) {
      return;
    }
    const injectables = moduleRef.injectables;
    return injectables.get(guard.name as string);
  }

  public getGlobalMetadata<T extends unknown[]>(
    contextId = STATIC_CONTEXT,
    inquirerId?: string,
  ): T {
    if (!this.config) {
      return [] as T;
    }
    const globalGuards = this.config.getGlobalGuards() as T;
    if (contextId === STATIC_CONTEXT && !inquirerId) {
      return globalGuards;
    }
    const scopedGuardWrappers = this.config.getGlobalRequestGuards() as InstanceWrapper[];
    return iterate(scopedGuardWrappers)
      .map(wrapper => wrapper.getInstanceByContextId(contextId, inquirerId))
      .filter(host => !!host)
      .map(host => host.instance)
      .concat(globalGuards)
      .toArray() as T;
  }
}
