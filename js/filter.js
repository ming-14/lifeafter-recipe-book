import { state } from './store.js';

function filterRecipes(entries, search) {
  return entries.filter(([name, ingredients]) => {
    if (search && !name.toLowerCase().includes(search)) return false;
    if (state.incompleteOnly && state.completed.has(name)) return false;
    const recipeIngs = ingredients.map(obj => Object.keys(obj)[0]);
    if (state.selectedIngredients.size > 0) {
      const hasAny = Array.from(state.selectedIngredients).some(ing => recipeIngs.includes(ing));
      if (!hasAny) return false;
    }
    if (state.excludedIngredients.size > 0) {
      const hasAny = Array.from(state.excludedIngredients).some(ing => recipeIngs.includes(ing));
      if (hasAny) return false;
    }
    return true;
  });
}

function filterRecipesWithoutIncomplete(entries, search) {
  return entries.filter(([name, ingredients]) => {
    if (search && !name.toLowerCase().includes(search)) return false;
    const recipeIngs = ingredients.map(obj => Object.keys(obj)[0]);
    if (state.selectedIngredients.size > 0) {
      const hasAny = Array.from(state.selectedIngredients).some(ing => recipeIngs.includes(ing));
      if (!hasAny) return false;
    }
    if (state.excludedIngredients.size > 0) {
      const hasAny = Array.from(state.excludedIngredients).some(ing => recipeIngs.includes(ing));
      if (hasAny) return false;
    }
    return true;
  });
}

export { filterRecipes, filterRecipesWithoutIncomplete };
