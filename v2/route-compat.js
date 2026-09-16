/* V2 route compatibility: keeps one Student ID context across module navigation.
 * This layer intentionally owns only DOM-level selection/highlight behavior so it
 * cannot duplicate the core Router/Store/EventBus implementation.
 */
(() => {
  const KEY = "LH_V2_SELECTED_STUDENT";
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const setSelected = (id) => { if (id) sessionStorage.setItem(KEY, id); };
  const getSelected = () => sessionStorage.getItem(KEY) || "";
  const clearSelected = () => sessionStorage.removeItem(KEY);

  function flashStudentContext() {
    const id = getSelected();
    if (!id) return;
    const rows = qsa(`[data-student-row="${CSS.escape(id)}"]`);
    rows.forEach(row => {
      row.classList.add("v2-selected-student");
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    const selects = qsa('select[name="studentId"]');
    selects.forEach(sel => {
      if ([...sel.options].some(o => o.value === id)) {
        sel.value = id;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    qsa('input[name="studentId"]').forEach(input => {
      if (!input.value) input.value = id;
    });
  }

  function markLinks() {
    const id = getSelected();
    if (!id) return;
    qsa(`[data-student="${CSS.escape(id)}"]`).forEach(el => el.setAttribute("aria-current", "true"));
  }

  document.addEventListener("click", (e) => {
    const route = e.target.closest("[data-route][data-student]");
    if (route?.dataset.student) setSelected(route.dataset.student);
    const action = e.target.closest("[data-action][data-student]");
    if (action?.dataset.student) setSelected(action.dataset.student);
    if (e.target.closest('[data-route="profiles"]') && !e.target.closest('[data-student]')) clearSelected();
  }, true);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => { flashStudentContext(); markLinks(); });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("load", () => {
    flashStudentContext();
    markLinks();
  });
})();
