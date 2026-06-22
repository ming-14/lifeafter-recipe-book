let recipes = {};

async function loadRecipes() {
  try {
    const res = await fetch('data/food_recipes.json');
    recipes = await res.json();
    return recipes;
  } catch (e) {
    throw e;
  }
}

function getRecipes() {
  return recipes;
}

function getAllIngredients() {
  const set = new Set();
  Object.values(recipes).forEach(arr => {
    arr.forEach(obj => Object.keys(obj).forEach(k => set.add(k)));
  });
  return Array.from(set).sort();
}

export { loadRecipes, getRecipes, getAllIngredients };
