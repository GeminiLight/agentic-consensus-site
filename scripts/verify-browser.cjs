// Behavioral acceptance checks for the static project website.
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdirSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const address = process.argv[2] || "http://127.0.0.1:8924";
const session = "consensus-showcase-check";
const b = (...args) =>
  execFileSync("agent-browser", ["--session", session, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
const ev = (source) => JSON.parse(b("eval", source));
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
  console.log("PASS " + name);
};
const out = resolve(__dirname, "../docs/qa");
mkdirSync(out, { recursive: true });
try {
  b("open", address);
  b("wait", "--fn", 'document.fonts.status === "loaded"');
  check(
    "No horizontal overflow at 320, 375, 390, 768, 1024, and 1440px",
    () => {
      for (const width of [320, 375, 390, 768, 1024, 1440]) {
        b("set", "viewport", String(width), "1000");
        assert.equal(
          ev("document.documentElement.scrollWidth > innerWidth"),
          false,
          `${width}px`,
        );
      }
    },
  );
  check(
    "Walkthrough tabs expose the intended content and only one panel",
    () => {
      for (const step of ["intent", "change", "evidence", "decision"]) {
        b("click", "#step-" + step);
        assert.equal(
          ev(`document.querySelector('#panel-${step}').hidden`),
          false,
        );
        assert.equal(
          ev(
            '[...document.querySelectorAll(".demo-panel")].filter(x=>!x.hidden).length',
          ),
          1,
        );
        assert.equal(
          ev(
            `document.querySelector('#step-${step}').getAttribute('aria-selected')`,
          ),
          "true",
        );
      }
      assert.match(
        ev('document.querySelector("#panel-decision").textContent'),
        /Not ready to approve/,
      );
      b("click", "[data-next-step]");
      assert.equal(ev("document.activeElement.id"), "panel-intent");
      assert.equal(ev('document.querySelector("#panel-intent").hidden'), false);
    },
  );
  check("Tab arrow keys, Home and End move focus and selection", () => {
    b("focus", "#step-intent");
    b("press", "ArrowDown");
    assert.equal(ev("document.activeElement.id"), "step-change");
    b("press", "End");
    assert.equal(ev("document.activeElement.id"), "step-decision");
    b("press", "Home");
    assert.equal(ev("document.activeElement.id"), "step-intent");
  });
  check("All real workspace views and full-size image links work", () => {
    for (const [tab, panel] of [
      ["commitments", "commitments"],
      ["map", "map"],
      ["decision", "decision"],
    ]) {
      b("click", "#view-" + tab);
      b(
        "wait",
        "--fn",
        `[...document.querySelectorAll('#screen-${panel} img')].every(i=>i.complete && i.naturalWidth>0)`,
      );
      assert.equal(
        ev(`document.querySelector('#screen-${panel}').hidden`),
        false,
      );
      assert.equal(
        ev(
          '[...document.querySelectorAll(".screen-panel")].filter(x=>!x.hidden).length',
        ),
        1,
      );
      assert.ok(
        ev(`document.querySelector('#screen-${panel} a').href`).includes(
          "/assets/",
        ),
      );
    }
    b("focus", "#view-decision");
    b("press", "Home");
    b("press", "ArrowRight");
    assert.equal(ev("document.activeElement.id"), "view-map");
  });
  check(
    "Mobile navigation opens, dismisses with Escape, and follows anchors",
    () => {
      b("set", "viewport", "390", "844");
      b("scroll", "top");
      b("click", ".menu-toggle");
      assert.equal(ev('document.querySelector("#mobile-nav").hidden'), false);
      b("press", "Escape");
      assert.equal(ev('document.querySelector("#mobile-nav").hidden'), true);
      assert.equal(ev("document.activeElement.className"), "menu-toggle");
      b("click", ".menu-toggle");
      b("click", '#mobile-nav a[href="#research"]');
      assert.equal(ev('document.querySelector("#mobile-nav").hidden'), true);
      assert.equal(ev("location.hash"), "#research");
    },
  );
  check(
    "Copy success reports the exact citation; failure selects text honestly",
    () => {
      ev(
        'Object.defineProperty(navigator.clipboard,"writeText",{value:async text => { document.body.dataset.copied = text; },configurable:true}); true',
      );
      b("click", '[data-copy="bibtex"]');
      assert.equal(
        ev("document.body.dataset.copied"),
        ev('document.querySelector("#bibtex").textContent.trim()'),
      );
      assert.equal(
        ev('document.querySelector("[data-toast]").textContent'),
        "BibTeX copied.",
      );
      ev(
        'Object.defineProperty(navigator.clipboard,"writeText",{value:async () => { throw new Error("denied"); },configurable:true}); true',
      );
      b("click", '[data-copy="quickstart"]');
      assert.match(
        ev('document.querySelector("[data-toast]").textContent'),
        /Automatic copy is unavailable/,
      );
      assert.equal(
        ev("window.getSelection().toString()"),
        ev('document.querySelector("#quickstart").textContent'),
      );
      b("reload");
    },
  );
  check("All demo panels remain within the page at 320px", () => {
    b("set", "viewport", "320", "844");
    for (const step of ["intent", "change", "evidence", "decision"]) {
      b("click", "#step-" + step);
      assert.equal(
        ev("document.documentElement.scrollWidth > innerWidth"),
        false,
        step,
      );
    }
  });
  b("reload");
  b("wait", "--fn", 'document.fonts.status === "loaded"');
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
  ]) {
    b("set", "viewport", String(width), String(height));
    b("open", address);
    b("wait", "--fn", 'document.fonts.status === "loaded"');
    b("screenshot", resolve(out, label + ".png"));
    if (label === "desktop")
      b("screenshot", "--full", resolve(out, "desktop-full.png"));
  }
  const errors = JSON.parse(b("errors", "--json"));
  writeFileSync(
    resolve(out, "browser-errors.json"),
    JSON.stringify(errors, null, 2) + "\n",
  );
  writeFileSync(
    resolve(out, "browser-checks.json"),
    JSON.stringify({ address, checks }, null, 2) + "\n",
  );
  console.log(
    `Passed ${checks.length} behavior groups. Captured desktop, tablet, mobile, and full page.`,
  );
} finally {
  b("close");
}
