import { expect } from 'chai';
import * as sinon from 'sinon';
import { ClientKafka } from '../../client/client-kafka';
import { ConsumerGroupJoinEvent, EachMessagePayload, KafkaMessage } from '../../external/kafka.interface';
import { KafkaHeaders } from '../../enums';
import { NO_MESSAGE_HANDLER } from '../../constants';
import { InvalidKafkaClientTopicException } from '../../errors/invalid-kafka-client-topic.exception';
import { InvalidKafkaClientTopicPartitionException } from '../../errors/invalid-kafka-client-topic-partition.exception';
// tslint:disable:no-string-literal

describe('ClientKafka', () => {
  // helpers
  const objectToMap = obj =>
    new Map(Object.keys(obj).map(key => [key, obj[key]]) as any);

  // static
  const topic = 'test.topic';
  const partition = 0;
  const replyTopic = 'test.topic.reply';
  const replyPartition = '0';
  const correlationId = '696fa0a9-1827-4e59-baef-f3628173fe4f';
  const key = 'test-key';
  const offset = '0';
  const timestamp = (new Date()).toISOString();
  const attributes = 1;
  const messageValue = 'test-message';

  // message
  const message: KafkaMessage = {
    key: Buffer.from(key),
    offset,
    size: messageValue.length,
    value: Buffer.from(messageValue),
    timestamp,
    attributes
  };

  // deserialized message
  const deserializedMessage: any = {
    key,
    offset,
    size: messageValue.length,
    value: messageValue,
    timestamp,
    attributes,
    topic,
    partition
  };

  // payloads
  const payload: EachMessagePayload = {
    topic,
    partition,
    message: Object.assign({
      headers: {
        [KafkaHeaders.CORRELATION_ID]: Buffer.from(correlationId),
      }
    }, message)
  };

  const payloadDisposed: EachMessagePayload = {
    topic,
    partition,
    message: Object.assign({
      headers: {
        [KafkaHeaders.CORRELATION_ID]: Buffer.from(correlationId),
        [KafkaHeaders.NESTJS_IS_DISPOSED]: Buffer.alloc(1)
      }
    }, message, {
      size: 0,
      value: null
    })
  };

  const payloadError: EachMessagePayload = {
    topic,
    partition,
    message: Object.assign({
      headers: {
        [KafkaHeaders.CORRELATION_ID]: Buffer.from(correlationId),
        [KafkaHeaders.NESTJS_ERR]: Buffer.from(NO_MESSAGE_HANDLER)
      }
    }, message, {
      size: 0,
      value: null
    })
  };

  const payloadWithoutCorrelation: EachMessagePayload = {
    topic,
    partition,
    message: Object.assign({
      headers: {}
    }, message)
  };

  // deserialized payload
  const deserializedPayload: EachMessagePayload = {
    topic,
    partition,
    message: Object.assign({
      headers: {
        [KafkaHeaders.CORRELATION_ID]: Buffer.from(correlationId),
      }
    }, deserializedMessage)
  };

  // spys
  let client: ClientKafka;
  let callback: sinon.SinonSpy;
  let connect: sinon.SinonSpy;
  let subscribe: sinon.SinonSpy;
  let run: sinon.SinonSpy;
  let send: sinon.SinonSpy;
  let on: sinon.SinonSpy;

  // stubs
  let consumerStub: sinon.SinonStub;
  let producerStub: sinon.SinonStub;
  let createClientStub: sinon.SinonStub;

  // other
  let kafkaClient;

  beforeEach(() => {
    client = new ClientKafka({});
    callback = sinon.spy();
    connect = sinon.spy();
    subscribe = sinon.spy();
    run = sinon.spy();
    send = sinon.spy();
    on = sinon.spy();

    consumerStub = sinon.stub(client, 'consumer')
      .callsFake(() => {
        return {
          connect,
          subscribe,
          run,
          events: {
            GROUP_JOIN: 'consumer.group_join'
          },
          on
        };
      });
    producerStub = sinon.stub(client, 'producer')
      .callsFake(() => {
        return {
          connect,
          send
        };
      });
    kafkaClient = {
      consumer: consumerStub,
      producer: producerStub,
    };

    createClientStub = sinon.stub(client, 'createClient').callsFake(() => kafkaClient);
  });

  describe('close', () => {
    const consumer = {disconnect: sinon.spy()};
    const producer = {disconnect: sinon.spy()};
    beforeEach(() => {
      (client as any).consumer = consumer;
      (client as any).producer = producer;
    });
    it('should close server', () => {
      client.close();

      expect(consumer.disconnect.calledOnce).to.be.true;
      expect(producer.disconnect.calledOnce).to.be.true;
      expect(client.consumer).to.be.null;
      expect(client.producer).to.be.null;
      expect(client.client).to.be.null;
    });
  });

  describe('connect', () => {
    let consumerAssignmentsStub: sinon.SinonStub;
    let bindTopicsStub: sinon.SinonStub;
    // let handleErrorsSpy: sinon.SinonSpy;

    beforeEach(() => {
      consumerAssignmentsStub = sinon.stub(client as any, 'consumerAssignments');
      bindTopicsStub = sinon.stub(client, 'bindTopics').callsFake(async () => {});
    });

    it('should expect the connection to be created', async () => {
      const connection = await client.connect();

      expect(createClientStub.calledOnce).to.be.true;
      expect(producerStub.calledOnce).to.be.true;
      expect(consumerStub.calledOnce).to.be.true;

      expect(on.calledOnce).to.be.true;
      expect(client['consumerAssignments']).to.be.empty;

      expect(connect.calledTwice).to.be.true;

      expect(bindTopicsStub.calledOnce).to.be.true;
      expect(connection).to.deep.equal(producerStub());
    });

    it('should expect the connection to be reused', async () => {
      client.client = kafkaClient;
      await client.connect();

      expect(createClientStub.calledOnce).to.be.false;
      expect(producerStub.calledOnce).to.be.false;
      expect(consumerStub.calledOnce).to.be.false;

      expect(on.calledOnce).to.be.false;
      expect(client['consumerAssignments']).to.be.empty;

      expect(connect.calledTwice).to.be.false;

      expect(bindTopicsStub.calledOnce).to.be.false;
    });
  });

  describe('setConsumerAssignments', () => {
    it('should update consumer assignments', async () => {
      await client.connect();

      const consumerAssignments: ConsumerGroupJoinEvent = {
        id: 'id',
        type: 'type',
        timestamp: 1234567890,
        payload: {
          duration: 20,
          groupId: 'group-id',
          isLeader: true,
          leaderId: 'member-1',
          groupProtocol: 'RoundRobin',
          memberId: 'member-1',
          memberAssignment: {
            'topic-a': [0, 1, 2]
          }
        }
      };

      client['setConsumerAssignments'](consumerAssignments);
      expect(client['consumerAssignments']).to.deep.eq(consumerAssignments.payload.memberAssignment);
    });
  });

  describe('bindTopics', () => {
    it('should bind explicit topics', async () => {
      const getReplyPatternSpy = sinon.spy(client as any, 'getReplyPattern');

      (client as any).requestMap = objectToMap({
        'topic.request': 'topic.request.reply'
      });

      client.consumer = kafkaClient.consumer();

      // await client.connect();
      await client.bindTopics();

      expect(getReplyPatternSpy.calledOnce).to.be.true;
      expect(subscribe.calledOnce).to.be.true;
      expect(client['getReplyPattern']('topic.request', (ClientKafka as any).REPLY_PATTERN_AFFIX)).to.eq('topic.request.reply');
    });

    it('should bind implicit topics', async () => {
      const getReplyPatternSpy = sinon.spy(client as any, 'getReplyPattern');

      (client as any).requestMap = objectToMap({
        'topic.request.implicit': null
      });

      client.consumer = kafkaClient.consumer();

      // await client.connect();
      await client.bindTopics();

      expect(getReplyPatternSpy.calledOnce).to.be.true;
      expect(subscribe.calledOnce).to.be.true;
      expect(client['getReplyPattern']('topic.request.implicit', (ClientKafka as any).REPLY_PATTERN_AFFIX)).to.eq('topic.request.implicit.reply');
    });
  });

  describe('createResponseCallback', () => {
    let subscription;

    describe('not completed', () => {
      beforeEach(async () => {
        subscription = client.createResponseCallback();

        client['routingMap'].set(correlationId, callback);
        subscription(payload);
      });
      it('should call callback with expected arguments', () => {
        expect(callback.called).to.be.true;
        expect(
          callback.calledWith({
            err: null,
            response: deserializedPayload.message,
          }),
        ).to.be.true;
      });
    });

    describe('disposed and "id" is correct', () => {
      beforeEach(async () => {
        subscription = client.createResponseCallback();

        client['routingMap'].set(correlationId, callback);
        subscription(payloadDisposed);
      });

      it('should call callback with dispose param', () => {
        expect(callback.called).to.be.true;
        expect(
          callback.calledWith({
            isDisposed: true,
            response: null,
            err: null,
          }),
        ).to.be.true;
      });
    });

    describe('error and "id" is correct', () => {
      beforeEach(async () => {
        subscription = client.createResponseCallback();

        client['routingMap'].set(correlationId, callback);
        subscription(payloadError);
      });

      it('should call callback with error param', () => {
        expect(callback.called).to.be.true;
        expect(
          callback.calledWith({
            isDisposed: true,
            response: null,
            err: NO_MESSAGE_HANDLER,
          }),
        ).to.be.true;
      });
    });

    describe('without "id"', () => {
      beforeEach(async () => {
        subscription = client.createResponseCallback();

        client['routingMap'].set(correlationId, callback);
        subscription(payloadWithoutCorrelation);
      });

      it('should not call callback', () => {
        expect(callback.called).to.be.false;
      });
    });

    describe('disposed and "id" is incorrect', () => {
      beforeEach(async () => {
        callback = sinon.spy();
        subscription = client.createResponseCallback();

        client['routingMap'].set('incorrect-correlation-id', callback);
        subscription(payload);
      });

      it('should not call callback', () => {
        expect(callback.called).to.be.false;
      });
    });
  });

  describe('dispatchEvent', () => {
    const eventMessage = {
      id: undefined,
      pattern: topic,
      data: messageValue
    };

    let sendStub: sinon.SinonStub;
    let sendSpy: sinon.SinonSpy;

    beforeEach(() => {
      sendStub = sinon.stub().callsFake(async (a) => {
        throw new Error('ERROR!');
      });
      sendSpy = sinon.spy();
    });

    it('should publish packet', async () => {
      sinon.stub(client, 'producer').value({
        send: sendSpy
      });

      await client['dispatchEvent'](eventMessage);

      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0][0].topic).to.eq(topic);
      expect(sendSpy.args[0][0].messages).to.not.be.empty;

      const sentMessage = sendSpy.args[0][0].messages[0];

      expect(sentMessage.value).to.eq(messageValue);
    });

    it('should throw error', async () => {
      sinon.stub(client, 'producer').value({
        send: sendStub
      });

      client['dispatchEvent'](eventMessage).catch(err =>
        expect(err).to.be.instanceOf(Error),
      );
    });
  });

  describe('getReplyPartition', () => {
    it('should get reply partition', () => {
      client['consumerAssignments'] = {
        [replyTopic]: [0]
      };

      const result = client['getReplyPartition'](replyTopic);

      expect(result).to.eq('0');
    });

    it('should throw error when the topic is being consumed but is not assigned partitions', () => {
      client['consumerAssignments'] = {
        [replyTopic]: []
      };

      expect(() => client['getReplyPartition'](replyTopic)).to.throw(
        InvalidKafkaClientTopicPartitionException
      );
    });

    it('should throw error when the topic is not being consumer', () => {
      client['consumerAssignments'] = {
        [topic]: []
      };

      expect(() => client['getReplyPartition'](replyTopic)).to.throw(
        InvalidKafkaClientTopicException
      );
    });
  });

  describe('publish', () => {
    const readPacket = {
      pattern: topic,
      data: messageValue
    };

    let assignPacketIdStub: sinon.SinonStub;

    let normalizePatternSpy: sinon.SinonSpy;
    let getReplyPatternSpy: sinon.SinonSpy;
    let getReplyPartitionSpy: sinon.SinonSpy;
    let routingMapSetSpy: sinon.SinonSpy;
    let sendSpy: sinon.SinonSpy;

    beforeEach(() => {
      // spy
      normalizePatternSpy = sinon.spy(client as any, 'normalizePattern');
      getReplyPatternSpy = sinon.spy(client as any, 'getReplyPattern');
      getReplyPartitionSpy = sinon.spy(client as any, 'getReplyPartition');
      routingMapSetSpy = sinon.spy((client as any).routingMap, 'set');
      sendSpy = sinon.spy();

      // stub
      assignPacketIdStub = sinon.stub(client as any, 'assignPacketId').callsFake(packet => Object.assign(packet, {
        id: correlationId
      }));

      sinon.stub(client, 'producer').value({
        send: sendSpy
      });

      // set
      client['consumerAssignments'] = {
        [replyTopic]: [parseFloat(replyPartition)]
      };
    });

    it('should assign a packet id', async () => {
      await client['publish'](readPacket, callback);
      expect(assignPacketIdStub.calledWith(readPacket)).to.be.true;
    });

    it('should normalize the pattern', async () => {
      await client['publish'](readPacket, callback);
      expect(normalizePatternSpy.calledWith(topic)).to.be.true;
    });

    it('should get the reply pattern', async () => {
      await client['publish'](readPacket, callback);
      expect(getReplyPatternSpy.calledWith(topic, (ClientKafka as any).REPLY_PATTERN_AFFIX)).to.be.true;
    });

    it('should get the reply partition', async () => {
      await client['publish'](readPacket, callback);
      expect(getReplyPartitionSpy.calledWith(replyTopic)).to.be.true;
    });

    it('should add the callback to the routing map', async () => {
      await client['publish'](readPacket, callback);
      expect(routingMapSetSpy.calledOnce).to.be.true;
      expect(routingMapSetSpy.args[0][0]).to.eq(correlationId);
      expect(routingMapSetSpy.args[0][1]).to.eq(callback);
    });

    it('should send the message with headers', async () => {
      await client['publish'](readPacket, callback);

      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0][0].topic).to.eq(topic);
      expect(sendSpy.args[0][0].messages).to.not.be.empty;

      const sentMessage = sendSpy.args[0][0].messages[0];

      expect(sentMessage.value).to.eq(messageValue);
      expect(sentMessage.headers).to.not.be.empty;
      expect(sentMessage.headers[KafkaHeaders.CORRELATION_ID]).to.eq(correlationId);
      expect(sentMessage.headers[KafkaHeaders.REPLY_TOPIC]).to.eq(replyTopic);
      expect(sentMessage.headers[KafkaHeaders.REPLY_PARTITION]).to.eq(replyPartition);
    });

    describe('on error', () => {
      let clientProducerStub: sinon.SinonStub;
      let sendStub: sinon.SinonStub;

      beforeEach(() => {
        sendStub = sinon.stub().callsFake(() => {
          throw new Error();
        });

        clientProducerStub = sinon.stub(client, 'producer').value({
          send: sendStub
        });
      });

      afterEach(() => {
        clientProducerStub.restore();
      });

      it('should call callback', async () => {
        await client['publish'](readPacket, callback);

        expect(callback.called).to.be.true;
        expect(callback.getCall(0).args[0].err).to.be.instanceof(Error);
      });
    });

    describe('dispose callback', () => {
      let subscription;
      let getReplyPatternStub: sinon.SinonStub;
      let getReplyPartitionStub: sinon.SinonStub;

      beforeEach(async () => {
        // restore
        getReplyPatternSpy.restore();
        getReplyPartitionSpy.restore();

        // return the topic instead of the reply topic
        getReplyPatternStub = sinon.stub(client as any, 'getReplyPattern').callsFake(() => topic);
        getReplyPartitionStub = sinon.stub(client as any, 'getReplyPartition').callsFake(() => '0');

        subscription = await client['publish'](readPacket, callback);
        subscription(payloadDisposed);
      });

      afterEach(() => {
        getReplyPatternStub.restore();
        getReplyPartitionStub.restore();
      });

      it('should remove callback from routing map', async () => {
        expect(client['routingMap'].has(correlationId)).to.be.false;
        expect(client['routingMap'].size).to.eq(0);
      });
    });
  });
});
