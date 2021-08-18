/* eslint no-useless-escape: "off" */
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

import { exists } from './exists';

type ICookies = puppeteer.Protocol.Network.Cookie[];

const directory = path.resolve(__dirname, '..', '..', 'cookies');

export const parseFilename = (filename: string) => {
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
  const parsedName = parseFilename(filename);
  const filePath = `${directory}/${parsedName}`;
  const jsonParse = JSON.stringify(cookie);

  await fs.writeFile(filePath, jsonParse);
}

export async function getCookies(filename: string): Promise<ICookies> {
  const parsedName = parseFilename(filename);
  const filePath = `${directory}/${parsedName}`;

  if (!exists(filePath)) {
    return [];
  }

  const cookies = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(cookies);
}
