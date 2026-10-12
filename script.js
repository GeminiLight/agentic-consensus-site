(() => {
  "use strict";
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const animate = (element, frames, options = {}) => {
    if (!element || motionPreference.matches || !element.animate) return;
    return element.animate(frames, {
      duration: 460,
      easing: "cubic-bezier(.2,.75,.25,1)",
      ...options,
    });
  };
  const enter = (element, delay = 0, distance = 18) =>
    animate(
      element,
      [
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { delay, fill: "backwards" },
    );
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches)
      document.getAnimations().forEach((a) => a.cancel());
  });

  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-nav");
  if (menuButton && mobileNav) {
    menuButton.hidden = false;
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    };
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      mobileNav.hidden = isOpen;
      if (!isOpen) enter(mobileNav, 0, -8);
    });
    mobileNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileNav.hidden) {
        closeMenu();
        menuButton.focus();
      }
    });
    matchMedia("(min-width: 601px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  // Native links remain available; the no-script stylesheet exposes every panel.
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) =>
      document.getElementById(tab.getAttribute("aria-controls")),
    );
    const next = group.querySelector("[data-next-step]");
    const nextLabels = [
      "Next: trace the change",
      "Next: check the evidence",
      "Next: make the decision",
      "Back to the intent",
    ];
    let selected = -1;
    const select = (index, focus = false) => {
      const changed = selected !== index;
      const wasInitialized = selected !== -1;
      selected = index;
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      group.style.setProperty(
        "--step-progress",
        `${((index + 1) / tabs.length) * 100}%`,
      );
      if (changed && wasInitialized) {
        // Stop older transitions so rapid keyboard changes never leave stale effects.
        panels.forEach((panel) =>
          panel.getAnimations({ subtree: true }).forEach((a) => a.cancel()),
        );
        [...panels[index].children].forEach((child, i) =>
          enter(child, Math.min(i * 45, 180), 12),
        );
      }
      if (next) {
        next.replaceChildren(document.createTextNode(nextLabels[index] + " "));
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        next.append(arrow);
      }
      if (focus) tabs[index].focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(index));
      tab.addEventListener("keydown", (event) => {
        let target;
        const vertical =
          tab.parentElement.getAttribute("aria-orientation") === "vertical";
        if (event.key === "Home") target = 0;
        else if (event.key === "End") target = tabs.length - 1;
        else if (
          event.key === "ArrowRight" ||
          (vertical && event.key === "ArrowDown")
        )
          target = (index + 1) % tabs.length;
        else if (
          event.key === "ArrowLeft" ||
          (vertical && event.key === "ArrowUp")
        )
          target = (index - 1 + tabs.length) % tabs.length;
        if (target !== undefined) {
          event.preventDefault();
          select(target, true);
        }
      });
    });
    next?.addEventListener("click", () => {
      const index = tabs.findIndex(
        (tab) => tab.getAttribute("aria-selected") === "true",
      );
      const target = (index + 1) % tabs.length;
      select(target);
      // Announce the newly displayed step and keep keyboard focus inside it.
      panels[target].focus({ preventScroll: true });
    });
    select(0);
    if (next) {
      document.querySelectorAll("[data-jump-step]").forEach((link) => {
        link.addEventListener("click", (event) => {
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          )
            return;
          const index = tabs.findIndex(
            (tab) => tab.id === "step-" + link.dataset.jumpStep,
          );
          if (index < 0) return;
          event.preventDefault();
          select(index);
          history.pushState(null, "", "#walkthrough");
          group.scrollIntoView({
            block: "start",
            behavior: motionPreference.matches ? "instant" : "smooth",
          });
          panels[index].focus({ preventScroll: true });
        });
      });
    }
  });

  const toast = document.querySelector("[data-toast]");
  let toastTimer;
  const notify = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4500);
  };
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copy);
      if (!source) return;
      try {
        if (!navigator.clipboard?.writeText)
          throw new Error("Clipboard is unavailable");
        await navigator.clipboard.writeText(source.textContent.trim());
        notify(
          button.dataset.copy === "bibtex"
            ? "BibTeX copied."
            : "Setup commands copied.",
        );
      } catch {
        const disclosure = source.closest("details");
        if (disclosure) disclosure.open = true;
        const range = document.createRange();
        range.selectNodeContents(source);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        source.scrollIntoView({ block: "center", behavior: "auto" });
        notify(
          "Automatic copy is unavailable. Text selected — press ⌘C or Ctrl+C to copy.",
        );
      }
    });
  });

  // Native image links still work without JavaScript or dialog support.
  const imageDialog = document.querySelector(".image-dialog");
  if (imageDialog?.showModal) {
    const image = imageDialog.querySelector("img");
    const viewport = imageDialog.querySelector(".image-dialog-viewport");
    const zoomButton = imageDialog.querySelector("[data-image-zoom]");
    const closeButton = imageDialog.querySelector("[data-image-close]");
    let imageTrigger;
    let previousOverflow;
    const resetZoom = () => {
      imageDialog.classList.remove("is-zoomed");
      zoomButton.setAttribute("aria-pressed", "false");
      zoomButton.textContent = "Actual size";
      viewport.scrollTo(0, 0);
    };
    document.querySelectorAll(".screenshot-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        imageTrigger = link;
        image.src = link.href;
        image.alt = link.querySelector("img").alt;
        imageDialog.querySelector(".image-dialog-caption").textContent =
          image.alt;
        resetZoom();
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        imageDialog.showModal();
        closeButton.focus();
        enter(imageDialog, 0, 16);
      });
    });
    imageDialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [zoomButton, closeButton, viewport];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        viewport.focus();
      } else if (!event.shiftKey && index === controls.length - 1) {
        event.preventDefault();
        zoomButton.focus();
      }
    });
    closeButton.addEventListener("click", () => imageDialog.close());
    imageDialog.addEventListener("click", (event) => {
      if (event.target !== imageDialog) return;
      const rect = imageDialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        imageDialog.close();
    });
    imageDialog.addEventListener("close", () => {
      document.body.style.overflow = previousOverflow;
      imageTrigger?.focus({ preventScroll: true });
    });
    zoomButton.addEventListener("click", () => {
      const zoomed = imageDialog.classList.toggle("is-zoomed");
      zoomButton.setAttribute("aria-pressed", String(zoomed));
      zoomButton.textContent = zoomed ? "Fit to screen" : "Actual size";
      viewport.scrollTo(0, 0);
    });
  }

  document.querySelectorAll("details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (details.open)
        [...details.children]
          .filter((el) => el.tagName !== "SUMMARY")
          .forEach((el) => enter(el, 0, 8));
    });
  });
  const openCitation = () => {
    if (location.hash === "#citation")
      document.querySelector(".citation-source").open = true;
  };
  window.addEventListener("hashchange", openCitation);
  openCitation();

  // Motion is an enhancement: content is visible before JS, on errors, and in print.
  document
    .querySelectorAll(
      ".hero-copy > *, .trace-heading, .trace-node, .trace-caption",
    )
    .forEach((element, i) => {
      enter(
        element,
        Math.min(i * 65, 650),
        element.classList.contains("trace-node") ? 20 : 14,
      );
    });
  if ("IntersectionObserver" in window) {
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          enter(entry.target, 0, 24);
          reveal.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".walkthrough-intro, .review-demo, .section-heading, .state-model, .workspace-showcase, .paper-main, .research-note, .start-grid, .resource-list, .faq, .closing",
      )
      .forEach((element) => reveal.observe(element));
  }
  const header = document.querySelector(".site-header");
  const updateHeader = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".top-nav a")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            if (link.hash === "#" + entry.target.id)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-12% 0px -65% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
  }
})();
