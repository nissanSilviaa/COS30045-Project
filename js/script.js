document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('nav a[data-target]');
    const sections = document.querySelectorAll('.tab-content');
  
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        // deactivate all tabs & sections
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
  
        // activate the clicked tab + target section
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
      });
    });
  
    // You can hook into each chart-container here to render D3/Chart.js plots,
    // e.g. initRandomBreathChart('#chart-random-breath'), etc.
  });
  