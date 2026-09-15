/* GOOGLE SHEETS RECORDS BRIDGE — DISABLED
 * The site now has one canonical business CRUD owner: master-crud-ui.js.
 * This legacy bridge registered independent save wrappers around addViolation/
 * addReward/saveAttendanceRecord and could issue a second save after the
 * canonical handler, producing duplicate/conflicting requests and errors such
 * as "Tab sự kiện không hợp lệ".
 */
(function(){
  'use strict';
  window.__LH_GOOGLE_RECORDS_BRIDGE_1901_DISABLED__=true;
})();
