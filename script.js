const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const revealItems = document.querySelectorAll(".reveal");
const progressBar = document.querySelector(".scroll-progress");
const anchorLinks = document.querySelectorAll("a[href^='#']");
const navAnchors = document.querySelectorAll(".nav-links a");
const scrollTargets = [...document.querySelectorAll("main section[id], .legal-section[id]")];
const accountForm = document.querySelector("#account-form");
const authBox = document.querySelector("[data-auth-box]");
const statusMessage = document.querySelector(".form-status");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const googleButtons = document.querySelectorAll("[data-google-login]");
const comingSoon = document.querySelector("#proximamente");
const userGreeting = document.querySelector("[data-user-greeting]");
const logoutButton = document.querySelector("[data-logout]");

const API_BASE = "/.netlify/functions";
let authMode = "register";
let activeScrollAnimation = null;
let scrollUiTicking = false;
function getHeaderOffset() {
  return Math.ceil(header?.getBoundingClientRect().height || 0) + 18;
}

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function animateScrollTo(top, onDone) {
  if (activeScrollAnimation) {
    cancelAnimationFrame(activeScrollAnimation);
    activeScrollAnimation = null;
  }

  const start = window.scrollY;
  const distance = top - start;
  const duration = Math.min(1900, Math.max(950, Math.abs(distance) * 0.75));
  const startedAt = performance.now();

  function step(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutQuint(progress);

    window.scrollTo(0, start + distance * eased);
    updateScrollUi();

    if (progress < 1) {
      activeScrollAnimation = requestAnimationFrame(step);
      return;
    }

    activeScrollAnimation = null;
    window.scrollTo(0, top);
    onDone?.();
  }

  activeScrollAnimation = requestAnimationFrame(step);
}

function scrollToTarget(target, updateHash = true) {
  if (!target) return;

  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderOffset());

  const finish = () => {
    target.classList.remove("scroll-target-pulse");
    window.setTimeout(() => target.classList.add("scroll-target-pulse"), 140);

    if (updateHash) {
      history.replaceState(null, "", `#${target.id}`);
    }
  };

  animateScrollTo(top, finish);
}
function updateScrollProgress() {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}


function updateActiveSection() {
  const marker = window.scrollY + getHeaderOffset() + Math.min(180, window.innerHeight * 0.28);
  let current = scrollTargets.find((section) => marker >= section.offsetTop && marker < section.offsetTop + section.offsetHeight);

  if (!current) {
    current = scrollTargets
      .filter((section) => section.offsetTop <= marker)
      .sort((a, b) => b.offsetTop - a.offsetTop)[0] || scrollTargets[0];
  }

  if (current?.id) {
    setActiveNav(current.id);
  }
}

function updateScrollUi() {
  updateScrollProgress();
  updateActiveSection();
}

function requestScrollUiUpdate() {
  if (scrollUiTicking) return;

  scrollUiTicking = true;
  requestAnimationFrame(() => {
    updateScrollUi();
    scrollUiTicking = false;
  });
}
function setActiveNav(id) {
  navAnchors.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
}

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.documentElement.classList.add("scroll-js-ready");

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href === "#") return;

  const targetId = decodeURIComponent(href.slice(1));
  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  event.stopPropagation();
  scrollToTarget(target);
  setActiveNav(targetId);

  header.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}, true);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}


window.addEventListener("scroll", requestScrollUiUpdate, { passive: true });
window.addEventListener("resize", requestScrollUiUpdate);
window.addEventListener("load", updateScrollUi);
updateScrollUi();
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

async function createUser({ name, email, commune, password, provider = "email" }) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, commune, password, provider }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "No se pudo crear la cuenta. Intentalo nuevamente.");
  }

  return result.user;
}

async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Correo o contrasena incorrectos. Revisa los datos e intentalo nuevamente.");
  }

  return result.user;
}

function showComingSoon(user) {
  userGreeting.textContent = `${user.name}, tu cuenta ya esta lista. Estamos preparando los primeros partidos en comunas piloto y te avisaremos cuando abramos acceso.`;
  comingSoon.hidden = false;
  document.body.style.overflow = "hidden";
}

function hideComingSoon() {
  comingSoon.hidden = true;
  document.body.style.overflow = "";
}

function setAuthMode(mode) {
  authMode = mode;
  authBox.classList.toggle("is-login", mode === "login");
  authTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authTab === mode));
  accountForm.querySelector("button[type='submit']").textContent = mode === "login" ? "Entrar" : "Crear cuenta";
  accountForm.elements.name.required = mode === "register";
  accountForm.elements.commune.required = mode === "register";
  accountForm.elements.terms.required = mode === "register";
  accountForm.elements.password.autocomplete = mode === "login" ? "current-password" : "new-password";
  setStatus("");
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(accountForm).entries());

  try {
    const user = authMode === "register"
      ? await createUser(data)
      : await loginUser(data.email, data.password);

    accountForm.reset();
    if (authMode === "register") {
      setStatus("Cuenta creada correctamente. Ahora entra con tu correo y contrasena para confirmar tu acceso.");
      setAuthMode("login");
      accountForm.elements.email.value = user.email;
      accountForm.elements.password.focus();
      return;
    }

    setStatus("Acceso confirmado.");
    window.setTimeout(() => showComingSoon(user), 300);
  } catch (error) {
    setStatus(error.message, true);
  }
});

googleButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const email = window.prompt("Ingresa tu correo para continuar con Google:");
    if (!email) return;

    const normalizedEmail = normalizeEmail(email);
    try {
      const user = await createUser({
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        commune: "Pendiente",
        password: "google-demo",
        provider: "google-demo",
      });
      showComingSoon(user);
    } catch (error) {
      setStatus(error.message, true);
    }
  });
});

logoutButton.addEventListener("click", hideComingSoon);
localStorage.removeItem("sangreDeFutbolSession");










