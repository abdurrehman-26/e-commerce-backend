// utils/priceCalculator.js

export function calculateSubtotal(items) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return subtotal
}
