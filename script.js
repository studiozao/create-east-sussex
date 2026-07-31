/* ============================================================================
   Create East Sussex — script.js
   ----------------------------------------------------------------------------
   Vanilla JS, no dependencies. Handles:
     1. Scroll-reveal on entry (IntersectionObserver)
     2. Hero collage parallax drift on scroll
     3. Mobile nav toggle
     4. CTA click analytics event (separate from page view)
   All motion is disabled when the user prefers reduced motion.
   ============================================================================ */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -------------------------------------------------------------------------
     1 · Scroll-reveal on entry
     Adds .is-visible to any .reveal element as it enters the viewport.
     ------------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    // Show everything immediately — no motion.
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target); // reveal once, then stop watching
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* -------------------------------------------------------------------------
     2 · Hero collage parallax
     Each tile drifts at a slightly different rate as the page scrolls.
     Uses requestAnimationFrame + a single scroll listener for smoothness.
     ------------------------------------------------------------------------- */
  var parallaxTiles = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  );

  if (!prefersReducedMotion && parallaxTiles.length) {
    // Capture each tile's baseline transform (they have staggered offsets in CSS).
    var baselineOffsets = parallaxTiles.map(function (tile) {
      var t = window.getComputedStyle(tile).transform;
      if (t && t !== "none") {
        var match = t.match(/matrix.*\((.+)\)/);
        if (match) {
          var values = match[1].split(", ");
          return parseFloat(values[5]) || 0; // translateY component
        }
      }
      return 0;
    });

    var ticking = false;

    var updateParallax = function () {
      var viewportH = window.innerHeight;
      parallaxTiles.forEach(function (tile, i) {
        var rect = tile.getBoundingClientRect();
        // How far the tile is from vertical centre of the viewport (-1..1-ish)
        var progress = (rect.top + rect.height / 2 - viewportH / 2) / viewportH;
        var speed = parseFloat(tile.getAttribute("data-parallax")) || 0.08;
        var drift = -progress * speed * 140; // px of drift
        tile.style.transform =
          "translateY(" + (baselineOffsets[i] + drift) + "px)";
      });
      ticking = false;
    };

    var requestParallax = function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax, { passive: true });
    updateParallax();
  }

  /* -------------------------------------------------------------------------
     3 · Mobile nav toggle
     ------------------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close the menu after a link is tapped (mobile)
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -------------------------------------------------------------------------
     4 · CTA click analytics event
     Fires a custom event on every CTA click, SEPARATE from the page view.
     Works with Plausible OR Google Analytics 4 — whichever you enabled in
     the <head> of index.html. Safe no-op if neither is present.
     <<< No swap needed here — just enable a provider snippet in index.html. >>>
     ------------------------------------------------------------------------- */
  function trackCtaClick(label) {
    // Plausible
    if (typeof window.plausible === "function") {
      window.plausible("CTA Click", { props: { location: label } });
    }
    // Google Analytics 4
    if (typeof window.gtag === "function") {
      window.gtag("event", "cta_click", { cta_location: label });
    }
    // Fallback for debugging before analytics is wired up:
    // console.log("CTA click:", label);
  }

  document.querySelectorAll("[data-cta]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      trackCtaClick(btn.getAttribute("data-cta") || "unknown");
    });
  });
})();
