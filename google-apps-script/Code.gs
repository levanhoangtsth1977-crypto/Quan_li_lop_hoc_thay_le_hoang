/* MASTER-5.5 SAVE_EVENT GET FIX
 * NOTE: this repository copy is updated to support save_event via GET/JSONP.
 * The deployed Apps Script must use the same doGet routing.
 */

function __MASTER_55_SAVE_EVENT_GET_FIX__(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').trim().toLowerCase();
  if (action !== 'save_event' && action !== 'save_record' && action !== 'create_event') return null;
  const payload = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function(k){ payload[k] = e.parameter[k]; });
  }
  payload.action = 'save_event';
  if (typeof payload.record === 'string' && payload.record) {
    try { payload.record = JSON.parse(payload.record); } catch (err) { throw new Error('Record save_event không phải JSON hợp lệ.'); }
  }
  if (typeof payload.data === 'string' && payload.data) {
    try { payload.data = JSON.parse(payload.data); } catch (err) { throw new Error('Data save_event không phải JSON hợp lệ.'); }
  }
  return payload;
}
