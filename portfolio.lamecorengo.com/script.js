// Personal details are intentionally centralized here for easy editing.
const SITE = {
  email: "elorengo26@gmail.com",
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const root = document.documentElement;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const applyTheme = (theme, persist = false) => {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = selectedTheme;
  const switchLabel = `Switch to ${selectedTheme === "light" ? "dark" : "light"} mode`;
  themeToggle.setAttribute("aria-label", switchLabel);
  themeToggle.setAttribute("title", switchLabel);
  themeToggle.setAttribute("aria-pressed", String(selectedTheme === "light"));
  themeColorMeta.setAttribute("content", selectedTheme === "light" ? "#F5F4F0" : "#050505");
  if (persist) {
    try {
      localStorage.setItem("lameck-portfolio-theme", selectedTheme);
    } catch {
      // Keep the in-page selection working when storage is unavailable.
    }
  }
};

applyTheme(document.documentElement.dataset.theme);
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light", true);
});

// Keep the real portrait when available, with a quiet monogram fallback for a missing asset.
const heroPortrait = document.querySelector(".hero-portrait-image");
const heroPortraitFallback = document.querySelector(".hero-portrait-fallback");
if (heroPortrait && heroPortraitFallback) {
  const showPortraitFallback = () => {
    heroPortrait.hidden = true;
    heroPortraitFallback.hidden = false;
    heroPortrait.closest(".hero-portrait-frame")?.classList.add("is-missing");
  };
  heroPortrait.addEventListener("error", showPortraitFallback, { once: true });
  if (heroPortrait.complete && heroPortrait.naturalWidth === 0) showPortraitFallback();
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("[data-email]").forEach((node) => {
  node.textContent = SITE.email;
});
document.querySelectorAll("[data-email-link]").forEach((node) => {
  node.href = `mailto:${SITE.email}`;
});

// Keep content visible without JavaScript; motion is enabled only after observers are ready.
if (!reduceMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -36px 0px" });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
  root.classList.add("motion-ready");
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

// A narrow viewport band changes the section lighting and active navigation in sync.
const motionSections = [...document.querySelectorAll("main > section:not(.portfolio-chapter), .portfolio-chapter > section")];
const intersectingSections = new Set();
const navigationSections = new Set(["work", "about", "capabilities", "background", "contact"]);
const navigationLinks = document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-menu nav a[href^="#"]');
const applyActiveSection = () => {
  const marker = window.innerHeight * 0.43;
  const active = [...intersectingSections]
    .map((section) => {
      const rect = section.getBoundingClientRect();
      return { section, distance: Math.abs((rect.top + rect.bottom) / 2 - marker) };
    })
    .sort((a, b) => a.distance - b.distance)[0]?.section;
  if (!active) return;
  const activeId = active.id || active.classList[0];
  root.dataset.activeSection = activeId;
  motionSections.forEach((section) => section.classList.toggle("is-current", section === active));
  const navId = navigationSections.has(activeId) ? activeId : "";
  navigationLinks.forEach((link) => {
    if (link.getAttribute("href") === `#${navId}` && navId) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
};
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersectingSections.add(entry.target);
      else intersectingSections.delete(entry.target);
    });
    applyActiveSection();
  }, { rootMargin: "-36% 0px -52% 0px", threshold: 0 });
  motionSections.forEach((section) => sectionObserver.observe(section));
}

const capabilityList = document.querySelector(".capability-list");
const capabilityRows = [...document.querySelectorAll(".capability-row")];
const wordFillText = document.querySelector("[data-word-fill]");
const fillWords = [...(wordFillText?.querySelectorAll(".fill-word") ?? [])];
if (capabilityRows.length && "IntersectionObserver" in window) {
  const capabilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      capabilityRows.forEach((row) => row.classList.toggle("is-current", row === entry.target));
    });
  }, { rootMargin: "-44% 0px -44% 0px", threshold: 0 });
  capabilityRows.forEach((row) => capabilityObserver.observe(row));
}

// Keep the reading position visible without intercepting or smoothing native scroll.
const progressBar = document.querySelector("#progress-bar");
let progressQueued = false;
const updateProgress = () => {
  if (progressQueued) return;
  progressQueued = true;
  requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
    progressBar.style.transform = `scaleX(${progress / 100})`;
    if (!reduceMotion) {
      const heroProgress = clamp(window.scrollY / Math.max(1, window.innerHeight * 1.15), 0, 1);
      root.style.setProperty("--hero-parallax", `${heroProgress * -22}px`);
    }
    if (capabilityList) {
      const bounds = capabilityList.getBoundingClientRect();
      const center = window.innerHeight * 0.52;
      const timelineProgress = bounds.height ? clamp((center - bounds.top) / bounds.height, 0, 1) : 0;
      capabilityList.style.setProperty("--timeline-progress", `${timelineProgress * 100}%`);
    }
    if (wordFillText && fillWords.length) {
      const bounds = wordFillText.getBoundingClientRect();
      const textProgress = reduceMotion ? 1 : clamp(
        (window.innerHeight * 0.78 - bounds.top) / (bounds.height + window.innerHeight * 0.52),
        0,
        1,
      );
      const readingPosition = textProgress * fillWords.length;
      fillWords.forEach((word, index) => {
        const fill = reduceMotion ? 1 : clamp((readingPosition - index) / 3, 0, 1);
        word.style.setProperty("--word-fill", `${Math.round(fill * 100)}%`);
        word.classList.toggle("is-current", !reduceMotion && textProgress > 0.01 && index === Math.floor(readingPosition));
      });
    }
    progressQueued = false;
  });
};
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });
updateProgress();

