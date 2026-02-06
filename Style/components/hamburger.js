// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  
  if (!hamburgerBtn || !navMenu) return;

  // Function to close menu
  function closeMenu() {
    hamburgerBtn.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Function to open menu
  function openMenu() {
    hamburgerBtn.classList.add('active');
    navMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Toggle menu on hamburger button click
  hamburgerBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (navMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when close button is clicked
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeMenu();
    });
  }

  // Close menu when a link is clicked
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInsideNav = navMenu.contains(event.target);
    const isClickOnHamburger = hamburgerBtn.contains(event.target);
    
    if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });

  // Close menu on window resize to desktop size
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
});
