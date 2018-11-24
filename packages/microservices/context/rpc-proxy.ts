import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context.host';
import { Observable } from 'rxjs';
import { RpcExceptionsHandler } from '../exceptions/rpc-exceptions-handler';

export class RpcProxy {
  public create(
    targetCallback: (...args: any[]) => Promise<Observable<any>>,
    exceptionsHandler: RpcExceptionsHandler,
  ): (...args: any[]) => Promise<Observable<any>> {
    return async (...args: any[]) => {
      try {
        return await targetCallback(...args);
      } catch (e) {
        const host = new ExecutionContextHost(args);
        return exceptionsHandler.handle(e, host);
      }
    };
  }
}
