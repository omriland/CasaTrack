import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateWishlistSummary } from './renovation-wishlist'

test('calculates wishlist row totals and page total from unit price times quantity', () => {
  const summary = calculateWishlistSummary([
    { id: 'sofa', unit_price: 2500, quantity: 1 },
    { id: 'chairs', unit_price: 320, quantity: 4 },
    { id: 'lamp', unit_price: null, quantity: 2 },
  ])

  assert.deepEqual(summary.rowTotals, {
    sofa: 2500,
    chairs: 1280,
    lamp: 0,
  })
  assert.equal(summary.total, 3780)
})
