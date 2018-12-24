import { isObject } from './shared.utils';

export const createHttpExceptionBody = (
  message: object | string,
  error?: string,
  statusCode?: number,
) => {
  if (!message) {
    return { statusCode, error };
  }
  return isObject(message) ? message : { statusCode, error, message };
};
