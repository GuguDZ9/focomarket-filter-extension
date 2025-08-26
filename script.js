(function () {
    let selectedCategories = new Set(JSON.parse(sessionStorage.getItem("selectedCategories")) || []);
    let categoriesCount = {};
    let hasOfficial = false;

    function createCategoryFilters() {
        const container = document.querySelector(".filter-events");
        if (!container) return;

        categoriesCount = {};
        hasOfficial = false;

        document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget").forEach(card => {
            // Detecta badge oficial
            const badge = card.querySelector(".event-card-fc .event-badge-fc");
            if (badge && badge.textContent.trim().toLowerCase().includes("oficial")) {
                hasOfficial = true;
                categoriesCount["Oficial"] = (categoriesCount["Oficial"] || 0) + 1;
            }

            // Detecta categoria do card (primeiro item da coluna esquerda)
            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            if (categorySpan) {
                const categoryText = categorySpan.textContent.trim();
                categoriesCount[categoryText] = (categoriesCount[categoryText] || 0) + 1;
            }
        });

        container.innerHTML = "";
        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-tags d-flex flex-wrap mb-3";

        // Cria a tag Oficial primeiro
        if (hasOfficial) {
            const tagButton = document.createElement("button");
            tagButton.type = 'button';
            tagButton.className = "category-tag official-tag btn rounded-pill mx-1 my-1";
            tagButton.innerText = `Oficial (${categoriesCount["Oficial"]})`;

            if (selectedCategories.has("Oficial")) {
                tagButton.classList.add("selected");
            }

            tagButton.onclick = () => toggleCategoryFilter("Oficial", tagButton);
            filterContainer.appendChild(tagButton);
        }

        // Depois cria as demais tags de categoria
        Object.entries(categoriesCount).forEach(([category, count]) => {
            if (category === "Oficial") return; // já adicionada

            const tagButton = document.createElement("button");
            tagButton.type = 'button';
            tagButton.className = "category-tag btn btn-outline-primary rounded-pill mx-1 my-1";
            tagButton.innerText = `${category} (${count})`;

            if (selectedCategories.has(category)) {
                tagButton.classList.add("selected");
            }

            tagButton.onclick = () => toggleCategoryFilter(category, tagButton);
            filterContainer.appendChild(tagButton);
        });

        container.appendChild(filterContainer);
    }

    function toggleCategoryFilter(category, button) {
        if (selectedCategories.has(category)) {
            selectedCategories.delete(category);
            button.classList.remove("selected");
        } else {
            selectedCategories.add(category);
            button.classList.add("selected");
        }
        sessionStorage.setItem("selectedCategories", JSON.stringify([...selectedCategories]));
        filterCards();
    }

    function filterCards() {
        const cards = document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget");
        let updatedCount = {};
        let availableCategories = new Set();

        const wantsOfficial = selectedCategories.has("Oficial");
        const selectedCats = [...selectedCategories].filter(c => c !== "Oficial");

        cards.forEach(card => {
            let categoryText = null;
            let isOfficial = false;

            // Verifica badge Oficial
            const badge = card.querySelector(".event-card-fc .event-badge-fc");
            if (badge && badge.textContent.trim().toLowerCase().includes("oficial")) {
                isOfficial = true;
                availableCategories.add("Oficial");
            }

            // Verifica categoria principal
            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            if (categorySpan) {
                categoryText = categorySpan.textContent.trim();
                availableCategories.add(categoryText);
            }

            // Lógica AND/OR correta
            let isVisible = false;
            if (selectedCategories.size === 0) {
                isVisible = true; // sem filtros => tudo
            } else if (wantsOfficial && selectedCats.length === 0) {
                // Apenas "Oficial"
                isVisible = isOfficial;
            } else if (!wantsOfficial && selectedCats.length > 0) {
                // Apenas categorias (qualquer uma)
                isVisible = categoryText ? selectedCats.includes(categoryText) : false;
            } else if (wantsOfficial && selectedCats.length > 0) {
                // Oficial + categorias => AND entre dimensões
                isVisible = isOfficial && categoryText ? selectedCats.includes(categoryText) : false;
            }

            card.style.display = isVisible ? "block" : "none";

            if (isVisible) {
                if (isOfficial) {
                    updatedCount["Oficial"] = (updatedCount["Oficial"] || 0) + 1;
                }
                if (categoryText) {
                    updatedCount[categoryText] = (updatedCount[categoryText] || 0) + 1;
                }
            }
        });

        // Remove seleções inexistentes na página atual
        let hasValidSelection = false;
        selectedCategories.forEach(category => {
            if (category === "Oficial") {
                if (availableCategories.has("Oficial")) hasValidSelection = true; else selectedCategories.delete("Oficial");
            } else {
                if (availableCategories.has(category)) hasValidSelection = true; else selectedCategories.delete(category);
            }
        });

        if (!hasValidSelection) {
            selectedCategories.clear();
        }
        sessionStorage.setItem("selectedCategories", JSON.stringify([...selectedCategories]));
        createCategoryFilters();
        updateCategoryCounts(updatedCount);

        if (selectedCategories.size === 0) {
            document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget").forEach(card => card.style.display = "block");
        }
    }

    function updateCategoryCounts(updatedCount) {
        document.querySelectorAll(".category-tag").forEach(button => {
            const category = button.innerText.split(" (")[0];
            const count = updatedCount[category] || categoriesCount[category] || 0;
            button.innerHTML = selectedCategories.has(category)
                ? `${category} (${count}) <span class='remove-tag'>×</span>`
                : `${category} (${count})`;
        });
    }

    function applyStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
            .filter-tags { display: flex; flex-wrap: wrap; gap: 10px; }
            .category-tag { border: 2px solid #007bff; background: #fff; color: #007bff; padding: 5px 10px; cursor: pointer; transition: all 0.2s; }
            .category-tag:hover { background: #007bff; color: #fff; }
            .category-tag.selected { background: #007bff; color: #fff; }
            /* Oficial (verde rgb(8, 141, 78)) */
            .official-tag { border: 2px solid rgb(8, 141, 78); background: #fff; color: rgb(8, 141, 78); transition: all 0.2s; }
            .official-tag:hover { background: rgb(8, 141, 78); color: #fff; }
            .official-tag.selected { background: rgb(8, 141, 78); color: #fff; }
            .remove-tag { margin-left: 5px; cursor: pointer; }
        `;
        document.head.appendChild(style);
    }

    function preserveFiltersOnPagination() {
        document.addEventListener("click", (event) => {
            const target = event.target.closest(".pagination a");
            if (target) {
                sessionStorage.setItem("selectedCategories", JSON.stringify([...selectedCategories]));
                setTimeout(() => {
                    createCategoryFilters();
                    filterCards();
                }, 300);
            }
        });
    }

    function init() {
        createCategoryFilters();
        applyStyles();
        preserveFiltersOnPagination();
        filterCards();
    }

    window.addEventListener("load", init);
})();
