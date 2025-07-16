 (function () {
    let selectedCategories = new Set(JSON.parse(sessionStorage.getItem("selectedCategories")) || []);
    let categoriesCount = {};

    function createCategoryFilters() {
        const container = document.querySelector(".listing-evidence-list") || document.querySelector(".card-listing") || document.body;
        if (!container) return;

        categoriesCount = {};
        document.querySelectorAll(".col-md-4.col-sm-12.card-event-widget").forEach(card => {
            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            if (categorySpan) {
                const categoryText = categorySpan.textContent.trim();
                categoriesCount[categoryText] = (categoriesCount[categoryText] || 0) + 1;
            }
        });

        let filterContainer = document.querySelector(".filter-tags");
        if (!filterContainer) {
            filterContainer = document.createElement("div");
            filterContainer.className = "filter-tags d-flex flex-wrap mb-3";
            container.insertBefore(filterContainer, container.firstChild);
        } else {
            filterContainer.innerHTML = "";
        }

        Object.entries(categoriesCount).forEach(([category, count]) => {
            const tagButton = document.createElement("button");
            tagButton.className = "category-tag btn btn-outline-primary rounded-pill mx-1";
            tagButton.innerText = `${category} (${count})`;

            if (selectedCategories.has(category)) {
                tagButton.classList.add("selected");
            }

            tagButton.onclick = () => toggleCategoryFilter(category, tagButton);
            filterContainer.appendChild(tagButton);
        });
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

        cards.forEach(card => {
            const categorySpan = card.querySelector(".left-card-column .icon-text-card .event-text-fc.event-city-fc");
            if (!categorySpan) {
                card.style.display = selectedCategories.size === 0 ? "block" : "none";
                return;
            }

            const categoryText = categorySpan.textContent.trim();
            availableCategories.add(categoryText);
            const isVisible = selectedCategories.size === 0 || selectedCategories.has(categoryText);
            card.style.display = isVisible ? "block" : "none";

            if (isVisible) {
                updatedCount[categoryText] = (updatedCount[categoryText] || 0) + 1;
            }
        });

        let hasValidSelection = false;
        selectedCategories.forEach(category => {
            if (!availableCategories.has(category)) {
                selectedCategories.delete(category);
            } else {
                hasValidSelection = true;
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
            .filter-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            .category-tag {
                border: 2px solid #007bff;
                background: white;
                color: #007bff;
                padding: 5px 10px;
                cursor: pointer;
            }
            .category-tag.selected {
                background: #007bff;
                color: white;
            }
            .remove-tag {
                margin-left: 5px;
                cursor: pointer;
            }
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
