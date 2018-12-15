import { Controller } from '@nestjs/common/interfaces';
import { STATIC_CONTEXT } from '../injector/constants';
import { ContextId } from '../injector/instance-wrapper';

export abstract class ContextCreator {
  public abstract createConcreteContext<T extends any[], R extends any[]>(
    metadata: T,
    contextId?: ContextId,
  ): R;
  public getGlobalMetadata?<T extends any[]>(): T;

  public createContext<T extends any[], R extends any[]>(
    instance: Controller,
    callback: (...args: any[]) => any,
    metadataKey: string,
    contextId = STATIC_CONTEXT,
  ): R {
    const globalMetadata =
      this.getGlobalMetadata && this.getGlobalMetadata<T>();
    const classMetadata = this.reflectClassMetadata<T>(instance, metadataKey);
    const methodMetadata = this.reflectMethodMetadata<T>(callback, metadataKey);
    return [
      ...this.createConcreteContext<T, R>(
        globalMetadata || ([] as T),
        contextId,
      ),
      ...this.createConcreteContext<T, R>(classMetadata, contextId),
      ...this.createConcreteContext<T, R>(methodMetadata, contextId),
    ] as R;
  }

  public reflectClassMetadata<T>(instance: Controller, metadataKey: string): T {
    const prototype = Object.getPrototypeOf(instance);
    return Reflect.getMetadata(metadataKey, prototype.constructor);
  }

  public reflectMethodMetadata<T>(
    callback: (...args: any[]) => any,
    metadataKey: string,
  ): T {
    return Reflect.getMetadata(metadataKey, callback);
  }
}
