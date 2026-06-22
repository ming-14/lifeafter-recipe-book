import { state, saveCompleted, saveFilters } from './store.js';
import { getRecipes, getAllIngredients } from './data.js';
import { filterRecipes, filterRecipesWithoutIncomplete } from './filter.js';
import { renderLazyBatch, resetLazyLoad } from './lazyload.js';

function renderStats(filteredCount) {
  const total = Object.keys(getRecipes()).length;
  const completedCount = state.completed.size;
  document.getElementById('stats').textContent = `共 ${total} 道食谱 | 已完成 ${completedCount} 道 | 当前显示 ${filteredCount} 道`;
}

function updateFilterToggleState() {
  const btn = document.getElementById('filterToggle');
  const hasFilters = state.selectedIngredients.size > 0 || state.excludedIngredients.size > 0;
  if (hasFilters) {
    btn.classList.add('has-filters');
  } else {
    btn.classList.remove('has-filters');
  }
}

function updateFilterHint() {
  const hint = document.getElementById('filterHint');
  if (state.selectedIngredients.size > 0 && state.excludedIngredients.size > 0) {
    hint.textContent = '您的筛选既有包含又有排除，效果与仅含包含等价';
  } else {
    hint.textContent = '';
  }
}

function renderIngredientsFilter() {
  const container = document.getElementById('ingredientTags');
  const ingredients = getAllIngredients();
  const ingSearch = document.getElementById('ingredientSearch').value.trim().toLowerCase();
  const filteredIngredients = ingSearch
    ? ingredients.filter(ing => ing.toLowerCase().includes(ingSearch))
    : ingredients;

  const hiddenHint = document.getElementById('hiddenFiltersHint');
  if (ingSearch.trim().length > 0) {
    const hiddenSelected = Array.from(state.selectedIngredients).filter(ing =>
      !filteredIngredients.includes(ing)
    );
    const hiddenExcluded = Array.from(state.excludedIngredients).filter(ing =>
      !filteredIngredients.includes(ing)
    );
    const totalHidden = hiddenSelected.length + hiddenExcluded.length;

    if (totalHidden > 0) {
      let hintMsg = `当前有 ${totalHidden} 个筛选条件被隐藏`;
      const parts = [];
      if (hiddenSelected.length > 0) parts.push(`${hiddenSelected.length} 个包含`);
      if (hiddenExcluded.length > 0) parts.push(`${hiddenExcluded.length} 个排除`);
      if (parts.length > 0) hintMsg += `（${parts.join('、')}）`;
      hiddenHint.textContent = hintMsg;
      hiddenHint.classList.add('visible');
    } else {
      hiddenHint.textContent = '';
      hiddenHint.classList.remove('visible');
    }
  } else {
    hiddenHint.textContent = '';
    hiddenHint.classList.remove('visible');
  }

  if (filteredIngredients.length === 0 && ingSearch.trim().length > 0) {
    container.innerHTML = `<div class="no-ingredient-results">未找到匹配的食材："${document.getElementById('ingredientSearch').value.trim()}"</div>`;
  } else {
    container.innerHTML = filteredIngredients.map(ing => {
      let cls = '';
      if (state.selectedIngredients.has(ing)) cls = 'selected';
      else if (state.excludedIngredients.has(ing)) cls = 'excluded';
      return `<span class="ingredient-tag ${cls}" data-ing="${ing}">${ing}</span>`;
    }).join('');

    container.querySelectorAll('.ingredient-tag').forEach(tag => {
      let lastTapTime = 0;
      const doubleTapDelay = 200;
      let touchStartX = 0;
      let touchStartY = 0;

      function handleTap(e, ing) {
        const now = Date.now();

        if (now - lastTapTime < doubleTapDelay) {
          e.preventDefault();
          const isExcludingOnlySelected = state.selectedIngredients.size === 1 && state.selectedIngredients.has(ing);
          if (state.selectedIngredients.has(ing)) {
            state.selectedIngredients.delete(ing);
          }
          if (state.excludedIngredients.has(ing)) {
            state.excludedIngredients.delete(ing);
          } else {
            state.excludedIngredients.add(ing);
            if (isExcludingOnlySelected) {
              state.excludeOnlySelectedMode = true;
            }
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          setTimeout(() => {
            if (lastTapTime === now) {
              if (state.excludedIngredients.has(ing)) {
                state.excludedIngredients.delete(ing);
              } else if (state.selectedIngredients.has(ing)) {
                state.selectedIngredients.delete(ing);
              } else {
                state.selectedIngredients.add(ing);
              }
              saveFilters();
              render();
            }
          }, doubleTapDelay);
          return;
        }
        saveFilters();
        render();
      }

      tag.addEventListener('click', (e) => handleTap(e, tag.dataset.ing));
      tag.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      });
      tag.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        if (deltaX > 10 || deltaY > 10) {
          return;
        }
        handleTap(e, tag.dataset.ing);
      });
      tag.addEventListener('selectstart', (e) => e.preventDefault());
    });

    const clearFilterBtn = document.getElementById('clearFilter');
    if (clearFilterBtn) {
      if (ingSearch.trim().length > 0) {
        clearFilterBtn.style.display = 'none';
      } else {
        clearFilterBtn.style.display = '';
      }
    }
  }
}

