const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");

function closeNav() {
  navToggle?.classList.remove("is-open");
  navLinks?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.classList.toggle("is-open");
  navLinks?.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navItems.forEach((link) => {
  link.addEventListener("click", closeNav);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

const sectionLinks = new Map(
  Array.from(navItems)
    .map((link) => [link.getAttribute("href")?.replace("#", ""), link])
    .filter(([id]) => Boolean(id))
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = sectionLinks.get(entry.target.id);
      if (!link) return;
      if (entry.isIntersecting) {
        navItems.forEach((item) => item.classList.remove("active"));
        link.classList.add("active");
      }
    });
  },
  {
    rootMargin: "-40% 0px -48% 0px",
    threshold: 0.01,
  }
);

document.querySelectorAll("section[id]").forEach((section) => {
  observer.observe(section);
});

const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
