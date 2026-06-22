import { state } from './store.js';
import { renderStats, renderIngredientsFilter, updateFilterToggleState, updateFilterHint, bindCardEvents } from './render.js';

let lazyLoadPageSize = 12;
let currentLazyLoadIndex = 0;
let currentFilteredRecipes = [];
let isLoadingMore = false;
let lazyLoadObserver = null;

function resetLazyLoad() {
  currentLazyLoadIndex = 0;
  currentFilteredRecipes = [];
  removeLazyLoadObserver();
}

function renderLazyBatch(list, filtered, animateExclusion = null) {
  currentFilteredRecipes = filtered;
  const totalRecipes = currentFilteredRecipes.length;
  const endIndex = Math.min(currentLazyLoadIndex + lazyLoadPageSize, totalRecipes);
  const batchToRender = currentFilteredRecipes.slice(currentLazyLoadIndex, endIndex);

  if (currentLazyLoadIndex === 0) {
    list.innerHTML = '';
  }

  const cardsHtml = batchToRender.map(([name, ingredients]) => {
    const isCompleted = state.completed.has(name);
    const ingHtml = ingredients.map(obj => {
      const [k, v] = Object.entries(obj)[0];
      const excludedCls = state.excludedIngredients.has(k) ? 'excluded' : '';
      return `<span class="ingredient-chip ${excludedCls}">${k}<span class="count">×${v}</span></span>`;
    }).join('');
    return `
      <div class="recipe-card ${isCompleted ? 'completed' : ''}" data-name="${name}">
        <div class="recipe-header">
          <div class="recipe-name">${name}</div>
          <label class="checkbox-wrap">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} data-name="${name}">
            已完成
          </label>
        </div>
        <div class="ingredients">${ingHtml}</div>
      </div>
    `;
  }).join('');

  if (currentLazyLoadIndex === 0) {
    list.innerHTML = cardsHtml;
  } else {
    const oldTrigger = list.querySelector('.lazy-load-trigger');
    if (oldTrigger) {
      oldTrigger.remove();
    }
    list.insertAdjacentHTML('beforeend', cardsHtml);
  }

  currentLazyLoadIndex = endIndex;

  bindCardEvents(list, animateExclusion);
  renderStats(totalRecipes);

  if (currentLazyLoadIndex < totalRecipes) {
    const trigger = document.createElement('div');
    trigger.className = 'lazy-load-trigger loading';
    trigger.id = 'lazyLoadTrigger';
    trigger.innerHTML = '<span class="lazy-spinner"></span>加载更多...';
    list.appendChild(trigger);
    setupLazyLoadObserver(trigger);
  } else {
    if (totalRecipes > lazyLoadPageSize) {
      const completeTrigger = document.createElement('div');
      completeTrigger.className = 'lazy-load-trigger complete';
      completeTrigger.textContent = `— 已显示全部 ${totalRecipes} 道食谱 —`;
      list.appendChild(completeTrigger);
    }
    removeLazyLoadObserver();
  }

  renderIngredientsFilter();
  updateFilterToggleState();
  updateFilterHint();
}

function setupLazyLoadObserver(trigger) {
  removeLazyLoadObserver();
  lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoadingMore) {
        loadMoreRecipes();
      }
    });
  }, {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  });
  lazyLoadObserver.observe(trigger);
}

function removeLazyLoadObserver() {
  if (lazyLoadObserver) {
    lazyLoadObserver.disconnect();
    lazyLoadObserver = null;
  }
}

function loadMoreRecipes() {
  if (isLoadingMore || currentLazyLoadIndex >= currentFilteredRecipes.length) {
    return;
  }

  isLoadingMore = true;
  const list = document.getElementById('recipeList');

  const trigger = document.getElementById('lazyLoadTrigger');
  if (trigger) {
    trigger.innerHTML = '<span class="lazy-spinner"></span>加载中...';
  }

  setTimeout(() => {
    renderLazyBatch(list, currentFilteredRecipes);
    isLoadingMore = false;
  }, 100);
}

export { renderLazyBatch, resetLazyLoad, loadMoreRecipes };
