const state = {
  completed: new Set(JSON.parse(localStorage.getItem('completedRecipes') || '[]')),
  selectedIngredients: new Set(JSON.parse(localStorage.getItem('selectedIngredients') || '[]')),
  excludedIngredients: new Set(JSON.parse(localStorage.getItem('excludedIngredients') || '[]')),
  incompleteOnly: localStorage.getItem('incompleteOnly') === 'true',
  filterPanelOpen: localStorage.getItem('filterPanelOpen') === 'true',
  excludeOnlySelectedMode: false
};

function saveCompleted() {
  localStorage.setItem('completedRecipes', JSON.stringify(Array.from(state.completed)));
}

function saveFilters() {
  localStorage.setItem('selectedIngredients', JSON.stringify(Array.from(state.selectedIngredients)));
  localStorage.setItem('excludedIngredients', JSON.stringify(Array.from(state.excludedIngredients)));
}

export { state, saveCompleted, saveFilters };
