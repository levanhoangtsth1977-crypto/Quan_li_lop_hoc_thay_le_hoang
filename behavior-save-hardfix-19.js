/* BEHAVIOR SAVE HARD FIX 1.9 — DISABLED
 * Canonical Vi phạm/Khen thưởng SAVE is owned by master-crud-ui.js v10.
 * This legacy capture handler is intentionally inert. Keeping it active can
 * issue a second save after the canonical handler, causing "Đã lưu" followed
 * by "Lưu thất bại" or other conflicting responses.
 */
(function(){
  'use strict';
  window.__LH_BEHAVIOR_SAVE_HARDFIX_19_DISABLED__=true;
})();
