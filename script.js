// --- Authentication & Routing ---

// Register Function
function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    // Get Conditions
    const conditions = [];
    if(document.getElementById('cond-lactose').checked) conditions.push('lactose');
    if(document.getElementById('cond-gluten').checked) conditions.push('gluten');
    if(document.getElementById('cond-diabetes').checked) conditions.push('diabetes');
    if(document.getElementById('cond-visitor').checked && conditions.length === 0) conditions.push('visitor');

    const user = { username, email, password, conditions };
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('Registration Successful! Please Login.');
    window.location.href = 'index.html';
}

// Login Function
function loginUser(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;
    
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));

    if (storedUser && storedUser.username === usernameInput && storedUser.password === passwordInput) {
        // Redirect logic based on condition
        let targetSection = '';
        if (storedUser.conditions.includes('diabetes')) targetSection = 'diabetes-section';
        else if (storedUser.conditions.includes('lactose')) targetSection = 'lactose-section';
        else if (storedUser.conditions.includes('gluten')) targetSection = 'gluten-section';
        
        // Save target in session so home page knows where to scroll
        sessionStorage.setItem('targetSection', targetSection);
        window.location.href = 'home.html';
    } else {
        alert('Invalid credentials or no user found.');
    }
}

// --- XML Handling & Home Page Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on home.html
    if (window.location.pathname.endsWith('home.html')) {
        loadRecipesXML();
        
        // Scroll to specific section if set
        const target = sessionStorage.getItem('targetSection');
        if (target) {
            setTimeout(() => {
                const element = document.getElementById(target);
                if(element) element.scrollIntoView({behavior: 'smooth'});
            }, 500); // Slight delay to ensure DOM is ready
        }
    }

    // Check if we are on recipe.html
    if (window.location.pathname.endsWith('recipe.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        if(recipeId) loadSingleRecipe(recipeId);
    }
});

let xmlDoc = null;

async function loadRecipesXML() {
    try {
        const response = await fetch('data.xml');
        const str = await response.text();
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(str, "text/xml");
        
        // No dynamic generation of grid needed as it's static structure in HTML,
        // but we attach event listeners here.
    } catch (e) {
        console.error("Error loading XML:", e);
    }
}

// Function called when user clicks a Meal Box (e.g., Breakfast under Diabetes)
function showRecipeList(category, mealType) {
    if (!xmlDoc) return;

    const categoryNode = xmlDoc.querySelector(`category[id="${category}"]`);
    const mealNode = categoryNode.querySelector(`meal[type="${mealType}"]`);
    const recipes = mealNode.getElementsByTagName('recipe');

    const listContainer = document.getElementById('recipe-list-content');
    listContainer.innerHTML = ''; // Clear previous

    if (recipes.length === 0) {
        listContainer.innerHTML = '<p>No recipes found.</p>';
    } else {
        for (let i = 0; i < recipes.length; i++) {
            const id = recipes[i].getAttribute('id');
            const name = recipes[i].querySelector('name').textContent;
            
            const link = document.createElement('a');
            link.href = `recipe.html?id=${id}`;
            link.className = 'recipe-link';
            link.textContent = name;
            listContainer.appendChild(link);
        }
    }

    document.getElementById('popover-overlay').style.display = 'block';
    document.getElementById('recipe-popover').style.display = 'block';
}

function closePopover() {
    document.getElementById('popover-overlay').style.display = 'none';
    document.getElementById('recipe-popover').style.display = 'none';
}

// --- Recipe Detail Page Logic ---

function loadSingleRecipe(id) {
    fetch('data.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "text/xml");
            const recipe = xml.querySelector(`recipe[id="${id}"]`);

            if (recipe) {
                document.getElementById('rec-name').textContent = recipe.querySelector('name').textContent;
                document.getElementById('rec-img').src = recipe.querySelector('image').textContent;
                
                // Ingredients
                const ingList = document.getElementById('rec-ingredients');
                const ingredients = recipe.getElementsByTagName('item');
                for(let item of ingredients) {
                    const li = document.createElement('li');
                    li.textContent = item.textContent;
                    ingList.appendChild(li);
                }

                // Steps
                const stepList = document.getElementById('rec-steps');
                const steps = recipe.getElementsByTagName('step');
                for(let step of steps) {
                    const li = document.createElement('li');
                    li.textContent = step.textContent;
                    stepList.appendChild(li);
                }
            }
        });
}