export default function Sleep(time = 500) {
  return new Promise(resolve => setTimeout(() => resolve(''), time));
}
