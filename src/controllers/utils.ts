import { logger } from '../utils/logger';

export default class Utils {
  sleep(ms: number) {
    const time = (Math.random() * 1 + 1) * ms;
    return new Promise(resolve => setTimeout(resolve, time));
  }
}
