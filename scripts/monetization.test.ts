import assert from 'node:assert/strict';
import { parseAdsenseConfig } from '../src/ui/ads';
import { formatViewCount, parseViewCount } from '../src/ui/viewCounter';

assert.equal(formatViewCount(1234567), '1,234,567');
assert.equal(parseViewCount({ count: 42 }), 42);
assert.equal(parseViewCount({ count: -1 }), null);
assert.equal(parseViewCount({ count: '42' }), null);

assert.deepEqual(parseAdsenseConfig('ca-pub-1234567890123456', '9876543210'), {
  client: 'ca-pub-1234567890123456',
  slot: '9876543210'
});
assert.equal(parseAdsenseConfig('', ''), null);
assert.equal(parseAdsenseConfig('pub-123', '9876543210'), null);
assert.equal(parseAdsenseConfig('ca-pub-1234567890123456', 'slot-name'), null);

console.log('View counter and ad configuration tests passed');
