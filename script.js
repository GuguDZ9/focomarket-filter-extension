(function () {
    let selectedCategories = new Set(JSON.parse(sessionStorage.getItem("selectedCategories")) || []);
    let categoriesCount = {};
    let officialTotal = 0;

    function createCategoryFilters() {
        const container = document.querySelector(".filter-events");
        if (!container) return;

        const wantsOfficial = selectedCategories.has("Oficial");
        categoriesCount = {};
        officialTotal = 0;

        // Reconta com base no contexto (se "Oficial" estiver selecionado, só conta categorias com badge oficial)
        document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget").forEach(card => {
            const isOfficial = !!card.querySelector(".event-card-fc .event-badge-fc");
            if (isOfficial) officialTotal += 1;

            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            if (!categorySpan) return;
            const categoryText = categorySpan.textContent.trim();

            if (wantsOfficial) {
                if (isOfficial) categoriesCount[categoryText] = (categoriesCount[categoryText] || 0) + 1;
            } else {
                categoriesCount[categoryText] = (categoriesCount[categoryText] || 0) + 1;
            }
        });

        // Reconstrói UI
        container.innerHTML = "";
        const filterContainer = document.createElement("div");
        filterContainer.className = "filter-tags d-flex flex-wrap mb-3";

        // Tag Oficial (sempre primeiro)
        if (officialTotal > 0) {
            const officialBtn = document.createElement("button");
            officialBtn.type = 'button';
            officialBtn.className = "category-tag official-tag btn rounded-pill mx-1 my-1";
            officialBtn.innerText = `Oficial (${officialTotal})`;
            if (selectedCategories.has("Oficial")) officialBtn.classList.add("selected");
            officialBtn.onclick = () => toggleCategoryFilter("Oficial", officialBtn);
            filterContainer.appendChild(officialBtn);
        }

        // Demais categorias — quando "Oficial" está selecionado, só aparecem categorias que têm oficial
        Object.entries(categoriesCount).forEach(([category, count]) => {
            const tagButton = document.createElement("button");
            tagButton.type = 'button';
            tagButton.className = "category-tag btn btn-outline-primary rounded-pill mx-1 my-1";
            tagButton.innerText = `${category} (${count})`;
            if (selectedCategories.has(category)) tagButton.classList.add("selected");
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
        let hasOfficialOnPage = false;

        const wantsOfficial = selectedCategories.has("Oficial");
        const selectedCats = [...selectedCategories].filter(c => c !== "Oficial");

        cards.forEach(card => {
            const isOfficial = !!card.querySelector(".event-card-fc .event-badge-fc");
            if (isOfficial) hasOfficialOnPage = true;

            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            const categoryText = categorySpan ? categorySpan.textContent.trim() : null;
            if (categoryText) availableCategories.add(categoryText);
            if (isOfficial) availableCategories.add("Oficial");

            let isVisible = false;
            if (selectedCategories.size === 0) {
                isVisible = true;
            } else if (wantsOfficial && selectedCats.length === 0) {
                isVisible = isOfficial;
            } else if (!wantsOfficial && selectedCats.length > 0) {
                isVisible = categoryText ? selectedCats.includes(categoryText) : false;
            } else if (wantsOfficial && selectedCats.length > 0) {
                isVisible = isOfficial && categoryText ? selectedCats.includes(categoryText) : false;
            }

            card.style.display = isVisible ? "block" : "none";

            if (isVisible) {
                if (isOfficial) updatedCount["Oficial"] = (updatedCount["Oficial"] || 0) + 1;
                if (categoryText) updatedCount[categoryText] = (updatedCount[categoryText] || 0) + 1;
            }
        });

        // Limpa seleções sem correspondência
        let hasValidSelection = false;
        selectedCategories.forEach(category => {
            if (category === "Oficial") {
                if (hasOfficialOnPage) hasValidSelection = true; else selectedCategories.delete("Oficial");
            } else {
                if (availableCategories.has(category)) hasValidSelection = true; else selectedCategories.delete(category);
            }
        });
        if (!hasValidSelection) selectedCategories.clear();
        sessionStorage.setItem("selectedCategories", JSON.stringify([...selectedCategories]));

        createCategoryFilters();
        updateCategoryCounts(updatedCount);

        if (selectedCategories.size === 0) {
            document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget").forEach(card => card.style.display = "block");
        }
    }

    function updateCategoryCounts(updatedCount) {
        document.querySelectorAll(".category-tag").forEach(button => {
            const label = button.innerText.split(" (")[0];
            const isOfficialBtn = button.classList.contains("official-tag");
            const baseCount = isOfficialBtn ? officialTotal : categoriesCount[label] || 0;
            const count = updatedCount[label] ?? baseCount;
            button.innerHTML = selectedCategories.has(label)
                ? `${label} (${count}) <span class='remove-tag'>×</span>`
                : `${label} (${count})`;
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
