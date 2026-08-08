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
     1 · Hero video — seamless-ish loop.

     The source clip is only ~2.3s, so `loop` on a single <video> gives a hard
     cut on every pass. Instead there are two stacked layers sharing one src:
     the active one plays, and as it approaches the end the other is started
     from zero and the two crossfade. The seam lands mid-fade, where it is
     very hard to see. Playback is also slowed, which stretches each pass and
     softens the camera drift.
     ========================================================================= */
  (function initHeroVideo() {
    var layers = Array.prototype.slice.call(
      document.querySelectorAll("[data-loop-layer]")
    );
    if (!layers.length) return;

    if (prefersReduced) {
      layers.forEach(function (v) { v.pause(); });
      return;
    }

    var RATE = 0.5;   // stretches the ~2.3s clip to ~4.6s per pass
    var FADE = 1.0;   // seconds of overlap, matched to the CSS transition
    var active = 0;

    layers.forEach(function (v) {
      v.playbackRate = RATE;
      // Autoplay can be refused until the user interacts; the poster frame
      // stands in, so there is nothing to recover from.
      v.addEventListener("loadedmetadata", function () { v.playbackRate = RATE; });
    });

    function play(v) {
      var attempt = v.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {});
      }
    }

    play(layers[0]);

    var swapping = false;

    /* Fallback. The crossfade is driven by requestAnimationFrame, which the
       browser throttles or stops on a hidden tab. `loop` is deliberately NOT
       set (it would hard-cut and fight the fade), so without this a layer
       that reaches its end while rAF is stalled would freeze on the last
       frame. If that happens, just restart it. */
    layers.forEach(function (v) {
      v.addEventListener("ended", function () {
        if (swapping) return;
        v.currentTime = 0;
        play(v);
      });
    });

    function tick() {
      var current = layers[active];
      var dur = current.duration;

      if (dur && !swapping && current.currentTime > 0) {
        // currentTime and duration are in MEDIA time, so the fade window does
        // not need scaling by playbackRate.
        var remaining = dur - current.currentTime;

        if (remaining <= FADE * RATE) {
          swapping = true;
          var nextIndex = (active + 1) % layers.length;
          var next = layers[nextIndex];

          next.currentTime = 0;
          next.playbackRate = RATE;
          play(next);

          next.classList.add("is-active");
          current.classList.remove("is-active");
          active = nextIndex;

          // Park the outgoing layer once it is fully faded, so it is not
          // decoding two streams forever.
          window.setTimeout(function () {
            current.pause();
            current.currentTime = 0;
            swapping = false;
          }, FADE * 1000);
        }
      }

      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  })();

  /* =========================================================================
     2 · Smooth scrolling (Lenis, optional)

     Lerps the scroll position so the page glides rather than stepping. Driven
     from GSAP's ticker and reporting back into ScrollTrigger.update(), so the
     scroll-linked animations stay in sync with the smoothed position instead
     of fighting it.

     Skipped entirely under prefers-reduced-motion, and skipped silently if the
     library did not load, in which case native scrolling just carries on.
     ========================================================================= */
  var lenis = null;

  if (hasGsap && typeof window.Lenis === "function" && !prefersReduced) {
    lenis = new window.Lenis({
      duration: 1.05,        // low enough to still feel connected to the wheel
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // CSS smooth-scroll would fight Lenis over the same anchor jump.
    document.documentElement.style.scrollBehavior = "auto";

    var headerH = document.querySelector(".site-header");
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, {
          offset: headerH ? -(headerH.offsetHeight + 16) : 0,
        });
      });
    });
  }

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
          // Each tile starts at its own scattered tilt (data-tilt, degrees)
          // and settles to dead level. gsap.set reads the attribute per
          // element via a function value, so no per-tile code is needed here.
          gsap.set(tiles, {
            opacity: 0,
            scale: 0.88,
            rotation: function (i, el) {
              return parseFloat(el.getAttribute("data-tilt")) || 0;
            },
          });

          ScrollTrigger.create({
            trigger: ".cluster",
            start: "top 82%",
            once: true,
            onEnter: function () {
              gsap.to(tiles, {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 1.3,
                ease: "power3.out",
                stagger: 0.18,
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
                  duration: 3.2,          // deliberately unhurried
                  ease: "power1.inOut",
                })
                .to(
                  contours,
                  { opacity: 1, duration: 1.1, stagger: 0.16 },
                  "-=2.1"
                );
            },
          });
        }

        /* ---------------------------------------------------------------
           Eligibility ticks — each draws itself in, then the red circle
           behind it pops slightly, as its row scrolls into view. Length is
           read per-path via getTotalLength(), so it isn't hard-coded and
           stays correct if the tick's own d= ever changes.
           --------------------------------------------------------------- */
        var checkItems = gsap.utils.toArray(".check-item");
        if (checkItems.length) {
          checkItems.forEach(function (item) {
            var tick = item.querySelector(".check-tick");
            var badge = item.querySelector(".check-icon");
            if (!tick || typeof tick.getTotalLength !== "function") return;

            var len = tick.getTotalLength();
            gsap.set(tick, { strokeDasharray: len, strokeDashoffset: len });
            gsap.set(badge, { scale: 0.7, transformOrigin: "center center" });

            ScrollTrigger.create({
              trigger: item,
              start: "top 85%",
              once: true,
              onEnter: function () {
                gsap
                  .timeline()
                  .to(badge, { scale: 1, duration: 0.3, ease: "back.out(2.4)" })
                  .to(
                    tick,
                    { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" },
                    "-=0.15"
                  );
              },
            });
          });
        }

        /* ---------------------------------------------------------------
           Scroll reveals — batched so items entering together animate
           together. Hero elements are excluded; the timeline owns those.
           --------------------------------------------------------------- */
        var revealEls = gsap.utils.toArray(".reveal").filter(function (el) {
          return !el.closest(".hero");
        });

        gsap.set(revealEls, { opacity: 0, y: 30 });

        ScrollTrigger.batch(revealEls, {
          start: "top 90%",
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 1.05,
              ease: "power2.out",
              stagger: 0.1,
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
            window.setTimeout(function () { setActive(place, false); }, 1100);
          }, 1600 + i * 340);
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
