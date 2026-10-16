// Light / dark mode. Put <script src="js/theme.js"></script> in the <head> of a page, and add
// <button class="theme-toggle" data-theme-toggle></button> wherever the switch should be.
(function () {
  const KEY = "pb-theme";
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const system = () => (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  let theme = read() === "light" || read() === "dark" ? read() : system();     // saved choice first, otherwise follow the device
  document.documentElement.dataset.theme = theme;                              // set right away, so the page never flashes the wrong colors

  function paint() {
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => { b.textContent = theme === "dark" ? "Light mode" : "Dark mode"; });
  }
  document.addEventListener("DOMContentLoaded", () => {
    paint();
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem(KEY, theme); } catch (e) { /* storage can be blocked: the switch still works for this visit */ }
      paint();
    }));
  });
})();
