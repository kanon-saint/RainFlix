(function () {
  let hashHandler;
  let searchHandler;
  let blurHandler;
  let activeSearchRequest = 0;
  let debounceTimer;

  function getRouteName() {
    return ((window.location.hash || "#home").replace("#", "") || "home").split(
      "/",
    )[0];
  }

  function setActiveLink() {
    const routeName = getRouteName();
    const activeName = routeName === "movies" || routeName === "series"
      ? routeName
      : "home";

    document.querySelectorAll("[data-route-link]").forEach((link) => {
      const isActive = link.getAttribute("data-route-link") === activeName;

      link.classList.toggle("bg-sky-400", isActive);
      link.classList.toggle("text-slate-950", isActive);
      link.classList.toggle("shadow-lg", isActive);
      link.classList.toggle("shadow-sky-500/20", isActive);
      link.classList.toggle("text-slate-400", !isActive);
    });
  }

  function escapeHtml(value) {
    return window.RainFlixApi?.escapeHtml
      ? window.RainFlixApi.escapeHtml(value)
      : String(value || "");
  }

  function imageFallback(title) {
    return window.RainFlixApi?.createImageFallback
      ? window.RainFlixApi.createImageFallback(title)
      : "";
  }

  function setDropdownContent(html) {
    const dropdown = document.querySelector("#searchDropdown");

    if (!dropdown) {
      return;
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove("hidden");
  }

  function hideDropdown() {
    document.querySelector("#searchDropdown")?.classList.add("hidden");
  }

  async function runSearch(query) {
    const requestId = ++activeSearchRequest;
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      hideDropdown();
      return;
    }

    const results = await window.RainFlixApi.search(cleanQuery);

    if (requestId !== activeSearchRequest) {
      return;
    }

    if (!results.length) {
      setDropdownContent(
        window.RainFlixApi.hasTmdbCredentials()
          ? '<div class="px-4 py-3 text-sm text-slate-400">No titles found.</div>'
          : '<div class="px-4 py-3 text-sm text-slate-400">Add TMDb credentials in scripts/config.js to search the full database.</div>',
      );
      return;
    }

    setDropdownContent(
      `${results
        .map((item) => {
          const image = item.poster || item.backdrop || imageFallback(item.title);
          const url = window.RainFlixApi.buildWatchUrl(item);

          return `
            <a
              class="flex gap-3 border-b border-blue-950/70 p-3 text-left transition last:border-b-0 hover:bg-sky-400/10 focus-visible:bg-sky-400/10 focus-visible:outline-none"
              href="${url}"
              role="option"
            >
              <img
                class="h-16 w-11 shrink-0 rounded object-cover"
                src="${image}"
                alt=""
                loading="lazy"
                onerror="this.onerror=null;this.src='${imageFallback(item.title)}';"
              />
              <span class="min-w-0 pt-1">
                <span class="block truncate text-sm font-bold text-slate-100">${escapeHtml(item.title)}</span>
                <span class="mt-1 block text-xs text-slate-400">${window.RainFlixApi.mediaLabel(item.mediaType)} &middot; ${escapeHtml(item.year)} &middot; ${escapeHtml(item.rating)}</span>
              </span>
            </a>
          `;
        })
        .join("")}${
        window.RainFlixApi.hasTmdbCredentials()
          ? ""
          : '<div class="border-t border-blue-950/70 px-4 py-3 text-xs text-slate-500">Full TMDb search activates after adding credentials in scripts/config.js.</div>'
      }`,
    );
  }

  window.initHeader = function initHeader() {
    const searchInput = document.querySelector("#globalSearch");

    if (hashHandler) {
      window.removeEventListener("hashchange", hashHandler);
    }

    hashHandler = setActiveLink;
    window.addEventListener("hashchange", hashHandler);
    setActiveLink();

    if (searchHandler && searchInput) {
      searchInput.removeEventListener("input", searchHandler);
    }

    if (blurHandler) {
      document.removeEventListener("click", blurHandler);
    }

    searchHandler = (event) => {
      window.clearTimeout(debounceTimer);
      activeSearchRequest += 1;

      if (event.target.value.trim().length < 2) {
        hideDropdown();
        return;
      }

      setDropdownContent(
        '<div class="animate-pulse px-4 py-3 text-sm text-slate-400">Searching TMDb...</div>',
      );

      debounceTimer = window.setTimeout(() => {
        runSearch(event.target.value).catch(() => {
          setDropdownContent(
            '<div class="px-4 py-3 text-sm text-slate-400">Search is unavailable right now.</div>',
          );
        });
      }, 360);
    };

    searchInput?.addEventListener("input", searchHandler);

    searchInput?.addEventListener("focus", () => {
      if (searchInput.value.trim().length >= 2) {
        runSearch(searchInput.value).catch(hideDropdown);
      }
    });

    blurHandler = (event) => {
      if (!event.target.closest("#searchDropdown") && event.target !== searchInput) {
        hideDropdown();
      }
    };

    document.addEventListener("click", blurHandler);
  };
})();
