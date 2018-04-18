import { Controller, Get } from '@nestjs/common';
import {
  Client,
  MessagePattern,
  ClientProxy,
  Transport,
} from '@nestjs/microservices';
import { Observable } from 'rxjs/Observable';
import { scan, take } from 'rxjs/operators';

@Controller()
export class NatsBroadcastController {
  @Client({ transport: Transport.NATS })
  client: ClientProxy;

  @Get('broadcast')
  multicats() {
    return this.client
      .send<number>({ cmd: 'broadcast' }, {})
      .pipe(scan((a, b) => a + b), take(2));
  }

  @MessagePattern({ cmd: 'broadcast' })
  replyBroadcast(): Observable<number> {
    return new Observable(observer => observer.next(1));
  }
}