// Small, deliberate magnetic movement on mouse and keyboard focus.
if (!coarsePointer && !reduceMotion) {
  document.querySelectorAll(".magnetic").forEach((element) => {
    let frame = 0;
    const moveTowardPointer = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        element.style.setProperty("--mag-x", `${Math.max(-7, Math.min(7, dx * 0.12))}px`);
        element.style.setProperty("--mag-y", `${Math.max(-5, Math.min(5, dy * 0.14))}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.setProperty("--mag-x", "0px");
      element.style.setProperty("--mag-y", "0px");
    };
    element.addEventListener("pointermove", moveTowardPointer);
    element.addEventListener("pointerleave", reset);
    element.addEventListener("blur", reset);
    element.addEventListener("focus", () => {
      element.style.setProperty("--mag-x", "0px");
      element.style.setProperty("--mag-y", "-2px");
    });
  });
}

// Reflective lighting and restrained perspective follow the pointer on desktop.
if (!coarsePointer && !reduceMotion) {
  const tilts = document.querySelectorAll("[data-tilt]");
  tilts.forEach((surface) => {
    const visual = surface.matches(".hero-art") ? surface : surface.querySelector(".project-visual");
    if (!visual) return;
    let frame = 0;
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = visual.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        visual.style.setProperty("--pointer-x", `${x * 100}%`);
        visual.style.setProperty("--pointer-y", `${y * 100}%`);
        visual.classList.add("has-pointer-light");
        visual.style.setProperty("--tilt-x", `${(0.5 - y) * 3.2}deg`);
        visual.style.setProperty("--tilt-y", `${(x - 0.5) * 3.8}deg`);
        if (visual.classList.contains("hero-art")) {
          visual.style.setProperty("--light-x", `${x * 100}%`);
          visual.style.setProperty("--light-y", `${y * 100}%`);
        }
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      visual.style.setProperty("--tilt-x", "0deg");
      visual.style.setProperty("--tilt-y", "0deg");
      visual.style.setProperty("--pointer-x", "50%");
      visual.style.setProperty("--pointer-y", "50%");
      visual.classList.remove("has-pointer-light");
      if (visual.classList.contains("hero-art")) {
        visual.style.setProperty("--light-x", "48%");
        visual.style.setProperty("--light-y", "38%");
      }
    };
    visual.addEventListener("pointermove", onMove);
    visual.addEventListener("pointerleave", reset);
    visual.addEventListener("focusin", () => {
      visual.classList.add("has-pointer-light");
      visual.style.setProperty("--pointer-x", "50%");
      visual.style.setProperty("--pointer-y", "50%");
    });
    visual.addEventListener("focusout", (event) => {
      if (!visual.contains(event.relatedTarget)) reset();
    });
  });
}

// A quiet cursor halo supplements the native cursor; it never replaces interaction semantics.
const cursorAura = document.querySelector(".cursor-aura");
if (cursorAura && !coarsePointer && !reduceMotion) {
  let cursorFrame = 0;
  window.addEventListener("pointermove", (event) => {
    cancelAnimationFrame(cursorFrame);
    cursorFrame = requestAnimationFrame(() => {
      cursorAura.style.setProperty("--cursor-x", `${event.clientX}px`);
      cursorAura.style.setProperty("--cursor-y", `${event.clientY}px`);
      cursorAura.classList.add("is-visible");
    });
  }, { passive: true });
  window.addEventListener("pointerleave", () => cursorAura.classList.remove("is-visible"));
  document.querySelectorAll("a,button").forEach((element) => {
    element.addEventListener("pointerenter", () => cursorAura.classList.add("is-hover"));
    element.addEventListener("pointerleave", () => cursorAura.classList.remove("is-hover"));
    element.addEventListener("pointerdown", () => cursorAura.classList.add("is-hover"));
    element.addEventListener("pointerup", () => cursorAura.classList.remove("is-hover"));
  });
}

// Touch users get a brief, localized reflection on press instead of hover-only feedback.
if (coarsePointer && !reduceMotion) {
  document.querySelectorAll(".project-visual").forEach((visual) => {
    let pressTimer;
    const release = () => {
      clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => visual.classList.remove("is-pressed"), 360);
    };
    visual.addEventListener("pointerdown", () => {
      clearTimeout(pressTimer);
      visual.classList.add("is-pressed", "has-pointer-light");
    }, { passive: true });
    visual.addEventListener("pointerup", release, { passive: true });
    visual.addEventListener("pointercancel", release, { passive: true });
    visual.addEventListener("pointerleave", release, { passive: true });
  });
}

// Mobile menu uses real links, closes on selection, and returns focus to its trigger.
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const setMenuOpen = (open) => {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
};
menuToggle.addEventListener("click", () => setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

// Copy-to-clipboard has both success and failure feedback for insecure/local contexts.
const copyButton = document.querySelector("[data-copy-email]");
const copyFeedback = document.querySelector(".copy-feedback");
let feedbackTimer;
copyButton.addEventListener("click", async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(SITE.email);
    } else {
      const field = document.createElement("textarea");
      field.value = SITE.email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard unavailable");
    }
    copyFeedback.textContent = "COPIED";
  } catch {
    copyFeedback.textContent = "SELECT THE EMAIL ABOVE";
  }
  clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => { copyFeedback.textContent = ""; }, 2600);
});
