/* ============================================================================
   Create East Sussex — script.js
   ----------------------------------------------------------------------------
   GSAP + ScrollTrigger. Handles:
     1. Hero entrance timeline (tagline → heading → subhead → CTA)
     2. Scroll-triggered reveals for every .reveal element (ScrollTrigger.batch,
        replaces the old IntersectionObserver + manual class toggle)
     3. Hero collage scrub-parallax (replaces the old scroll-listener version)
     4. Mobile nav toggle
     5. CTA click analytics event (separate from the page view)
   All motion is gated behind prefers-reduced-motion via gsap.matchMedia().
   ============================================================================ */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  /* -------------------------------------------------------------------------
     Motion — reduced-motion branch shows everything immediately, no tweens.
     Full-motion branch drives the hero timeline, reveals and parallax.
     ------------------------------------------------------------------------- */
  mm.add(
    {
      reduced: "(prefers-reduced-motion: reduce)",
      full: "(prefers-reduced-motion: no-preference)",
    },
    function (context) {
      if (context.conditions.reduced) {
        gsap.set(".reveal", { opacity: 1, y: 0 });
        return;
      }

      gsap.set(".reveal", { opacity: 0, y: 20 });

      /* ---------------------------------------------------------------------
         1 · Hero entrance — a real timeline, staggered on load rather than
         waiting for scroll (the hero is already in view on arrival).
         --------------------------------------------------------------------- */
      var heroTl = gsap.timeline({
        defaults: { duration: 0.6, ease: "power2.out" },
      });
      heroTl
        .to(".hero-tagline", { opacity: 1, y: 0 })
        .to(".hero-heading", { opacity: 1, y: 0 }, "<0.08")
        .to(".hero-subhead", { opacity: 1, y: 0 }, "<0.08")
        .to(".hero-copy .btn", { opacity: 1, y: 0 }, "<0.08")
        .to(".hero-collage", { opacity: 1, y: 0 }, "<0.1");

      /* ---------------------------------------------------------------------
         2 · Scroll reveals — everything below the hero, batched so items
         entering together animate together with a short stagger.
         --------------------------------------------------------------------- */
      ScrollTrigger.batch(".reveal:not(.hero-tagline):not(.hero-heading):not(.hero-subhead):not(.hero-copy .btn):not(.hero-collage)", {
        start: "top 88%",
        once: true,
        onEnter: function (elements) {
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.08,
          });
        },
      });

      /* ---------------------------------------------------------------------
         3 · Hero collage parallax — each tile drifts at a different rate as
         the hero scrolls past, tied to scroll position via scrub instead of
         a manual scroll listener + requestAnimationFrame loop.
         --------------------------------------------------------------------- */
      gsap.utils.toArray("[data-parallax]").forEach(function (tile) {
        var speed = parseFloat(tile.getAttribute("data-parallax")) || 0.08;
        gsap.to(tile, {
          y: function () {
            return -speed * 400;
          },
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      return function cleanup() {
        heroTl.kill();
      };
    }
  );

  /* -------------------------------------------------------------------------
     4 · Mobile nav toggle
     ------------------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -------------------------------------------------------------------------
     5 · CTA click analytics event
     Fires a custom event on every CTA click, SEPARATE from the page view.
     Works with Plausible OR Google Analytics 4 — whichever you enabled in
     the <head> of index.html. Safe no-op if neither is present.
     <<< No swap needed here — just enable a provider snippet in index.html. >>>
     ------------------------------------------------------------------------- */
  function trackCtaClick(label) {
    if (typeof window.plausible === "function") {
      window.plausible("CTA Click", { props: { location: label } });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "cta_click", { cta_location: label });
    }
  }

  document.querySelectorAll("[data-cta]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      trackCtaClick(btn.getAttribute("data-cta") || "unknown");
    });
  });
})();
