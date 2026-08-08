/* ============================================================================
   Create East Sussex — script.js
   ----------------------------------------------------------------------------
   GSAP + ScrollTrigger. Handles:
     1. Hero type motion ("Create" types out, then "East Sussex" lands)
     2. Hero video pacing + parallax
     3. Scroll reveals across the page (ScrollTrigger.batch)
     4. Map pins paired with the Connects list
     5. Mobile nav toggle
     6. CTA click analytics event (separate from page view)

   Motion is gated behind prefers-reduced-motion via gsap.matchMedia(). The
   CSS renders everything visible by default; the pre-animation state is set
   here at runtime, so a blocked GSAP CDN degrades to a static page rather
   than a blank one.

   The disclosure panels in "About our team" are native <details> elements
   and deliberately have no JavaScript at all.
   ============================================================================ */

(function () {
  "use strict";

  var hasGsap = typeof window.gsap !== "undefined";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================================
     1 · Hero video — the source clip is only ~2.3s, so it loops often. Slowing
     it down stretches each pass and makes the loop point far less obvious.
     ========================================================================= */
  (function initHeroVideo() {
    var video = document.querySelector(".hero-video");
    if (!video) return;

    if (prefersReduced) {
      video.pause();
      return;
    }

    video.playbackRate = 0.6;

    // Some browsers reject autoplay until the metadata is in; retry once.
    var play = function () {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          /* Autoplay blocked — the poster frame stands in. Nothing to do. */
        });
      }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });
  })();

  /* =========================================================================
     2 · Motion
     ========================================================================= */
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    var mm = gsap.matchMedia();

    mm.add(
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
           Hero type motion.
           "Create" is clipped to an animating width with a caret on its
           trailing edge, stepped one character at a time so it reads as
           typing rather than a wipe. Fonts must be ready before the width
           is measured, or the target width is wrong.
           --------------------------------------------------------------- */
        var typeEl = document.querySelector("[data-type]");
        var placeEl = document.querySelector(".hero-line-place");
        var heroTl = null;

        function buildHero() {
          var chars = typeEl ? typeEl.textContent.trim().length : 0;
          var fullWidth = typeEl ? typeEl.getBoundingClientRect().width : 0;

          if (typeEl) gsap.set(typeEl, { width: 0 });
          if (placeEl) gsap.set(placeEl, { opacity: 0, y: 24 });
          gsap.set([".hero-tagline", ".hero-sub", ".hero-actions"], {
            opacity: 0,
            y: 18,
          });

          heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

          heroTl
            .to(".hero-tagline", { opacity: 1, y: 0, duration: 0.5 })
            .add(function () {
              if (typeEl) typeEl.classList.add("is-typing");
            })
            .to(
              typeEl,
              {
                width: fullWidth,
                duration: Math.max(0.5, chars * 0.13),
                ease: "steps(" + Math.max(1, chars) + ")",
              },
              "<"
            )
            .add(function () {
              // Let the caret sit and blink for a beat before the second line.
              if (typeEl) typeEl.classList.add("is-blinking");
            })
            .to({}, { duration: 0.45 })
            .add(function () {
              if (typeEl) {
                typeEl.classList.remove("is-typing", "is-blinking");
                // Release the fixed width so the line reflows on resize.
                typeEl.style.width = "auto";
              }
            })
            .to(placeEl, { opacity: 1, y: 0, duration: 0.7 })
            .to(
              [".hero-sub", ".hero-actions"],
              { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
              "-=0.35"
            );

          /* Failsafe. The hero's pre-animation state is set in JS, so if the
             timeline never advances the hero would sit invisible. That can
             happen when the tab loads hidden (rAF is throttled, so GSAP's
             ticker never ticks). GSAP resumes normally once the tab is
             focused, so only step in when the page IS visible and the
             timeline still hasn't moved. */
          window.setTimeout(function () {
            if (!document.hidden && heroTl && heroTl.progress() === 0) {
              heroTl.progress(1);
            }
          }, 3000);
        }

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(buildHero);
        } else {
          buildHero();
        }

        /* ---------------------------------------------------------------
           Hero video parallax — drifts slower than the page scrolls
           --------------------------------------------------------------- */
        gsap.to(".hero-video", {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        /* ---------------------------------------------------------------
           Cards flip in on scroll.
           This is a reveal, not a hover/click state: the card has one face,
           so nothing is ever hidden behind an interaction. The perspective
           lives on the .cards container in CSS.
           --------------------------------------------------------------- */
        var cardInners = gsap.utils.toArray(".card-inner");
        if (cardInners.length) {
          gsap.set(cardInners, { rotationY: -88, opacity: 0 });

          ScrollTrigger.batch(cardInners, {
            start: "top 85%",
            once: true,
            onEnter: function (batch) {
              gsap.to(batch, {
                rotationY: 0,
                opacity: 1,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.14,
              });
            },
          });
        }

        /* ---------------------------------------------------------------
           Photo cluster — the four tiles settle in one at a time rather
           than the whole block fading as a lump. The static angle lives on
           the standalone `rotate`/`translate` CSS properties, so animating
           `transform` here composes with it instead of wiping it.
           --------------------------------------------------------------- */
        var tiles = gsap.utils.toArray(".cluster-tile");
        if (tiles.length) {
          gsap.set(tiles, { opacity: 0, scale: 0.88 });

          ScrollTrigger.create({
            trigger: ".cluster",
            start: "top 82%",
            once: true,
            onEnter: function () {
              gsap.to(tiles, {
                opacity: 1,
                scale: 1,
                duration: 0.75,
                ease: "power3.out",
                stagger: 0.11,
              });
            },
          });
        }

        /* ---------------------------------------------------------------
           Map — the coastline draws itself, then the contours fade up
           underneath it. Length is read from the referenced <path>, since
           <use> elements have no getTotalLength() of their own.
           --------------------------------------------------------------- */
        var mapShape = document.querySelector("#esShape");
        var mapEdge = document.querySelector(".map-edge");
        var contours = gsap.utils.toArray(".map-contours use");

        if (mapShape && mapEdge && typeof mapShape.getTotalLength === "function") {
          var len = mapShape.getTotalLength();
          gsap.set(mapEdge, { strokeDasharray: len, strokeDashoffset: len });
          gsap.set(contours, { opacity: 0 });

          ScrollTrigger.create({
            trigger: ".map-figure",
            start: "top 78%",
            once: true,
            onEnter: function () {
              gsap
                .timeline()
                .to(mapEdge, {
                  strokeDashoffset: 0,
                  duration: 1.5,
                  ease: "power2.inOut",
                })
                .to(
                  contours,
                  { opacity: 1, duration: 0.5, stagger: 0.06 },
                  "-=0.9"
                );
            },
          });
        }

        /* ---------------------------------------------------------------
           Scroll reveals — batched so items entering together animate
           together. Hero elements are excluded; the timeline owns those.
           --------------------------------------------------------------- */
        var revealEls = gsap.utils.toArray(".reveal").filter(function (el) {
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
          if (heroTl) heroTl.kill();
        };
      }
    );
  }

  /* =========================================================================
     3 · Map pins paired with the Connects list
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

    var all = pins.concat(rows);

    function setActive(place, on) {
      all.forEach(function (el) {
        if (el.getAttribute("data-place") === place) {
          el.classList.toggle("is-active", on);
        }
      });
    }

    all.forEach(function (el) {
      var place = el.getAttribute("data-place");
      if (!place) return;

      el.addEventListener("mouseenter", function () { setActive(place, true); });
      el.addEventListener("mouseleave", function () { setActive(place, false); });
      el.addEventListener("focus", function () { setActive(place, true); });
      el.addEventListener("blur", function () { setActive(place, false); });
    });

    // On first scroll into view, light each pin briefly in sequence so the
    // map reads as interactive rather than decorative.
    if (!hasGsap || prefersReduced) return;

    ScrollTrigger.create({
      trigger: ".map-figure",
      start: "top 62%",
      once: true,
      onEnter: function () {
        pins.forEach(function (pin, i) {
          var place = pin.getAttribute("data-place");
          window.setTimeout(function () {
            setActive(place, true);
            window.setTimeout(function () { setActive(place, false); }, 800);
          }, i * 220);
        });
      },
    });
  })();

  /* =========================================================================
     4 · Mobile nav toggle
     ========================================================================= */
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

  /* =========================================================================
     5 · CTA click analytics event
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
