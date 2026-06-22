import { loadRecipes } from './data.js';
import { state, saveFilters } from './store.js';
import { render, renderIngredientsFilter } from './render.js';

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const incompleteOnlyCheckbox = document.getElementById('incompleteOnly');
const ingredientSearch = document.getElementById('ingredientSearch');
const clearIngredientSearchBtn = document.getElementById('clearIngredientSearchBtn');

searchInput.addEventListener('input', () => {
  render();
  if (searchInput.value.trim().length > 0) {
    clearSearchBtn.classList.add('visible');
  } else {
    clearSearchBtn.classList.remove('visible');
  }
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.remove('visible');
  searchInput.focus();
  render();
});

incompleteOnlyCheckbox.checked = state.incompleteOnly;
incompleteOnlyCheckbox.addEventListener('change', () => {
  state.incompleteOnly = incompleteOnlyCheckbox.checked;
  localStorage.setItem('incompleteOnly', state.incompleteOnly);
  render();
});

if (state.filterPanelOpen) {
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggle');
  panel.classList.add('open');
  btn.classList.add('active');
}

document.getElementById('filterToggle').addEventListener('click', () => {
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggle');
  const wasOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  btn.classList.toggle('active');
  localStorage.setItem('filterPanelOpen', panel.classList.contains('open'));
  if (wasOpen) {
    document.getElementById('ingredientSearch').value = '';
    renderIngredientsFilter();
  }
});

ingredientSearch.addEventListener('input', () => {
  renderIngredientsFilter();
  if (ingredientSearch.value.trim().length > 0) {
    clearIngredientSearchBtn.classList.add('visible');
  } else {
    clearIngredientSearchBtn.classList.remove('visible');
  }
});

clearIngredientSearchBtn.addEventListener('click', () => {
  ingredientSearch.value = '';
  clearIngredientSearchBtn.classList.remove('visible');
  ingredientSearch.focus();
  renderIngredientsFilter();
});

document.getElementById('clearFilter').addEventListener('click', () => {
  state.selectedIngredients.clear();
  state.excludedIngredients.clear();
  state.excludeOnlySelectedMode = false;
  saveFilters();
  render();
});

async function init() {
  try {
    await loadRecipes();
    render();
  } catch (e) {
    document.getElementById('recipeList').innerHTML = '<div class="no-results">加载食谱数据失败</div>';
  }
}

init();
