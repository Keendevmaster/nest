import { REDIRECT_METADATA } from '../../constants';

/**
 * Redirects request.
 */
export function Redirect(url: string, statusCode?: number): MethodDecorator {
  return (target: object, key, descriptor) => {
    Reflect.defineMetadata(
      REDIRECT_METADATA,
      { statusCode, url },
      descriptor.value,
    );
    return descriptor;
  };
}
