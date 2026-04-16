export const useStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F
): F => {
  return store(callback as (state: T) => F) as F;
};
