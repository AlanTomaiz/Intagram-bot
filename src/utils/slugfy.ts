/* eslint import/prefer-default-export: "off" */
export const slugfy = (string: string) => {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/( )+/g, '-')
    .replace(/(.)\1+/g, '$1')
    .replace(/(_)+/g, '-')
    .toLocaleLowerCase();
};
