/* eslint no-plusplus: "off" */
import promisify from 'promisify-node';
import phpRunner from 'child_process';
import path from 'path';
import fs from 'fs';

async function generatePorts() {
  const execPHP = promisify(phpRunner.exec);
  const phpList = await execPHP('php script.php addIpv6');
  const ip_list = JSON.parse(phpList);
  const configPath = '/etc/squid/ports.conf';

  let count = 0;
  while (count < ip_list.length) {
    const port = Math.floor(8000 + count);

    const string = `
http_port ${port} name=${port}
acl tasty${port} myportname ${port} src all dst ipv6
http_access allow tasty${port}
tcp_outgoing_address ${ip_list[count]} tasty${port}
    `;

    fs.writeFileSync(configPath, string);
    count++;
  }

  console.log(ip_list);
}

// function removeLine() {}

export async function getRandomPort() {
  const filePath = `${path.resolve(__dirname, '..', '..')}/temp/ports.json`;
  const hasFile = fs.existsSync(filePath);

  // create
  if (!hasFile) {
    fs.writeFileSync(filePath, '');
  }

  const line = fs.readFileSync(filePath, { encoding: 'utf-8' });

  if (line.length === 0) {
    await generatePorts();
  }
}
