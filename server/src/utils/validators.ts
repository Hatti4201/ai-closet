export const isValidCategory = (v: string): boolean =>
  ['Top', 'Bottom', 'Shoes', 'Accessory'].includes(v);

export const isValidPattern = (v: string): boolean =>
  ['Solid', 'Striped', 'Plaid', 'Graphic', 'Patterned'].includes(v);

export const isValidIndex = (v: number): boolean =>
  typeof v === 'number' && v >= 0 && v <= 10;
