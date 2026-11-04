import {writable} from 'svelte/store';

export const error = writable(null);

export const progress = writable({
  progress: 0,
  visible: false,
  text: ''
});
progress.reset = () => {
  progress.set({
    progress: 0,
    visible: false,
    text: ''
  });
};

export const currentTask = writable(null);
currentTask.replace = (newTask) => {
  currentTask.update((old) => {
    if (old) {
      old.abort();
    }
    return newTask;
  });
};
currentTask.abort = () => {
  currentTask.update((old) => {
    if (old) {
      old.abort();
      progress.reset();
    }
    return null;
  });
};

const POSSIBLE_THEMES = [
  'system',
  'dark',
  'light'
];
const THEME_KEY = 'P4.theme';
export const theme = writable('system');
try {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (POSSIBLE_THEMES.includes(storedTheme)) {
    theme.set(storedTheme);
  }
} catch (e) {
  // Ignore
}
const embeddedTheme = new URLSearchParams(location.search).get('theme');
if (POSSIBLE_THEMES.includes(embeddedTheme)) theme.set(embeddedTheme);
window.addEventListener('message', event => {
  if (event.origin !== (location.protocol === 'file:' ? 'null' : location.origin) || event.source !== window.parent) return;
  const data = event.data && event.data.p4;
  if (data && data.type === 'configure') {
    if (POSSIBLE_THEMES.includes(data.theme)) theme.set(data.theme);
    if (typeof data.accent === 'string') document.documentElement.style.setProperty('--packager-accent', data.accent);
  }
});
theme.subscribe((value) => {
  try {
    if (value === 'system') {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, value);
    }
  } catch (e) {
    // ignore
  }
});
