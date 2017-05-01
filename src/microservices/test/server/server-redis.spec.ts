import * as sinon from 'sinon';
import { expect } from 'chai';
import { NO_PATTERN_MESSAGE } from '../../constants';
import { ServerRedis } from '../../server/server-redis';

describe('ServerRedis', () => {
    let server: ServerRedis;
    beforeEach(() => {
        server = new ServerRedis({});
    });
    describe('listen', () => {
        let createRedisClient;
        let onSpy: sinon.SinonSpy;
        let client;

        beforeEach(() => {
            onSpy = sinon.spy();
            client = {
                on: onSpy,
            };
            createRedisClient = sinon.stub(server, 'createRedisClient').callsFake(() => client);
        });
        it('should bind "connect" event to handler', () => {
            server.listen(null);
            expect(onSpy.getCall(0).args[0]).to.be.equal('connect');
        });
    });
    describe('handleConnection', () => {
        let onSpy: sinon.SinonSpy,
            subscribeSpy: sinon.SinonSpy,
            sub;

        beforeEach(() => {
            onSpy = sinon.spy();
            subscribeSpy = sinon.spy();
            sub = {
                on: onSpy,
                subscribe: subscribeSpy,
            };
        });
        it('should bind "message" event to handler', () => {
            server.handleConnection(null, sub, null);
            expect(onSpy.getCall(0).args[0]).to.be.equal('message')
        });
        it('should subscribe each acknowledge patterns', () => {
            const pattern = 'test';
            const handler = sinon.spy();
            (server as any).msgHandlers = {
                [pattern]: handler,
            };
            server.handleConnection(null, sub, null);

            const expectedPattern = 'test_ack';
            expect(subscribeSpy.calledWith(expectedPattern)).to.be.true;
        });
        it('should call callback if exists', () => {
            const callback = sinon.spy();
            server.handleConnection(callback, sub, null);
            expect(callback.calledOnce).to.be.true;
        });
    });
    describe('getMessageHandler', () => {
        it(`should return function`, () => {
            expect(typeof server.getMessageHandler(null)).to.be.eql('function');
        });
    });
    describe('handleMessage', () => {
        let getPublisherSpy: sinon.SinonSpy;
        const channel = 'test';
        const data = 'test';

        beforeEach(() => {
            getPublisherSpy = sinon.spy();
            sinon.stub(server, 'getPublisher').callsFake(() => getPublisherSpy);
            sinon.stub(server, 'tryParse').callsFake(() => ({ data }));
        });
        it(`should publish NO_PATTERN_MESSAGE if pattern not exists in msgHandlers object`, () => {
            server.handleMessage(channel, {}, null);
            expect(getPublisherSpy.calledWith({ err: NO_PATTERN_MESSAGE })).to.be.true;
        });
        it(`should call handler with expected arguments`, () => {
            const handler = sinon.spy();
            (server as any).msgHandlers = {
                [channel]: handler,
            };

            server.handleMessage(channel, {}, null);
            expect(handler.getCall(0).args[0]).to.eql(data);
        });
    });
    describe('getMessageHandlerCallback', () => {
        let publisherSpy: sinon.SinonSpy, handler;
        beforeEach(() => {
            publisherSpy = sinon.spy();
            sinon.stub(server, 'getPublisher').callsFake(() => publisherSpy);
            handler = server.getMessageHandlerCallback(null, null);
        });
        it(`should return function`, () => {
            expect(typeof server.getMessageHandlerCallback(null, '')).to.be.eql('function');
        });
        it(`should change order when second parameter is undefined or null`, () => {
            const response = 'test';
            handler(response);

            expect(publisherSpy.calledWith({ err: null, response })).to.be.true;
        });
        it(`should call publish with expected message object`, () => {
            const err = 'err';
            const response = 'test';
            handler(err, response);

            expect(publisherSpy.calledWith({ err, response })).to.be.true;
        });
    });
    describe('getPublisher', () => {
        let publisherSpy: sinon.SinonSpy;
        let pub, publisher;
        const pattern = 'test';

        beforeEach(() => {
            publisherSpy = sinon.spy();
            pub = {
                publish: publisherSpy,
            };
            publisher = server.getPublisher(pub, pattern);
        });
        it(`should return function`, () => {
            expect(typeof server.getPublisher(null, null)).to.be.eql('function');
        });
        it(`should call "publish" with expected arguments`, () => {
            const respond = 'test';
            publisher(respond);
            expect(publisherSpy.calledWith(`${pattern}_res`, JSON.stringify(respond))).to.be.true;
        });
    });
    describe('tryParse', () => {
        it(`should return parsed json`, () => {
            const obj = { test: 'test' };
            expect(server.tryParse(obj)).to.deep.equal(JSON.parse(JSON.stringify(obj)));
        });
        it(`should not parse argument if it is not an object`, () => {
            const content = 'test';
            expect(server.tryParse(content)).to.equal(content);
        });
    });
    describe('getAckPatternName', () => {
        const test = 'test';
        it(`should append _ack to string`, () => {
            const expectedResult = test + '_ack';
            expect(server.getAckQueueName(test)).to.equal(expectedResult);
        });
    });
    describe('getResPatternName', () => {
        const test = 'test';
        it(`should append _res to string`, () => {
            const expectedResult = test + '_res';
            expect(server.getResQueueName(test)).to.equal(expectedResult);
        });
    });
});