export const puppeteerConfig = [
  '--log-level=3', // fatal only
  '--no-default-browser-check',
  '--disable-site-isolation-trials',
  '--no-experiments',
  '--ignore-gpu-blacklist',
  '--ignore-certificate-errors',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-setuid-sandbox',
  '--no-sandbox',

  // Extras
  '--disable-webgl',
  '--disable-infobars',
  '--window-position=0,0',
  '--disable-threaded-animation',
  '--disable-threaded-scrolling',
  '--disable-histogram-customizer',
  '--disable-gl-extensions',
  '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
];
