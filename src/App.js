import React from 'react';
import './App.css';
import { gsap } from 'gsap';
import ThreeScene from './components/ThreeScene'; // Import the ThreeScene component

window.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const sectionIds = ['home', 'about', 'contact'];
  let currentSectionIndex = 0;
  let isScrolling = false;

  window.navigateTo = function(sectionId) {
    const index = sectionIds.indexOf(sectionId);
    if (index !== -1 && index !== currentSectionIndex) {
      scrollToSection(index);
    }
  };

  function scrollToSection(index) {
    if (isScrolling) return;
    isScrolling = true;

    const currentSection = sections[currentSectionIndex];
    const nextSection = sections[index];

    gsap.to(currentSection, { opacity: 0, duration: 1, ease: "power2.inOut", onComplete: () => {
      currentSection.classList.remove('active');
      nextSection.classList.add('active');
      gsap.to(nextSection, { opacity: 1, duration: 1, ease: "power2.inOut", onComplete: () => {
        isScrolling = false;
      } });
    }});

    currentSectionIndex = index;
    updateNavigation();
  }

  function updateNavigation() {
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSectionIndex);
    });
  }

  const firstSection = sections[0];
  firstSection.style.display = 'flex';
  gsap.to(firstSection, { opacity: 1, duration: 1, ease: "power2.inOut", onStart: () => firstSection.classList.add('active') });
  updateNavigation(); // Ensure correct navigation dot is shown on load
});

function App() {
  return (
    <div className="App">
      <ThreeScene /> {/* Render the ThreeScene component */}
      {/* Your other component code */}
    </div>
  );
}

export default App;
