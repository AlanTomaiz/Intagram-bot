/* eslint no-plusplus: "off" */
import promisify from 'promisify-node';
import phpRunner from 'child_process';

export async function setSession(data: any) {
  const parsedData = Buffer.from(JSON.stringify(data)).toString('base64');

  const execPHP = promisify(phpRunner.exec);
  await execPHP(`php session.php ${parsedData}`);
}
