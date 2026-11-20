/* Current catalogue. The archived checkpoint remains the repeatable comparison. */
Pizza.DATA = {
  items: [
    { id: 'flour', name: 'Flour', group: 'ingredients', icon: 'bag', note: '1 unit makes 1 dough.' },
    { id: 'sauce', name: 'Sauce', group: 'ingredients', icon: 'jar', note: '1 unit per batch of 8 slices.' },
    { id: 'cheese', name: 'Cheese', group: 'ingredients', icon: 'cheese', note: '1 unit per batch of 8 slices.' },
    { id: 'pepperoni', name: 'Pepperoni', group: 'toppings', icon: 'topping', note: '1 portion per pepperoni slice.' },
    { id: 'mushroom', name: 'Mushroom', group: 'toppings', icon: 'mushroom', note: '1 portion per mushroom slice.' },
    { id: 'green_peppers', name: 'Green Peppers', group: 'toppings', icon: 'pepper', note: '1 portion per green pepper slice.' },
    { id: 'napkins', name: 'Napkins', group: 'supplies', icon: 'napkin', note: '1 per sale. Helps buy chance and reactions.' },
    { id: 'paper_plates', name: 'Paper Plates', group: 'supplies', icon: 'plate', note: '1 per sale. Helps buy chance and reactions.' },
    { id: 'pop', name: 'Pop', group: 'supplies', icon: 'pop', note: 'Optional $1.50 drink sale. Each sale adds 1 refundable can.' }
  ],
  recipes: [
    { id: 'plain', name: 'Plain Slice', ingredients: [], note: 'Cheese-adjacent optimism on dough.' },
    { id: 'pepperoni', name: 'Pepperoni Slice', ingredients: ['pepperoni'], note: 'A reliable way to look intentional.' },
    { id: 'mushroom', name: 'Mushroom Slice', ingredients: ['mushroom'], note: 'A little roadside-foraged energy.' },
    { id: 'green_peppers', name: 'Green Pepper Slice', ingredients: ['green_peppers'], note: 'Slightly fresher than the building.' },
    { id: 'classic', name: 'The Classic', ingredients: ['pepperoni', 'mushroom'], note: 'Safe, sturdy and hard to argue with.' }
  ],
  upgrades: [
    { id: 'clean_microwave', name: 'Clean Microwave', icon: 'microwave', tag: 'ESSENTIAL', effect: 'Required to open. Removes 1 dirt.', note: 'Cleaning this thing could not hurt.' },
    { id: 'hand_made_sign', name: 'Hand Made Sign', icon: 'sign', tag: 'REPUTATION', effect: '+2 reputation. More people stop by.', note: 'Now they know this is a pizza place.' },
    { id: 'folding_table', name: 'Folding Table', icon: 'table', tag: 'CAPACITY', effect: '+5 customers served per day.', note: 'Technically, it is a table.' },
    { id: 'mini_fridge', name: 'Mini Fridge', icon: 'fridge', tag: 'FRESHNESS', effect: 'Toppings stay fresh for 7 days.', note: 'Seven days instead of one sad afternoon.' },
    { id: 'second_microwave', name: 'Second Microwave', icon: 'microwave', tag: 'CAPACITY', effect: '+5 customers served per day.', note: 'Two is better than one.' },
    { id: 'tiny_menu_board', name: 'Tiny Menu Board', icon: 'menu', tag: 'VARIETY', effect: '+1 active recipe slot.', note: 'Just enough room to imply a real menu.' }
  ],
  events: [
    { id: 'big_game', name: 'Big Game Day', type: 'random', text: 'The big game is on tomorrow. Everyone has opinions and some of them have cash.' },
    { id: 'rain', name: 'Rain Day', type: 'random', text: 'Tomorrow looks wet. People prefer their pizza indoors.' },
    { id: 'scratch', name: 'Scratch Ticket Win', type: 'random', text: 'You found a lucky scratch ticket. Finally, a business plan.' },
    { id: 'good_tv', name: 'Good TV Interview', type: 'random', text: 'You talked about pizza on television. Somehow, it went well.' },
    { id: 'bad_tv', name: 'Bad TV Interview', type: 'random', text: 'The interview aired. They kept the part about the microwave.' },
    { id: 'cat', name: 'Cat on the Counter', type: 'random', text: 'The crowd loved it. The counter did not.' },
    { id: 'garbage', name: 'Garbage Truck Go By', type: 'random', text: 'A garbage truck clears the pile. A brief moment of dignity.' },
    { id: 'windfall', name: 'Recycling Windfall', type: 'random', text: 'The depot is paying extra for your next collection.' },
    { id: 'weekend', name: 'Weekend!', type: 'scheduled', text: 'People have free time and questionable lunch plans.' },
    { id: 'rats', name: 'Rats', type: 'conditional', text: 'A rat found the leftovers. It seems optimistic about the business.' },
    { id: 'sympathy', name: 'Sympathy Tip', type: 'recovery', text: 'A stranger says they respect the hustle. You are not sure they should.' },
    { id: 'wheelchair', name: 'A Wheelchair from Cans', type: 'secret', text: 'You redeem the cans. The neighbours supply the parts and help build a wheelchair. Word gets around.' }
  ],
  reactions: {
    delighted: ['“Structural confidence. I like that in a slice.”', '“I would tell someone about this.”', '“Honestly? I have paid more for worse.”'],
    satisfied: ['“That was, legally speaking, lunch.”', '“Aggressively fine.”', '“Does what it says on the sign.”'],
    neutral: ['They eat in thoughtful silence.', 'They take a slice and reassess the afternoon.', 'No complaints. No eye contact either.'],
    disgusted: ['“Is the counter supposed to move?”', 'They ask for a napkin and an explanation.', '“I have concerns about the atmosphere.”'],
    passed: ['A passerby considers the price and keeps walking.', 'Someone checks the menu. Not today.', 'A person says they already ate. Convincingly.']
  }
};

// The notebook is the single source for discovery combinations and topping balance.
for (const item of Pizza.RECIPE_BOOK.ingredients) {
  if (!Pizza.DATA.items.some(existing => existing.id === item.id))
    Pizza.DATA.items.push({ id: item.id, name: item.name, group: 'toppings', icon: 'topping', note: '1 portion per slice that uses this topping.' });
  Pizza.DATA.items.find(existing => existing.id === item.id).name = item.name;
  Pizza.CONFIG.inventoryCosts[item.id] = item.cost;
  Pizza.CONFIG.toppingUnlocks[item.id] = item.sold;
}
Pizza.DATA.recipes = Pizza.RECIPE_BOOK.recipes.map(recipe => ({ ...recipe, ingredients: [...recipe.ingredients] }));
for (const recipe of Pizza.DATA.recipes) {
  Pizza.CONFIG.recipeBonuses[recipe.id] = recipe.bonus;
  Pizza.CONFIG.recipeDelight[recipe.id] = recipe.delight;
}
