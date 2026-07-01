export interface PollingOptions {
  initialInterval?: number;
  maxInterval?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
  shouldStop?: (result: any) => boolean;
}

export const exponentialBackoff = (
  fn: () => Promise<any>,
  options: PollingOptions = {}
): Promise<any> => {
  const {
    initialInterval = 1000,
    maxInterval = 30000,
    maxRetries = Infinity,
    backoffMultiplier = 2,
    shouldStop,
  } = options;

  let retries = 0;
  let interval = initialInterval;

  const poll = async (): Promise<any> => {
    try {
      const result = await fn();
      
      if (shouldStop?.(result)) {
        return result;
      }

      if (retries >= maxRetries) {
        throw new Error('Max retries exceeded');
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(interval * backoffMultiplier, maxInterval);
      
      return poll();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      retries++;
      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(interval * backoffMultiplier, maxInterval);
      
      return poll();
    }
  };

  return poll();
};
