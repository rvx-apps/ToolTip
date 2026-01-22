(function (global) {

  /* ============================
     DEFAULT CSS URL
     ============================ */
  const DEFAULT_CSS_URL = "https://cdn.jsdelivr.net/gh/rvx-apps/ToolTip@refs/heads/main/css/index.css";

  function injectCSS(url = DEFAULT_CSS_URL) {
    if (document.querySelector(`link[data-rvx-tooltip]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-rvx-tooltip", "true");
    document.head.appendChild(link);
  }

  class RVXTooltip {
    constructor(el, options = {}) {
      this.el = el;

      this.options = Object.assign({
        content: el.getAttribute("data-tooltip") || "",
        placement: el.getAttribute("data-placement") || "top",
        theme: el.getAttribute("data-theme") || "dark",
        delay: 120,
        offset: 8,
        html: el.hasAttribute("data-html"),
        follow: el.hasAttribute("data-follow")
      }, options);

      this.tooltip = null;
      this._bind();
    }

    _bind() {
      this._show = this.show.bind(this);
      this._hide = this.hide.bind(this);
      this._move = this._follow.bind(this);

      this.el.addEventListener("mouseenter", this._show);
      this.el.addEventListener("mouseleave", this._hide);

      if (this.options.follow) {
        this.el.addEventListener("mousemove", this._move);
      }
    }

    _create() {
      const t = document.createElement("div");
      t.className = `rvx-tooltip ${this.options.theme}`;
      t.dataset.placement = this.options.placement;

      if (this.options.html) t.innerHTML = this.options.content;
      else t.textContent = this.options.content;

      document.body.appendChild(t);
      this.tooltip = t;
    }

    _position() {
      const r = this.el.getBoundingClientRect();
      const t = this.tooltip;
      const o = this.options.offset;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 4;

      const calc = {
        top: () => ({
          x: r.left + r.width / 2 - t.offsetWidth / 2,
          y: r.top - t.offsetHeight - o
        }),
        bottom: () => ({
          x: r.left + r.width / 2 - t.offsetWidth / 2,
          y: r.bottom + o
        }),
        left: () => ({
          x: r.left - t.offsetWidth - o,
          y: r.top + r.height / 2 - t.offsetHeight / 2
        }),
        right: () => ({
          x: r.right + o,
          y: r.top + r.height / 2 - t.offsetHeight / 2
        })
      };

      const fits = (p) =>
        p.x >= pad &&
        p.y >= pad &&
        p.x + t.offsetWidth <= vw - pad &&
        p.y + t.offsetHeight <= vh - pad;

      let placement = this.options.placement;
      let pos = calc[placement]();

      /* AUTO FLIP */
      if (!fits(pos)) {
        const flip = { top: "bottom", bottom: "top", left: "right", right: "left" };
        const alt = flip[placement];
        if (calc[alt]) {
          const altPos = calc[alt]();
          if (fits(altPos)) {
            placement = alt;
            pos = altPos;
          }
        }
      }

      /* CLAMP */
      pos.x = Math.max(pad, Math.min(pos.x, vw - t.offsetWidth - pad));
      pos.y = Math.max(pad, Math.min(pos.y, vh - t.offsetHeight - pad));

      t.dataset.placement = placement;
      t.style.left = pos.x + "px";
      t.style.top = pos.y + "px";
    }

    _follow(e) {
      if (!this.tooltip) return;

      const pad = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = e.clientX + pad;
      let y = e.clientY + pad;

      x = Math.min(x, vw - this.tooltip.offsetWidth - 4);
      y = Math.min(y, vh - this.tooltip.offsetHeight - 4);

      this.tooltip.style.left = x + "px";
      this.tooltip.style.top = y + "px";
    }

    show() {
      if (this.tooltip) return;

      this._create();

      requestAnimationFrame(() => {
        this._position();
        this.tooltip.classList.add("show");
      });
    }

    hide() {
      if (!this.tooltip) return;
      this.tooltip.classList.remove("show");
      setTimeout(() => {
        if (this.tooltip) {
          this.tooltip.remove();
          this.tooltip = null;
        }
      }, 150);
    }

    destroy() {
      this.hide();
      this.el.removeEventListener("mouseenter", this._show);
      this.el.removeEventListener("mouseleave", this._hide);
      this.el.removeEventListener("mousemove", this._move);
    }
  }

  function init(selector = "[data-tooltip]", cssUrl) {
    injectCSS(cssUrl);
    document.querySelectorAll(selector).forEach(el => {
      if (!el._rvxTooltip) {
        el._rvxTooltip = new RVXTooltip(el);
      }
    });
  }

  global.RVXTooltip = {
    init,
    Tooltip: RVXTooltip,
    injectCSS
  };

})(window);
