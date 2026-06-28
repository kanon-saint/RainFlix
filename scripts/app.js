(function () {
  const loadedScripts = new Set();

  const routes = {
    home: {
      html: "./pages/home.html",
      script: "./pages/home.js",
      init: "initHomePage",
    },
    movies: {
      html: "./pages/home.html",
      script: "./pages/home.js",
      init: "initHomePage",
    },
    series: {
      html: "./pages/home.html",
      script: "./pages/home.js",
      init: "initHomePage",
    },
    watch: {
      html: "./pages/watch.html",
      script: "./pages/watch.js",
      init: "initWatchPage",
    },
  };

  function getRoute() {
    const hash = (window.location.hash || "#home").replace(/^#/, "");
    const [path] = hash.split("?");
    const parts = path.split("/").filter(Boolean);
    const routeName = routes[parts[0]] ? parts[0] : "home";

    return {
      routeName,
      params: {
        mediaType: parts[1] || "",
        id: parts[2] || "",
        season: parts[3] || "1",
        episode: parts[4] || "1",
      },
    };
  }

  async function injectHtml(selector, path) {
    const container = document.querySelector(selector);

    if (!container) {
      return;
    }

    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load ${path}`);
    }

    container.innerHTML = await response.text();
  }

  function loadScript(path) {
    if (loadedScripts.has(path)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = path;
      script.defer = true;
      script.onload = () => {
        loadedScripts.add(path);
        resolve();
      };
      script.onerror = () => reject(new Error(`Unable to load ${path}`));
      document.body.appendChild(script);
    });
  }

  async function loadShell() {
    await injectHtml("#site-header", "./components/header.html");
    await loadScript("./components/header.js");
    window.initHeader?.();

    await injectHtml("#site-footer", "./components/footer.html");
  }

  async function loadRoute() {
    const { routeName, params } = getRoute();
    const route = routes[routeName];

    await injectHtml("#app-view", route.html);
    await loadScript(route.script);
    window[route.init]?.({ routeName, params });

    document.querySelector("#app-view")?.focus({ preventScroll: true });
  }

  function renderLoadError(error) {
    const appView = document.querySelector("#app-view");

    if (appView) {
      appView.innerHTML = `
        <section class="mx-auto my-20 w-[min(680px,calc(100%-2rem))] rounded-lg border border-blue-900/70 bg-blue-950/30 p-7 text-slate-400">
          <h1 class="m-0 mb-3 text-2xl font-black text-slate-50">RainFlix could not load this view.</h1>
          <p class="mt-2">${error.message}</p>
          <p class="mt-2">Serve the folder with a local web server and open the localhost URL.</p>
        </section>
      `;
    }
  }

  async function initApp() {
    try {
      await loadShell();
      await loadRoute();

      window.addEventListener("hashchange", () => {
        loadRoute().catch(renderLoadError);
      });
    } catch (error) {
      renderLoadError(error);
    }
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
