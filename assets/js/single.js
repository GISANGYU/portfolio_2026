/* 한 페이지 버전 — 페이지 안 앵커 스크롤 + 이력 섹션 접기 (상세는 서브페이지로 이동) */
(function () {
  "use strict";
  var UI = window.UI || {};

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    var el = document.getElementById(a.getAttribute("href").slice(1));
    if (!el) return;
    e.preventDefault();
    if (UI.lenis) UI.lenis.scrollTo(el, { offset: -20 }); else el.scrollIntoView({ behavior: "smooth" });
  });

  var fold = document.querySelector("[data-fold]");
  if (!fold) return;
  var inner = fold.querySelector(".fold-in"), btn = fold.querySelector(".fold-cta button");
  btn.addEventListener("click", function () {
    var open = !fold.classList.contains("open");
    inner.style.maxHeight = (open ? inner.scrollHeight : inner.offsetHeight) + "px";
    requestAnimationFrame(function () {
      fold.classList.toggle("open", open);
      inner.style.maxHeight = open ? inner.scrollHeight + "px" : "";
    });
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "SHOW LESS ↑" : "SHOW MORE ↓";
    if (!open && UI.lenis) UI.lenis.scrollTo(fold, { offset: -200 });
  });
  inner.addEventListener("transitionend", function () {
    if (fold.classList.contains("open")) inner.style.maxHeight = "none";
    if (UI.lenis && UI.lenis.resize) UI.lenis.resize();
  });
})();
