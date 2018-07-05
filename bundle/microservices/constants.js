"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TCP_DEFAULT_PORT = 3000;
exports.TCP_DEFAULT_HOST = 'localhost';
exports.REDIS_DEFAULT_URL = 'redis://localhost:6379';
exports.NATS_DEFAULT_URL = 'nats://localhost:4222';
exports.MQTT_DEFAULT_URL = 'mqtt://localhost:1883';
exports.GRPC_DEFAULT_URL = 'localhost:5000';
exports.CONNECT_EVENT = 'connect';
exports.MESSAGE_EVENT = 'message';
exports.ERROR_EVENT = 'error';
exports.CLOSE_EVENT = 'close';
exports.SUBSCRIBE = 'subscribe';
exports.CANCEL_EVENT = 'cancelled';
exports.PATTERN_METADATA = 'pattern';
exports.CLIENT_CONFIGURATION_METADATA = 'client';
exports.CLIENT_METADATA = '__isClient';
exports.PATTERN_HANDLER_METADATA = '__isPattern';
exports.NO_PATTERN_MESSAGE = `There is no equivalent message pattern defined in the remote service.`;
