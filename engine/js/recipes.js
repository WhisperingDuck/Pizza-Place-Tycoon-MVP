(function (P) {
  'use strict';
  const catalogue = P.RECIPE_BOOK;
  const selection = value => typeof value === 'string' ? value.split(',').filter(Boolean).sort() : [];
  const signature = ingredients => [...ingredients].sort().join(',');
  const match = ingredients => P.DATA.recipes.find(recipe => signature(recipe.ingredients) === signature(ingredients));
  function check(s, value) {
    const ingredients = selection(value), key = signature(ingredients);
    const fail = code => ({ ok: false, code, ingredients });
    if (s.phase !== 'management') return fail('beforeOpen');
    if (s.action) return fail('finishWork');
    if (!ingredients.length) return fail('choose');
    if (ingredients.length > catalogue.maxToppings || new Set(ingredients).size !== ingredients.length) return fail('limit');
    if (ingredients.some(id => !catalogue.ingredients.some(item => item.id === id) || !P.State.unlocked(s, id))) return fail('locked');
    const recipe = match(ingredients);
    if (recipe && s.recipeBook.known.includes(recipe.id)) return fail('known');
    if (s.recipeBook.attempts.some(attempt => signature(attempt.ingredients) === key)) return fail('repeat');
    if (!s.inventory.slices) return fail('needSlice');
    if (ingredients.some(id => s.inventory[id] < 1)) return fail('needStock');
    return { ok: true, ingredients, recipe };
  }
  function test(s, value) {
    const result = check(s, value);
    if (!result.ok) return { ok: false, message: result.code };
    s.inventory.slices--;
    for (const id of result.ingredients) {
      s.inventory[id]--;
      const lot = s.lots[id].find(entry => entry.quantity > 0);
      lot.quantity--;
      s.lots[id] = s.lots[id].filter(entry => entry.quantity > 0);
    }
    s.today.tastedSlices++;
    const attempt = { ingredients: result.ingredients, recipe: result.recipe?.id || null, day: s.day };
    s.recipeBook.attempts.push(attempt);
    s.recipeBook.last = attempt;
    if (result.recipe) {
      s.recipeBook.known.push(result.recipe.id);
      s.today.discoveries.push(result.recipe.id);
      P.State.log(s, 'unlock', 'Discovered ' + result.recipe.name + '.');
    }
    return { ok: true, recipe: result.recipe?.id || null, message: result.recipe ? 'found' : 'notYet' };
  }
  function valid(s) {
    const book = s.recipeBook;
    if (!book || !Array.isArray(book.known) || !book.known.includes('plain') || new Set(book.known).size !== book.known.length ||
      !book.known.every(id => P.DATA.recipes.some(recipe => recipe.id === id)) || !Array.isArray(book.attempts) || book.attempts.length > 100) return false;
    const keys = new Set();
    for (const attempt of book.attempts) {
      if (!Array.isArray(attempt.ingredients) || !attempt.ingredients.length || attempt.ingredients.length > catalogue.maxToppings ||
        new Set(attempt.ingredients).size !== attempt.ingredients.length || !attempt.ingredients.every(id => catalogue.ingredients.some(item => item.id === id)) ||
        !Number.isInteger(attempt.day) || attempt.day < 1 || attempt.day > s.day) return false;
      const key = signature(attempt.ingredients), recipe = match(attempt.ingredients);
      if (keys.has(key) || attempt.recipe !== (recipe?.id || null) || (recipe && !book.known.includes(recipe.id))) return false;
      keys.add(key);
    }
    return s.menu.every(id => book.known.includes(id));
  }
  P.Recipes = { check, test, valid };
})(Pizza);
