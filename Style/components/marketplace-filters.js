// Off-canvas filters for marketplace (mobile)
document.addEventListener('DOMContentLoaded', function() {
  const mobileFilterBtn = document.getElementById('mobileFilterBtn');
  const closeFiltersBtn = document.getElementById('closeFiltersBtn');
  const filtersAside = document.querySelector('.marketplace-filters');

  // create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'filters-overlay';
  overlay.id = 'filtersOverlay';
  document.body.appendChild(overlay);

  if (!mobileFilterBtn || !filtersAside) return;

  function openFilters() {
    document.body.classList.add('filters-open');
    overlay.classList.add('visible');
    mobileFilterBtn.setAttribute('aria-expanded', 'true');
    // focus the close button for accessibility
    if (closeFiltersBtn) {
      setTimeout(() => closeFiltersBtn.focus(), 100);
    }
  }

  function closeFilters() {
    document.body.classList.remove('filters-open');
    overlay.classList.remove('visible');
    mobileFilterBtn.setAttribute('aria-expanded', 'false');
    // return focus to the button
    mobileFilterBtn.focus();
  }

  mobileFilterBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (document.body.classList.contains('filters-open')) {
      closeFilters();
    } else {
      openFilters();
    }
  });

  if (closeFiltersBtn) {
    closeFiltersBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeFilters();
    });
  }

  overlay.addEventListener('click', function() {
    closeFilters();
  });

  // close when pressing Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.body.classList.contains('filters-open')) {
      closeFilters();
    }
  });

  // close when resizing to wide screens
  window.addEventListener('resize', function() {
    if (window.innerWidth > 900) closeFilters();
  });

  // close when navigating via links inside filters
  filtersAside.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeFilters()));
});
