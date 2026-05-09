/**
 * BUGGY SAMPLE #2: Unit Tests That Pass But Test Wrong Behavior
 *
 * Workshop: Quality Engineering in the Agentic Age
 * Phase: TEST
 * Agent: Verification Agent
 *
 * INSTRUCTIONS FOR ATTENDEES:
 * These tests all pass. But are they testing the RIGHT thing?
 * Run the verification agent to analyze the test quality.
 *
 * HIDDEN BUG: The tests pass but don't actually verify correct behavior.
 * The verification agent should identify the disconnect.
 */

// =============================================================================
// THE CODE BEING TESTED
// =============================================================================

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
}

class ShoppingCart {
  private items: CartItem[] = [];
  private discount: DiscountCode | null = null;

  addItem(item: CartItem): void {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  removeItem(itemId: string): boolean {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  applyDiscount(discount: DiscountCode): boolean {
    const subtotal = this.getSubtotal();
    if (subtotal < discount.minPurchase) {
      return false;
    }
    this.discount = discount;
    return true;
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();

    if (!this.discount) {
      return subtotal;
    }

    if (this.discount.type === 'percentage') {
      // BUG: This calculates discount incorrectly for percentages > 100
      // It should cap at subtotal, but doesn't
      return subtotal - (subtotal * this.discount.value / 100);
    } else {
      // Fixed discount
      return Math.max(0, subtotal - this.discount.value);
    }
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  clear(): void {
    this.items = [];
    this.discount = null;
  }
}

// =============================================================================
// THE TESTS (All pass, but are they correct?)
// =============================================================================

describe('ShoppingCart', () => {
  let cart: ShoppingCart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  describe('addItem', () => {
    // TEST ISSUE #1: Test doesn't verify the item was actually added correctly
    it('should add an item to the cart', () => {
      const item: CartItem = { id: '1', name: 'Widget', price: 10, quantity: 2 };

      cart.addItem(item);

      // This only checks count, not that the RIGHT item was added
      expect(cart.getItemCount()).toBe(2);
    });

    // TEST ISSUE #2: Test uses same item twice, doesn't verify merging logic
    it('should increase quantity when adding existing item', () => {
      const item: CartItem = { id: '1', name: 'Widget', price: 10, quantity: 1 };

      cart.addItem(item);
      cart.addItem(item);

      // Passes because count is 2, but doesn't verify it's the SAME item with qty 2
      // vs two separate items with qty 1 each
      expect(cart.getItemCount()).toBe(2);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const item: CartItem = { id: '1', name: 'Widget', price: 10, quantity: 2 };
      cart.addItem(item);

      const result = cart.removeItem('1');

      // Only checks return value, not that cart is actually empty
      expect(result).toBe(true);
    });

    it('should return false when removing non-existent item', () => {
      const result = cart.removeItem('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 10, quantity: 2 });
      cart.addItem({ id: '2', name: 'Gadget', price: 15, quantity: 1 });

      expect(cart.getSubtotal()).toBe(35);
    });

    // TEST ISSUE #3: Empty cart test is trivial and doesn't add value
    it('should return 0 for empty cart', () => {
      expect(cart.getSubtotal()).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount when minimum purchase met', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 100, quantity: 1 });

      const discount: DiscountCode = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 50
      };

      const result = cart.applyDiscount(discount);

      // Only tests that discount was "applied", not that total is correct
      expect(result).toBe(true);
    });

    it('should reject discount when minimum purchase not met', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 10, quantity: 1 });

      const discount: DiscountCode = {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 50
      };

      const result = cart.applyDiscount(discount);

      expect(result).toBe(false);
    });
  });

  describe('getTotal', () => {
    // TEST ISSUE #4: Only tests happy path with small discount
    it('should apply percentage discount', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 100, quantity: 1 });
      cart.applyDiscount({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minPurchase: 0
      });

      expect(cart.getTotal()).toBe(90);
    });

    it('should apply fixed discount', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 100, quantity: 1 });
      cart.applyDiscount({
        code: 'FLAT20',
        type: 'fixed',
        value: 20,
        minPurchase: 0
      });

      expect(cart.getTotal()).toBe(80);
    });

    // TEST ISSUE #5: Tests fixed discount floor but NOT percentage discount issues
    it('should not go below zero with large fixed discount', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 10, quantity: 1 });
      cart.applyDiscount({
        code: 'HUGE',
        type: 'fixed',
        value: 100,
        minPurchase: 0
      });

      expect(cart.getTotal()).toBe(0);
    });

    // MISSING TEST: What about percentage > 100%?
    // This would expose the bug in getTotal()
  });

  describe('clear', () => {
    it('should empty the cart', () => {
      cart.addItem({ id: '1', name: 'Widget', price: 10, quantity: 2 });

      cart.clear();

      expect(cart.getItemCount()).toBe(0);
    });
  });
});


/* =============================================================================
 * ANSWER KEY (Don't look until you've tried!)
 * =============================================================================
 *
 * THE BUGS IN THE TESTS:
 *
 * 1. WEAK ASSERTIONS (Tests pass but don't verify behavior)
 *    - addItem test only checks count, not that correct item was added
 *    - removeItem test only checks return value, not cart state
 *    - applyDiscount test only checks boolean, not actual discount effect
 *
 * 2. MISSING EDGE CASES
 *    - No test for percentage discount > 100% (would produce negative total!)
 *    - No test for negative quantities
 *    - No test for negative prices
 *    - No test for very large numbers (overflow)
 *
 * 3. COINCIDENTAL CORRECTNESS
 *    - Test "should increase quantity when adding existing item" passes
 *      because 1+1=2, but doesn't verify the merging actually happened
 *    - Could pass even if implementation added two separate items
 *
 * 4. THE ACTUAL CODE BUG THAT TESTS DON'T CATCH:
 *    In getTotal(), percentage discounts > 100 produce negative totals:
 *
 *    cart.addItem({ id: '1', name: 'Widget', price: 100, quantity: 1 });
 *    cart.applyDiscount({ code: 'BUG', type: 'percentage', value: 150, minPurchase: 0 });
 *    cart.getTotal(); // Returns -50! Should return 0 or throw error
 *
 * WHAT THE VERIFICATION AGENT CATCHES:
 *    - Assertions that don't match the test description
 *    - Missing boundary condition tests
 *    - State not verified after operations
 *    - Code paths not covered by any test
 *    - Tests that would pass even if implementation was wrong
 *
 * BETTER TESTS WOULD:
 *    - Verify actual cart contents after addItem
 *    - Test percentage discounts at boundaries (0%, 100%, >100%)
 *    - Test negative/invalid inputs
 *    - Verify state changes, not just return values
 *
 * =============================================================================
 */
