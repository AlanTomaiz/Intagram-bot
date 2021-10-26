export const puppeteerConfig = [
  // '--log-level=3', // fatal only
  '--no-default-browser-check',
  // '--disable-site-isolation-trials',
  '--no-experiments',
  // '--ignore-gpu-blacklist',
  // '--ignore-certificate-errors',
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
  '--user-agent=Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0',
];
