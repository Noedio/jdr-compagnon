// un fichier de l'application introuvable (page d'une ancienne version restée en cache) :
// un seul rechargement à une adresse neuve plutôt qu'un écran noir
// ; mais si c'est le wifi qui manque (coupure, téléphone hors de portée), recharger donnerait la page
// d'erreur du navigateur : on attend que la table réponde de nouveau, puis on recharge
(function () {
  var waiting = false;
  function reachable(done) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 4000);
    fetch('/api/info', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        clearTimeout(t);
        done(r.ok);
      })
      .catch(function () {
        clearTimeout(t);
        done(false);
      });
  }
  function reload() {
    try {
      if (sessionStorage.getItem('jdr.retry')) return;
      sessionStorage.setItem('jdr.retry', '1');
    } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('v', String(Date.now()));
    location.replace(u.href);
  }
  function retry() {
    if (waiting) return;
    reachable(function (ok) {
      if (ok) return reload();
      // réseau absent : nouvel essai toutes les 3 s, rechargement dès que la table répond
      waiting = true;
      var timer = setInterval(function () {
        reachable(function (back) {
          if (!back) return;
          clearInterval(timer);
          waiting = false;
          reload();
        });
      }, 3000);
    });
  }
  window.addEventListener(
    'error',
    function (e) {
      var t = e.target;
      var src = t && (t.src || t.href);
      if (src && /\/assets\//.test(src)) retry();
    },
    true,
  );
  window.addEventListener('vite:preloadError', retry);
  window.addEventListener('load', function () {
    setTimeout(function () {
      try {
        sessionStorage.removeItem('jdr.retry');
      } catch (e) {}
    }, 5000);
  });
})();

// navigateur trop ancien pour la mise en page (Safari avant iOS 16.4, Chrome avant 111) : on le dit,
// plutôt qu'un écran aux couleurs cassées
(function () {
  try {
    if (!window.CSS || !CSS.supports || CSS.supports('color', 'color-mix(in srgb, red, blue)')) return;
  } catch (e) {
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var p = document.createElement('p');
    p.setAttribute('role', 'alert');
    p.style.cssText =
      'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;margin:0;padding:12px 14px;border-radius:12px;background:#7c2d12;color:#fff;font:15px/1.4 system-ui,sans-serif';
    p.textContent =
      'Ce navigateur est trop ancien pour JDR Compagnon : mettez à jour le téléphone (iOS 16.4 ou plus récent) ou Chrome, puis rouvrez cette page.';
    document.body.appendChild(p);
  });
})();
