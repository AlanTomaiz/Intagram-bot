/* eslint no-plusplus: "off" */
import promisify from 'promisify-node';
import phpRunner from 'child_process';
import path from 'path';
import fs from 'fs';

const tempPath = path.resolve(__dirname, '..', '..', 'temp');

async function removeIps() {
  const hasFile = fs.existsSync(`${tempPath}/ip_list.conf`);

  if (hasFile) {
    const execPHP = promisify(phpRunner.exec);
    const dataFile = fs.readFileSync(`${tempPath}/ip_list.conf`, {
      encoding: 'utf-8',
    });

    const lines = dataFile.split('\n');
    for await (const ip of lines) {
      await execPHP(`php script.php rmIpv6,${ip}`);
    }
  }
}

export async function generatePorts() {
  const configPath = '/etc/squid/ports.conf';

  await removeIps();

  const execPHP = promisify(phpRunner.exec);
  const phpList = await execPHP('php script.php generatePorts');
  const ip_list = JSON.parse(phpList);
  const port_list = [];

  let count = 0;
  const ip_string = [];
  while (count < ip_list.length) {
    const port = Math.floor(8000 + count);

    const string = `
http_port ${port} name=${port}
acl tasty${port} myportname ${port} src all dst ipv6
http_access allow tasty${port}
tcp_outgoing_address ${ip_list[count]} tasty${port}`;

    ip_string.push(string);
    port_list.push(port);
    count++;
  }

  fs.writeFileSync(configPath, ip_string.join('\n'));
  fs.writeFileSync(`${tempPath}/ports.conf`, port_list.join('\n'));
  fs.writeFileSync(`${tempPath}/ip_list.conf`, ip_list.join('\n'));

  await execPHP('php script.php reloadSquid');
}

export async function getRandomPort() {
  const hasFile = fs.existsSync(`${tempPath}/ports.conf`);

  // create
  if (!hasFile) {
    await generatePorts();
  }

  const dataFile = fs.readFileSync(`${tempPath}/ports.conf`, {
    encoding: 'utf-8',
  });

  const lines = dataFile.split('\n');
  return Number(lines[Math.floor(Math.random() * lines.length)]);
}

export async function killProcessChrome() {
  const execPHP = promisify(phpRunner.exec);

  await execPHP('php script.php killProcessChrome');
}
