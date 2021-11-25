import { generatePorts } from './handlePorts';
import { logger } from './logger';

async function init() {
  logger.info('ReloadSquid...');
  await generatePorts();
}

init();
