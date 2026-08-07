/* ============================================================================
   Create East Sussex — script.js
   ----------------------------------------------------------------------------
   GSAP + ScrollTrigger. Handles:
     1. Hero type motion ("Create" masks up, photo fades in, "East Sussex" lands)
     2. Hero photograph parallax (scrubbed to scroll)
     3. Scroll reveals across the page (ScrollTrigger.batch)
     4. Sticky frame swapping beside the qualifying copy
     5. Map pins paired with the Connects list (hover, focus, and on scroll)
     6. Mobile nav toggle
     7. CTA click analytics event (separate from page view)

   Motion is gated behind prefers-reduced-motion via gsap.matchMedia(). The
   CSS renders everything visible by default; the pre-animation state is set
   here at runtime, so a blocked GSAP CDN degrades to a static page rather
   than a blank one.
   ============================================================================ */

(function () {
  "use strict";

  var hasGsap = typeof window.gsap !== "undefined";

  /* =========================================================================
     Motion
     ========================================================================= */
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.matchMedia().add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        full: "(prefers-reduced-motion: no-preference)",
      },
      function (context) {
        if (context.conditions.reduced) {
          // Nothing to undo — CSS already renders the finished state.
          return;
        }

        /* ---------------------------------------------------------------
           1 · Hero type motion
           The two lines reveal in sequence, with the photograph fading in
           between them so "East Sussex" lands on the image, not the flat
           navy it started on.
           --------------------------------------------------------------- */
        var createLetters = gsap.utils.toArray(".hero-line-create .mask-in");
        var placeWords = gsap.utils.toArray(".hero-line-place .mask-in");

        gsap.set([createLetters, placeWords], { yPercent: 115 });
        gsap.set(".hero-bg-img", { opacity: 0, scale: 1.12 });
        gsap.set(".hero-shade", { opacity: 0 });
        gsap.set([".hero-tagline", ".hero-sub", ".hero-actions"], {
          opacity: 0,
          y: 18,
        });

        var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

        heroTl
          .to(".hero-tagline", { opacity: 1, y: 0, duration: 0.6 })
          .to(
            createLetters,
            { yPercent: 0, duration: 0.9, stagger: 0.055 },
            "-=0.3"
          )
          // Photograph arrives as the first word finishes settling.
          .to(
            ".hero-bg-img",
            { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" },
            "-=0.35"
          )
          .to(".hero-shade", { opacity: 1, duration: 1.2 }, "<")
          .to(
            placeWords,
            { yPercent: 0, duration: 0.9, stagger: 0.08 },
            "<0.15"
          )
          .to(
            [".hero-sub", ".hero-actions"],
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
            "-=0.5"
          );

        /* Failsafe. The hero's pre-animation state is set in JS, so if the
           timeline never advances the hero would sit invisible. That can
           happen when the tab loads hidden (rAF is throttled, so GSAP's
           ticker never ticks). GSAP resumes normally once the tab is
           focused, so only step in when the page IS visible and the
           timeline still hasn't moved. */
        window.setTimeout(function () {
          if (!document.hidden && heroTl.progress() === 0) {
            heroTl.progress(1);
          }
        }, 3000);

        /* ---------------------------------------------------------------
           2 · Hero parallax — the photograph drifts slower than the page
           --------------------------------------------------------------- */
        gsap.to(".hero-bg-img", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        /* ---------------------------------------------------------------
           3 · Scroll reveals — batched so items entering together animate
           together. Hero elements are excluded; the timeline owns those.
           --------------------------------------------------------------- */
        var revealEls = gsap.utils
          .toArray(".reveal")
          .filter(function (el) {
            return !el.closest(".hero");
          });

        gsap.set(revealEls, { opacity: 0, y: 24 });

        ScrollTrigger.batch(revealEls, {
          start: "top 88%",
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              stagger: 0.08,
            });
          },
        });

        return function cleanup() {
          heroTl.kill();
        };
      }
    );
  }

  /* =========================================================================
     4 · Sticky frames — each qualifying line swaps the photo beside it.
     Driven by ScrollTrigger when available, and by a plain IntersectionObserver
     fallback when it isn't, so the frames still track without GSAP.
     ========================================================================= */
  (function initFrames() {
    var driver = document.querySelector("[data-frames-driver]");
    var frameWrap = document.querySelector("[data-frames]");
    if (!driver || !frameWrap) return;

    var items = Array.prototype.slice.call(
      driver.querySelectorAll("[data-frame]")
    );
    var frames = Array.prototype.slice.call(
      frameWrap.querySelectorAll(".frame-img")
    );
    if (!items.length || !frames.length) return;

    function activate(index) {
      items.forEach(function (item, i) {
        item.classList.toggle("is-active", i === index);
      });
      frames.forEach(function (frame, i) {
        frame.classList.toggle("is-active", i === index);
      });
    }

    activate(0);

    if (hasGsap) {
      items.forEach(function (item, i) {
        ScrollTrigger.create({
          trigger: item,
          start: "top 65%",
          end: "bottom 45%",
          onEnter: function () {
            activate(i);
          },
          onEnterBack: function () {
            activate(i);
          },
        });
      });
      return;
    }

    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(items.indexOf(entry.target));
          }
        });
      },
      { rootMargin: "-35% 0px -45% 0px" }
    );
    items.forEach(function (item) {
      observer.observe(item);
    });
  })();

  /* =========================================================================
     5 · Map pins paired with the Connects list
     Hovering or focusing either half highlights both. Pins are keyboard
     reachable (tabindex + role=button in the markup), so focus counts as a
     first-class interaction here, not a hover afterthought.
     ========================================================================= */
  (function initMap() {
    var pins = Array.prototype.slice.call(document.querySelectorAll(".map-pin"));
    var rows = Array.prototype.slice.call(
      document.querySelectorAll(".connect-item")
    );
    if (!pins.length) return;

    function setActive(place, on) {
      pins.concat(rows).forEach(function (el) {
        if (el.getAttribute("data-place") === place) {
          el.classList.toggle("is-active", on);
        }
      });
    }

    pins.concat(rows).forEach(function (el) {
      var place = el.getAttribute("data-place");
      if (!place) return;

      el.addEventListener("mouseenter", function () {
        setActive(place, true);
      });
      el.addEventListener("mouseleave", function () {
        setActive(place, false);
      });
      el.addEventListener("focus", function () {
        setActive(place, true);
      });
      el.addEventListener("blur", function () {
        setActive(place, false);
      });
    });

    // On first scroll into view, light each pin briefly in sequence so the
    // map reads as interactive rather than decorative.
    if (!hasGsap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ScrollTrigger.create({
      trigger: ".map-figure",
      start: "top 70%",
      once: true,
      onEnter: function () {
        pins.forEach(function (pin, i) {
          var place = pin.getAttribute("data-place");
          window.setTimeout(function () {
            setActive(place, true);
            window.setTimeout(function () {
              setActive(place, false);
            }, 900);
          }, i * 260);
        });
      },
    });
  })();

  /* =========================================================================
     6 · Mobile nav toggle
     ========================================================================= */
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

  /* =========================================================================
     7 · CTA click analytics event
     Fires a custom event on every CTA click, SEPARATE from the page view.
     Works with Plausible OR Google Analytics 4 — whichever you enabled in
     the <head> of index.html. Safe no-op if neither is present.
     <<< No swap needed here — just enable a provider snippet in index.html. >>>
     ========================================================================= */
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
