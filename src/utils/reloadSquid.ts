import { generatePorts } from './handlePorts';

async function init() {
  await generatePorts();
}

init();
