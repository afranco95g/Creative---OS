export type ServiceToken<T> =
  symbol & {
    readonly __serviceType?: T;
  };

export function createServiceToken<T>(
  description: string
): ServiceToken<T> {
  return Symbol(
    description
  ) as ServiceToken<T>;
}