function render(animateExclusion = null) {
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const list = document.getElementById('recipeList');
  const entries = Object.entries(getRecipes());

  if (state.excludeOnlySelectedMode) {
    list.innerHTML = `<div class="no-results">排除唯一的包含项不显示结果，<a id="noResultRetry">点我重试</a></div>`;
    resetLazyLoad();
    renderStats(0);
    renderIngredientsFilter();
    updateFilterToggleState();
    updateFilterHint();
    const retryLink = document.getElementById('noResultRetry');
    if (retryLink) {
      retryLink.addEventListener('click', () => {
        state.excludeOnlySelectedMode = false;
        render();
      });
    }
    return;
  }

  const filtered = filterRecipes(entries, search);

  if (filtered.length === 0) {
    const searchVal = document.getElementById('searchInput').value.trim();
    const panel = document.getElementById('filterPanel');
    const isPanelOpen = panel.classList.contains('open');

    let wouldHaveResultsWithoutIncomplete = false;
    if (state.incompleteOnly) {
      const withoutIncomplete = filterRecipesWithoutIncomplete(entries, searchVal);
      wouldHaveResultsWithoutIncomplete = withoutIncomplete.length > 0;
    }

    let msg = '';
    if (wouldHaveResultsWithoutIncomplete) {
      msg = '恭喜你，匹配的食谱已经全部完成，<a id="noResultIncomplete">点击取消"仅未完成"的筛选条件</a>';
    } else {
      msg = '没有找到匹配的食谱';
      if (searchVal) {
        msg += '，<a id="noResultSearch">试试重新搜索</a>';
      } else if (!isPanelOpen) {
        msg += '，<a id="noResultFilter">试试重新筛选</a>';
      }
    }
    list.innerHTML = `<div class="no-results">${msg}</div>`;
    resetLazyLoad();
    renderStats(0);
    renderIngredientsFilter();
    updateFilterToggleState();
    updateFilterHint();

    const incompleteLink = document.getElementById('noResultIncomplete');
    if (incompleteLink) {
      incompleteLink.addEventListener('click', () => {
        state.incompleteOnly = false;
        document.getElementById('incompleteOnly').checked = false;
        localStorage.setItem('incompleteOnly', false);
        render();
      });
    }
    const searchLink = document.getElementById('noResultSearch');
    if (searchLink) {
      searchLink.addEventListener('click', () => {
        const input = document.getElementById('searchInput');
        input.focus();
        input.select();
      });
    }
    const filterLink = document.getElementById('noResultFilter');
    if (filterLink) {
      filterLink.addEventListener('click', () => {
        document.getElementById('filterToggle').click();
      });
    }
    return;
  }

  renderLazyBatch(list, filtered, animateExclusion);
}

function renderWithExclusionAnimation(excludedIng) {
  const cards = document.querySelectorAll('.recipe-card');
  let animating = 0;
  cards.forEach(card => {
    const chips = card.querySelectorAll('.ingredient-chip');
    const hasExcluded = Array.from(chips).some(chip => {
      return chip.childNodes[0].textContent.trim() === excludedIng;
    });
    if (hasExcluded) {
      animating++;
      card.classList.add('fading-out');
    }
  });
  if (animating > 0) {
    setTimeout(() => {
      render();
    }, 600);
  } else {
    render();
  }
}

function bindCardEvents(list, animateExclusion = null) {
  list.querySelectorAll('.recipe-header input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const name = cb.dataset.name;
      const card = cb.closest('.recipe-card');
      if (cb.checked) {
        state.completed.add(name);
        if (state.incompleteOnly && card) {
          card.classList.add('fading-out');
          setTimeout(() => {
            saveCompleted();
            render();
          }, 600);
          return;
        }
      } else {
        state.completed.delete(name);
      }
      saveCompleted();
      render();
    });
  });

  list.querySelectorAll('.ingredient-chip').forEach(chip => {
    let lastTapTime = 0;
    const doubleTapDelay = 300;
    let chipTouchStartX = 0;
    let chipTouchStartY = 0;

    function handleChipTap(e) {
      const now = Date.now();
      const ing = chip.childNodes[0].textContent.trim();

      if (now - lastTapTime < doubleTapDelay) {
        e.preventDefault();
        const isExcludingOnlySelected = state.selectedIngredients.size === 1 && state.selectedIngredients.has(ing) && !state.excludedIngredients.has(ing);
        if (state.selectedIngredients.has(ing)) {
          state.selectedIngredients.delete(ing);
        }
        if (state.excludedIngredients.has(ing)) {
          state.excludedIngredients.delete(ing);
          saveFilters();
          render();
        } else {
          state.excludedIngredients.add(ing);
          saveFilters();
          if (isExcludingOnlySelected) {
            state.excludeOnlySelectedMode = true;
            render();
          } else {
            renderWithExclusionAnimation(ing);
          }
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    }

    chip.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastTapTime < doubleTapDelay) {
        handleChipTap(e);
      } else {
        lastTapTime = now;
      }
    });
    chip.addEventListener('dblclick', handleChipTap);
    chip.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      chipTouchStartX = touch.clientX;
      chipTouchStartY = touch.clientY;
    });
    chip.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - chipTouchStartX);
      const deltaY = Math.abs(touch.clientY - chipTouchStartY);
      if (deltaX > 10 || deltaY > 10) {
        return;
      }
      handleChipTap(e);
    });
    chip.addEventListener('selectstart', (e) => e.preventDefault());
  });
}

export { render, renderStats, renderIngredientsFilter, updateFilterToggleState, updateFilterHint, renderWithExclusionAnimation, bindCardEvents };
