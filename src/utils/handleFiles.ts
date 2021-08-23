/* eslint no-useless-escape: "off", camelcase: "off" */
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

import { exists } from './exists';

type ICookies = puppeteer.Protocol.Network.Cookie[];

const directory = path.resolve(__dirname, '..', '..', 'cookies');
const temp = path.resolve(__dirname, '..', '..', 'temp');

export const slug = (filename: string) => {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/([^\w]+|\s+)/g, '-') // Substitui espaço e outros caracteres por hífen
    .replace(/\-\-+/g, '-') // Substitui multiplos hífens por um único hífen
    .replace(/(^-+|-+$)/, ''); // Remove hífens extras do final ou do inicio da string
};

export async function saveCookies(
  filename: string,
  cookie: ICookies,
): Promise<void> {
  const parsedName = slug(filename);
  const filePath = `${directory}/${parsedName}`;
  const jsonParse = JSON.stringify(cookie);

  await fs.writeFile(filePath, jsonParse);
}

export async function getCookies(filename: string): Promise<ICookies> {
  const parsedName = slug(filename);
  const filePath = `${directory}/${parsedName}`;

  if (!exists(filePath)) {
    return [];
  }

  const cookies = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(cookies);
}

// export async function savePoint(name: string, url: string): Promise<void> {
//   const parsedName = slug(name);
//   const filePath = `${temp}/checkpoint-${parsedName}`;

//   await fs.writeFile(filePath, url);
// }

// export async function getPoint(name: string): Promise<string | undefined> {
//   const parsedName = slug(name);
//   const filePath = `${temp}/checkpoint-${parsedName}`;

//   if (!exists(filePath)) {
//     return undefined;
//   }

//   return fs.readFile(filePath, 'utf-8');
// }

export async function log(string: string): Promise<void> {
  const parsedMEssage = `${string}\r\n====\r\n\r\n\r\n`;
  const filePath = `${temp}/logs`;

  await fs.writeFile(filePath, parsedMEssage, { flag: 'a' });
}
