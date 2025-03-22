// Tab functionality
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName + '-content').style.display = 'block';
    
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
            tab.classList.add('active');
        }
    });
    
    if (tabName === 'tracker' || tabName === 'eco-guide') {
        document.getElementById(tabName).scrollIntoView({ behavior: 'smooth' });
    }
}

// Spoonacular API key
const apiKey = "6e9067d9242749f6b6b8e1fafc3b26b4";

// Grocery tracker functionality
function addItem() {
    const name = document.getElementById("itemName").value.trim();
    const qty = document.getElementById("itemQty").value.trim();
    const days = parseInt(document.getElementById("daysUntilExpiry").value.trim());

    if (!name || !qty || isNaN(days)) {
        alert("Please fill in all fields.");
        return;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    const expDateStr = expirationDate.toISOString().split("T")[0];

    const items = JSON.parse(localStorage.getItem("groceries") || "[]");
    items.push({ name, qty, expirationDate: expDateStr });
    localStorage.setItem("groceries", JSON.stringify(items));

    document.getElementById("itemName").value = "";
    document.getElementById("itemQty").value = "";
    document.getElementById("daysUntilExpiry").value = "";

    loadItems();
}

function loadItems() {
    const list = document.getElementById("groceryList");
    list.innerHTML = "";
    const items = JSON.parse(localStorage.getItem("groceries") || "[]");

    const today = new Date();

    if (items.length === 0) {
        list.innerHTML = "<p>No items added yet. Start tracking your groceries to reduce food waste!</p>";
        return;
    }

    items.forEach((item, index) => {
        const itemDate = new Date(item.expirationDate);
        const diffDays = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24));
        
        let warningText = "";
        if (diffDays <= 0) {
            warningText = `<span class="warning">⚠️ Expired!</span>`;
        } else if (diffDays <= 3) {
            warningText = `<span class="warning">⚠️ Expires in ${diffDays} day(s)!</span>`;
        }

        list.innerHTML += `
            <div class="item">
                <strong>${item.name}</strong> (${item.qty})<br>
                Expiration: ${item.expirationDate} ${warningText}<br>
                <button onclick="removeItem(${index})">Remove</button>
            </div>
        `;
    });
}

function removeItem(index) {
    const items = JSON.parse(localStorage.getItem("groceries") || "[]");
    items.splice(index, 1);
    localStorage.setItem("groceries", JSON.stringify(items));
    loadItems();
}

// Recipe functionality
function getRecipes() {
    const items = JSON.parse(localStorage.getItem("groceries") || "[]");
    const ingredients = items.map(item => item.name.toLowerCase());

    if (ingredients.length === 0) {
        alert("Add some groceries first to find matching recipes!");
        return;
    }

    const recipeList = document.getElementById("recipeList");
    recipeList.innerHTML = "<div class='loading'>🔄 Searching for recipes based on your ingredients...</div>";

    fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.join(',')}&number=6&apiKey=${apiKey}`)
        .then(res => res.json())
        .then(data => {
            recipeList.innerHTML = "";
            if (data.length === 0) {
                recipeList.innerHTML = "<p>No recipes found with your current ingredients. Try adding more items to your grocery list.</p>";
                return;
            }

            data.forEach(recipe => {
                recipeList.innerHTML += `
                    <div class="recipe">
                        <img src="${recipe.image}" alt="${recipe.title}" />
                        <div class="recipe-content">
                            <h4>${recipe.title}</h4>
                            <p>Uses ${recipe.usedIngredientCount} of your ingredients</p>
                            <a href="https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-')}-${recipe.id}" target="_blank">View Recipe</a>
                        </div>
                    </div>
                `;
            });
        })
        .catch(err => {
            console.error("Error fetching recipes:", err);
            recipeList.innerHTML = "<p>Something went wrong while fetching recipes. Please try again later.</p>";
        });
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            if (targetId) {
                if (targetId === 'tracker') {
                    showTab('tracker');
                } else if (targetId === 'eco-guide') {
                    showTab('eco-guide');
                } else if (targetId === 'home') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.about-section h3, .about-section p, .eco-tip, .eco-category, .recipe').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });
});