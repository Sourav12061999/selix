
import { applyProjection } from './projection';
import assert from 'assert';

const data = {
    name: 'Alice',
    email: 'alice@example.com',
    phone: 123456,
    address: {
        city: 'Wonderland',
        zip: '12345',
        coords: { lat: 1, lng: 2 }
    }
};

console.log('Running Projection Tests...');

// 1. Select Mode
const r1 = applyProjection(data, { name: 1 });
assert.deepStrictEqual(r1, { name: 'Alice' });
console.log('✅ Select Mode passed');

// 2. Omit Mode
const r2 = applyProjection(data, { email: 0 });
assert.deepStrictEqual(r2, {
    name: 'Alice',
    phone: 123456,
    address: { city: 'Wonderland', zip: '12345', coords: { lat: 1, lng: 2 } }
});
console.log('✅ Omit Mode passed');

// 3. Nested Select
const r3 = applyProjection(data, { address: { city: 1 } });
assert.deepStrictEqual(r3, { address: { city: 'Wonderland' } });
console.log('✅ Nested Select passed');

// 4. Nested Omit
const r4 = applyProjection(data, { address: { zip: 0 } });
assert.deepStrictEqual(r4, {
    name: 'Alice',
    email: 'alice@example.com',
    phone: 123456,
    address: { city: 'Wonderland', coords: { lat: 1, lng: 2 } }
}); // Note: zip is removed
console.log('✅ Nested Omit passed');

// 5. Mixed Contributors (Select wins if any select present at root)
// Actually my logic: IsSelectMode checks recursive.
// { name: 1, address: { zip: 0 } }
// name: 1 -> Select Mode.
// address: { zip: 0 } -> Nested Omit.
// Result should be: Keep 'name'. Keep 'address' (because specified), and apply projection to 'address'.
const r5 = applyProjection(data, { name: 1, address: { zip: 0 } });
assert.deepStrictEqual(r5, {
    name: 'Alice',
    address: { city: 'Wonderland', coords: { lat: 1, lng: 2 } }
});
// address should contain everything EXCEPT zip, because nested projection is OMIT mode.
console.log('✅ Mixed Select/Nested Omit passed');

console.log('All tests passed!');
