/* eslint no-useless-escape: "off", camelcase: "off" */
import path from 'path';
import fs from 'fs/promises';

export async function logData(string: string): Promise<void> {
  const parsedMEssage = `${string}\r\n====\r\n`;
  const filePath = `${path.resolve(__dirname, '..', '..')}/temp/logs.data`;

  await fs.writeFile(filePath, parsedMEssage, { flag: 'a' });
}
