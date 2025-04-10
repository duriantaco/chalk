export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  NEON: 'neon'  
};

export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('chalk-theme') || THEMES.DARK;
  applyTheme(savedTheme);
  return savedTheme;
};

export const setupThemeObserver = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.classList.contains('bg-gray-800') || 
                node.classList.contains('bg-gray-850') || 
                node.classList.contains('bg-gray-900')) {
              node.classList.add('theme-card');
            }
            
            if ((node.classList.contains('w-10') || node.classList.contains('w-12')) && 
                node.classList.contains('h-screen')) {
              node.classList.add('theme-sidebar');
            }
            
            applyThemeToElement(node);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  return observer;
};

function applyThemeToElement(element) {
  element.querySelectorAll('.bg-gray-800, .bg-gray-850, .bg-gray-900, .workspace-card, .card-metallic')
    .forEach(el => {
      el.classList.add('theme-card');
    });
    
  element.querySelectorAll('.w-10.h-screen, .w-12.h-screen')
    .forEach(el => {
      el.classList.add('theme-sidebar');
    });
    
  element.querySelectorAll('input, textarea, select')
    .forEach(el => {
      el.classList.add('theme-input');
    });
    
  element.querySelectorAll('.bg-indigo-600')
    .forEach(el => {
      el.classList.add('theme-button-primary');
    });
    
  element.querySelectorAll('.text-white, .text-gray-300')
    .forEach(el => {
      el.classList.add('theme-text-primary');
    });
    
  element.querySelectorAll('.text-gray-400, .text-gray-500')
    .forEach(el => {
      el.classList.add('theme-text-secondary');
    });
}

export const applyTheme = (theme) => {
  document.documentElement.classList.add('theme-transitioning');
  
  requestAnimationFrame(() => {
    document.documentElement.classList.remove(THEMES.DARK, THEMES.LIGHT, THEMES.NEON);
    document.body.classList.remove(THEMES.DARK, THEMES.LIGHT, THEMES.NEON);
    
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
    document.body.classList.add(`theme-${theme}-mode`);
    
    localStorage.setItem('chalk-theme', theme);
    
    switch(theme) { 
      case THEMES.LIGHT:
        document.documentElement.style.setProperty('--bg-primary', '#f8fafc');   
        document.documentElement.style.setProperty('--bg-secondary', '#f1f5f9'); 
        document.documentElement.style.setProperty('--bg-tertiary', '#e2e8f0');  
        document.documentElement.style.setProperty('--text-primary', '#1e293b'); 
        document.documentElement.style.setProperty('--text-secondary', '#475569');
        document.documentElement.style.setProperty('--border-color', '#cbd5e1');
        
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--sidebar-bg', '#f1f5f9');
        document.documentElement.style.setProperty('--input-bg', '#f8fafc');
        document.documentElement.style.setProperty('--button-primary', '#818cf8');
        document.documentElement.style.setProperty('--button-hover', '#6366f1');
        document.documentElement.style.setProperty('--highlight', '#6366f1');
        document.documentElement.style.setProperty('--button-text', '#ffffff');
        break;
        
      case THEMES.NEON:
        document.documentElement.style.setProperty('--bg-primary', '#0a0120');      
        document.documentElement.style.setProperty('--bg-secondary', '#12033a');    
        document.documentElement.style.setProperty('--bg-tertiary', '#1f0650');     
        document.documentElement.style.setProperty('--text-primary', '#00fff2');   
        document.documentElement.style.setProperty('--text-secondary', '#fe01e6');
        document.documentElement.style.setProperty('--border-color', '#39ff14');
        
        document.documentElement.style.setProperty('--card-bg', '#12033a');
        document.documentElement.style.setProperty('--sidebar-bg', '#0a0120');
        document.documentElement.style.setProperty('--input-bg', '#1f0650');
        document.documentElement.style.setProperty('--button-primary', '#fe01e6');
        document.documentElement.style.setProperty('--button-hover', '#b100a0');
        document.documentElement.style.setProperty('--highlight', '#39ff14');
        document.documentElement.style.setProperty('--button-text', '#ffffff');
        break;
        
      case THEMES.DARK:
      default:
        document.documentElement.style.setProperty('--bg-primary', '#111827');
        document.documentElement.style.setProperty('--bg-secondary', '#1f2937');
        document.documentElement.style.setProperty('--bg-tertiary', '#374151');
        document.documentElement.style.setProperty('--text-primary', '#f9fafb');
        document.documentElement.style.setProperty('--text-secondary', '#d1d5db');
        document.documentElement.style.setProperty('--border-color', '#374151');
        
        document.documentElement.style.setProperty('--card-bg', '#1f2937');
        document.documentElement.style.setProperty('--sidebar-bg', '#111827');
        document.documentElement.style.setProperty('--input-bg', '#374151');
        document.documentElement.style.setProperty('--button-primary', '#4f46e5');
        document.documentElement.style.setProperty('--button-hover', '#4338ca');
        document.documentElement.style.setProperty('--highlight', '#4f46e5');
        document.documentElement.style.setProperty('--button-text', '#ffffff');
        break;
    }
    
    applyThemeToExistingElements(theme);
    applyThemeSpecificAdjustments(theme);
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300); 
    
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  });
};

function applyThemeToExistingElements(theme) {
  document.querySelectorAll('.bg-gray-900').forEach(el => {
    if (el.classList.contains('w-10') || el.classList.contains('w-12')) {
      el.classList.add('theme-sidebar');
    }
  });

  const cards = document.querySelectorAll('.bg-gray-800, .bg-gray-850, .bg-gray-900');
  cards.forEach(card => {
    card.classList.add('theme-card');
  });
  
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.classList.add('theme-input');
  });
  
  const primaryButtons = document.querySelectorAll('.bg-indigo-600');
  primaryButtons.forEach(button => {
    button.classList.add('theme-button-primary');
  });
  
  const badges = document.querySelectorAll('.bg-gray-800.rounded-full');
  badges.forEach(badge => {
    badge.classList.add('theme-badge');
  });
  
  const workspaceCards = document.querySelectorAll('.workspace-card');
  workspaceCards.forEach(card => {
    card.classList.add('theme-card');
  });
}

function applyThemeSpecificAdjustments(theme) {
  if (theme === THEMES.LIGHT) {
    
    document.querySelectorAll('.bg-gradient-to-br.from-indigo-600.to-purple-700, .bg-gradient-to-r.from-indigo-500.to-purple-600').forEach(el => {
      el.classList.add('light-gradient');
    });
    
    document.querySelectorAll('.h-1\\.5.bg-gray-700').forEach(el => {
      el.classList.add('light-progress-track');
    });
    
    document.querySelectorAll('.h-full.bg-gradient-to-r.from-indigo-500.to-purple-600').forEach(el => {
      el.classList.add('light-progress-bar');
    });
    
    document.querySelectorAll('.h-8.w-px.bg-gray-700').forEach(el => {
      el.classList.add('light-divider');
    });
    
    document.querySelectorAll('.p-1\\.5.rounded-full.bg-gray-700').forEach(el => {
      el.classList.add('light-delete-btn');
    });
    
  } else {
    document.querySelectorAll('.light-gradient, .light-progress-track, .light-progress-bar, .light-divider, .light-delete-btn').forEach(el => {
      el.classList.remove('light-gradient', 'light-progress-track', 'light-progress-bar', 'light-divider', 'light-delete-btn');
    });
  }
  
  if (theme === THEMES.NEON) {
    document.body.classList.add('neon-theme-active');
  } else {
    document.body.classList.remove('neon-theme-active');
  }
}