/*
 * Cookie consent for docs.protecto.ai, using the same Cookiebot domain group as www.protecto.ai.
 * documentation.json gates the trackers through integrations.cookies, which reads the CookieConsent cookie.
 * This file loads Cookiebot and adds the slim bar, the opt-out view and the notice. Styles: styles/consent.css.
 */
(function () {
  if (window.protectoConsentLoaded) return;
  window.protectoConsentLoaded = true;

  var CBID = "e2c18223-c91f-4fa1-ac11-2eec8a1bb045";
  var PRIVACY = "https://www.protecto.ai/privacy-policy/";
  var original = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function isImplied() {
    var c = window.Cookiebot && window.Cookiebot.consent;
    return !!(c && c.method === "implied");
  }

  // Notice countries: the bar opens as an opt-out, because tracking is already on.
  function setBarMode(dialog) {
    var text = byId("CybotCookiebotDialogBodyContentText");
    var deny = byId("CybotCookiebotDialogBodyButtonDecline");
    if (!text || !deny) return;
    if (isImplied()) {
      if (!dialog.classList.contains("protecto-optout")) {
        original = [text.innerHTML, deny.textContent];
        dialog.classList.add("protecto-optout");
      }
      text.innerHTML = 'Cookies for analytics and marketing are on. Turn them off with Opt out, or choose by category. Read our <a href="' + PRIVACY + '">privacy policy</a>.';
      deny.textContent = "Opt out";
    } else if (dialog.classList.contains("protecto-optout")) {
      dialog.classList.remove("protecto-optout");
      if (original) {
        text.innerHTML = original[0];
        deny.textContent = original[1];
      }
    }
  }

  function setUpBar() {
    var dialog = byId("CybotCookiebotDialog");
    if (!dialog) return;
    dialog.classList.remove("protecto-open");
    setBarMode(dialog);
    var buttons = byId("CybotCookiebotDialogBodyButtonsWrapper");
    if (!buttons || byId("protecto-customize")) return;

    var customize = document.createElement("button");
    customize.id = "protecto-customize";
    customize.type = "button";
    customize.className = "CybotCookiebotDialogBodyButton";
    customize.textContent = "Customize";
    customize.setAttribute("aria-expanded", "false");
    customize.addEventListener("click", function () {
      dialog.classList.add("protecto-open");
      customize.setAttribute("aria-expanded", "true");
      var first = byId("CybotCookiebotDialogBodyLevelButtonPreferences");
      if (first) first.focus();
    });
    buttons.insertBefore(customize, buttons.firstChild);

    var details = byId("CybotCookiebotDialogBodyEdgeMoreDetailsLink");
    if (details) {
      details.addEventListener("click", function () {
        dialog.classList.remove("protecto-open");
      });
    }

    var descriptions = {
      Necessary: "Keeps the site running. Always on.",
      Preferences: "Remembers choices such as language.",
      Statistics: "Shows how the site is used.",
      Marketing: "Measures campaigns and shares some data with partners."
    };
    Object.keys(descriptions).forEach(function (key) {
      var label = document.querySelector('label[for="CybotCookiebotDialogBodyLevelButton' + key + '"]');
      if (label && !label.querySelector(".protecto-cat-desc")) {
        var span = document.createElement("span");
        span.className = "protecto-cat-desc";
        span.textContent = descriptions[key];
        label.appendChild(span);
      }
    });
  }

  function linkPrivacyPolicy() {
    var text = byId("CybotCookiebotDialogBodyContentText");
    if (text && text.innerHTML.indexOf("href") < 0) {
      text.innerHTML = text.innerHTML.replace("privacy policy", '<a href="' + PRIVACY + '">privacy policy</a>');
    }
  }

  // Cookiebot rebuilds the dialog after showing it, so the Customize button is added back when it goes missing.
  function watchDialog() {
    var dialog = byId("CybotCookiebotDialog");
    if (!dialog || window.protectoBarObserver || !window.MutationObserver) return;
    window.protectoBarObserver = new MutationObserver(function () {
      if (!byId("protecto-customize")) setUpBar();
    });
    window.protectoBarObserver.observe(dialog, { childList: true, subtree: true });
  }

  // Notice for countries outside the full-bar list (implied consent).
  function showNotice() {
    var cookiebot = window.Cookiebot;
    if (!isImplied() || byId("protecto-cookie-notice")) return;
    if (navigator.globalPrivacyControl) {
      cookiebot.submitCustomConsent(true, true, false);
      return;
    }
    try {
      if (localStorage.getItem("protecto_notice_ok")) return;
    } catch (e) {}
    var country = (window.CookieConsent && window.CookieConsent.userCountry) || "";
    var label = country.indexOf("US") === 0 ? "Do not sell or share my info" : "Cookie Settings";
    var notice = document.createElement("div");
    notice.id = "protecto-cookie-notice";
    notice.setAttribute("role", "region");
    notice.setAttribute("aria-label", "Cookie notice");
    notice.innerHTML = '<p>We use cookies for analytics and marketing. You can opt out anytime. <a href="#cookie-settings">' + label + '</a> <a href="' + PRIVACY + '">Privacy policy</a></p><button type="button">OK</button>';
    notice.querySelector("button").addEventListener("click", function () {
      try {
        localStorage.setItem("protecto_notice_ok", "1");
      } catch (e) {}
      notice.remove();
    });
    document.body.appendChild(notice);
  }

  function clearNotice() {
    var notice = byId("protecto-cookie-notice");
    if (notice && !isImplied()) notice.remove();
  }

  // Docs pages change without a full load, so trackers already running would keep sending after an opt-out.
  function reloadIfWithdrawn() {
    var c = window.Cookiebot && window.Cookiebot.consent;
    if (c && !c.statistics && (window.posthog || window.clarity || document.querySelector('script[src*="gtag/js"]'))) {
      window.location.reload();
    }
  }

  window.addEventListener("CookiebotOnDialogDisplay", function () {
    setUpBar();
    linkPrivacyPolicy();
    watchDialog();
  });
  window.addEventListener("CookiebotOnConsentReady", showNotice);
  window.addEventListener("CookiebotOnAccept", clearNotice);
  window.addEventListener("CookiebotOnDecline", clearNotice);
  window.addEventListener("CookiebotOnAccept", reloadIfWithdrawn);
  window.addEventListener("CookiebotOnDecline", reloadIfWithdrawn);

  // Footer and notice links reopen the choices. Capture phase, so the docs router does not handle the hash.
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href$="#cookie-settings"]');
    if (link && window.Cookiebot) {
      event.preventDefault();
      event.stopPropagation();
      window.Cookiebot.renew();
    }
  }, true);

  if (!byId("Cookiebot")) {
    var script = document.createElement("script");
    script.id = "Cookiebot";
    script.src = "https://consent.cookiebot.com/uc.js";
    script.setAttribute("data-cbid", CBID);
    document.head.appendChild(script);
  }
})();
