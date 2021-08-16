/* eslint-disable */
import path from 'path'
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

type ICookies = puppeteer.Protocol.Network.Cookie[];

const directory = path.resolve(__dirname, '..', 'cookies');

export async function saveCookies(filename: string, cookie: Object): Promise<void> {
  const file_path = `${directory}/${filename}`;
  const jsonParse = JSON.stringify(cookie);

  await fs.writeFile(file_path, jsonParse);
}

export async function getCookies(filename: string): Promise<ICookies> {
  const file_path = `${directory}/${filename}`;
  // const exists = fs.existsSync(file_path);

  // if (!exists) {
  // }

  const cookies = await fs.readFile(file_path, 'utf-8');
  return JSON.parse(cookies);
}