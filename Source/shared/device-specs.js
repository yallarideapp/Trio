import phones from './specs/phones.js';
import computers from './specs/computers.js';
import wearables from './specs/wearables.js';

// Editorial source URLs stay with these records for future specification updates.
// The storefront renders only the summary and specification rows.
export default { ...phones, ...computers, ...wearables };
