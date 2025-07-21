export const calculateTax = (subtotal) => {
  const taxRate = 0.18; // e.g. 18% GST
  const tax = Math.round(subtotal * taxRate);
  return tax
}