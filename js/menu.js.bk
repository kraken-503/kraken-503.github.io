document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.getAttribute('data-section');

    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show the selected section
    document.getElementById(target).classList.remove('hidden');

    // Remove active class from all links
    document.querySelectorAll('.nav-menu a').forEach(a => {
      a.classList.remove('active');
    });

    // Add active class to the clicked link
    link.classList.add('active');
  });
});

