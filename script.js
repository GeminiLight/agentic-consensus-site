(() => {
  "use strict";
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
      "Next: inspect the change",
      "Next: question the evidence",
      "Next: the human decision",
      "Back to the intent",
    ];
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
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
