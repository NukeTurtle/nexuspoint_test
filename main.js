import { MAIN_URL } from './config.js';

const isApple = /iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);
const isMobile = isApple || isAndroid;
const isTablet = (isAndroid && window.innerWidth >= 768 && window.innerWidth <= 1024) || (isApple && window.innerWidth >= 768 && window.innerWidth <= 1024);
const isDesktop = /Windows/i.test(navigator.userAgent);

const type = "vehicles";
let currentPage = 1;

const advert_classification = "all";

const nav = document.getElementById("navigation");
const filter_options = document.getElementById("filter_options");
const results = document.getElementById("results");
const cardsDiv = document.getElementById("cards");

nav.innerHTML = `
    <div class="filter selected" data-type="All">All</div>
    <div class="filter" data-type="Used">Used</div>
    <div class="filter" data-type="New">New</div>
    <div class="filter" data-type="Offers">Offers</div>
`;

filter_options.innerHTML = `
    <option value="" selected disabled>Filter by</option>
    <option value="price-asc">Cheapes first</option>
    <option value="price-desc">Most expensive first</option>
    <option value="favoured-first">Favoured first</option>
`;

let meta = {};
let vehiclesToDisplay = [];
let currentFilter = "All";
let currentOrder = null;

function renderCards(param = currentFilter, order = currentOrder) {
    if (param !== currentFilter || order !== currentOrder) {
        currentPage = 1;
    }

    currentFilter = param;
    currentOrder = order;
    cardsDiv.innerHTML = "";
    let vehicles = [...vehiclesToDisplay];

    if (param !== "All") {
        vehicles = vehicles.filter(vehicle => vehicle.advert_classification === param);
    }

    if (order) {
        switch (order) {
            case 'price-desc':
                vehicles.sort((a, b) => b.price - a.price);
                break;

            case 'price-asc':
                vehicles.sort((a, b) => a.price - b.price);
                break;

            case 'favoured-first': {
                if (currentPage === 1) {
                    const starredIds = JSON.parse(localStorage.getItem('starred_items')) || [];
                    vehicles.sort((a, b) => {
                        const aFav = starredIds.includes(String(a.stock_id));
                        const bFav = starredIds.includes(String(b.stock_id));
                        if (aFav === bFav) return 0;
                        return aFav ? -1 : 1;
                    });
                    break;
                }
            }
            default:
                break;
        }
    }

    const totalFiltered = meta.total || vehicles.length;
    const perPage = meta.per_page || 11;
    const lastPage = meta.last_page || 1;

    console.log('[renderCards] totalFiltered:', totalFiltered, 'perPage:', perPage, 'lastPage:', lastPage);


    const visibleVehicles = vehicles;
    
    if (visibleVehicles.length === 0) {
        cardsDiv.innerHTML = `
            <div class="no-results">
                No results found
            </div>
        `;
        results.innerHTML = `
            Showing 0 of 0 cars
        `;
        return;
    }

    visibleVehicles.forEach(vehicle => {
        const cardDiv = document.createElement("div");
        const slider_container = document.createElement("div");
        const image_slider = document.createElement("div");
        const card_body = document.createElement("div");

        cardDiv.className = "card";
        cardDiv.setAttribute("data-vehicle-id", vehicle.stock_id);
        slider_container.className = "slider_container";
        image_slider.className = "image_slider";
        card_body.className = "card_body";

        if (isMobile) {
            vehicle.media_urls.forEach(image => {
                const vehicleImg = document.createElement("img");
                if (checkWord(image.thumb) === "thumb") {
                    vehicleImg.src = image.thumb
                    image_slider.appendChild(vehicleImg)
                }
            })

        } else if (isTablet) {
            vehicle.media_urls.forEach(image => {
                const vehicleImg = document.createElement("img");
                if (checkWord(image.medium) === "medium") {
                    vehicleImg.src = image.medium
                    image_slider.appendChild(vehicleImg)
                }
            })

        } else if (isDesktop) {
            vehicle.media_urls.forEach(image => {
                const vehicleImg = document.createElement("img");
                if (checkWord(image.large) === "large") {
                    vehicleImg.src = image.large
                    image_slider.appendChild(vehicleImg)
                }
            })

        } else {
            vehicle.media_urls.forEach(image => {
                const vehicleImg = document.createElement("img");
                if (checkWord(image.thumb) === "thumb") {
                    vehicleImg.src = image.medium
                    image_slider.appendChild(vehicleImg)
                }
            })
        }

        let images = [];

        images.forEach(src => {
            const vehicleImg = document.createElement("img");
            vehicleImg.src = src;
            image_slider.appendChild(vehicleImg);
        });

        function convertedMiles() {
            if (!vehicle.odometer_value) return "N/A";
            const miles = vehicle.odometer_value > 999
                ? (vehicle.odometer_value - (vehicle.odometer_value % 1000)) / 1000 + "k"
                : vehicle.odometer_value;
            return miles;
        }

        function capitalize(str) {
            if (!str) return "N/A";
            return str.toLowerCase().charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }

        card_body.innerHTML = `
            <div class="listing_heading">
                <div class="heading_left">
                    <h3>${vehicle.plate || "N/A"} ${vehicle.make || "N/A"} ${vehicle.model || "N/A"}</h3>
                    <div>${vehicle.derivative || "N/A"}</div>
                </div>
                <div class="heading_right">
                    <div class="top_specs">
                        <div class="card_badge">${vehicle.advert_classification || "N/A"}</div>
                    </div>
                    <div class="star"></div>
                </div>
            </div>
            <div class="specs-grid">
                <div class="bottom_specs">
                    <div class="spec-pair">
                        <div class="spec_item miles">${convertedMiles()} miles</div>
                        <span class="separator" aria-hidden="true">|</span>
                        <div class="spec_item fuel">${vehicle.fuel_type || "N/A"}</div>
                    </div>
                    <div class="spec_item payment bold">
                        £${vehicle.monthly_payment || "N/A"} /mo (${vehicle.monthly_finance_type || "Check with dealer"})
                    </div>
                    <div class="spec-pair">
                        <span class="spec_item transmission">${capitalize(vehicle.transmission || "N/A")}</span>
                        <span class="separator" aria-hidden="true">|</span>
                        <span class="spec_item body">${vehicle.body_type || "N/A"}</span>
                    </div>
                    <div class="spec_item price bold">£${vehicle.price || "N/A"}</div>
                </div> 
            </div>  
        `;

        slider_container.append(image_slider);
        cardDiv.append(slider_container, card_body);
        cardsDiv.appendChild(cardDiv);
    });

    results.innerHTML = `
        Showing ${visibleVehicles.length} of ${totalFiltered} cars
    `;

    applyStarState();
    renderPaginator(lastPage);
}

// -------------------- STARS --------------------

function getStarredIds() {
    return JSON.parse(localStorage.getItem('starred_items')) || [];
}

function setStarredIds(ids) {
    localStorage.setItem('starred_items', JSON.stringify(ids));
}

function applyStarState() {
    const starredIds = getStarredIds();

    document.querySelectorAll('.card').forEach(card => {
        const star = card.querySelector('.star');
        if (!star) return;

        if (starredIds.includes(card.dataset.vehicleId)) {
            star.classList.add('full');
        } else {
            star.classList.remove('full');
        }
    });
}

// -------------------- INIT --------------------

function checkWord(filename) {
    const match = filename.match(/([a-z0-9]+)(?=\.(jpg|png|gif)$)/i);
    return match ? match[1] : null;
}

document.getElementById('cards').addEventListener('click', (e) => {
    const body = e.target.closest('.heading_left');
    if (!body) return;
    const card = body.closest('.card');
    if (!card) return;
    openVehicleModal(card);
});

document.addEventListener('DOMContentLoaded', () => {
    fetchVehicles();

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter');
        if (!btn) return;
    
        nav.querySelectorAll('.filter').forEach(el => el.classList.remove('selected'));
        btn.classList.add("selected");
    
        currentFilter = btn.dataset.type;
        currentPage = 1;
    
        fetchVehicles(currentFilter, currentPage);
    });
    

    filter_options.addEventListener("change", (e) => {
        currentPage = 1;
        renderCards(currentFilter, e.target.value);
    });

    const cards = document.getElementById('cards');

    cards.addEventListener('click', (e) => {
        const star = e.target.closest('.star');
        if (!star) return;

        const card = star.closest('.card');
        const id = card.dataset.vehicleId;

        let stored = getStarredIds();
        if (stored.includes(id)) stored = stored.filter(x => x !== id);
        else stored.push(id);

        setStarredIds(stored);
        applyStarState();
    });
});

function fetchVehicles(filter = currentFilter, page = currentPage) {
    const perPage = meta.per_page || 11;

    fetch(`${MAIN_URL}/vehicles?page=${page}&results_per_page=${perPage}&advert_classification=${filter}`)
        .then(res => res.json())
        .then(data => {
            meta = data.meta;
            vehiclesToDisplay = data.data;
            currentFilter = filter;
            currentPage = page;

            console.log('[fetchVehicles] URL:', `${MAIN_URL}/vehicles?page=${page}&results_per_page=${perPage}&advert_classification=${filter}`);
            console.log('[fetchVehicles] meta:', meta);

            renderCards(currentFilter, currentOrder);
        });
}

function renderPaginatorFor(hostId, leftId, rightId, lastPage) {
    const pagesHost = document.getElementById(hostId);
    pagesHost.innerHTML = '';

    if (!lastPage) return;

    const windowSize = 5;
    const half = Math.floor(windowSize / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(lastPage, start + windowSize - 1);

    if (end - start < windowSize - 1) {
        start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('div');
        btn.className = 'paginator';
        btn.textContent = i;

        if (i === currentPage) btn.classList.add('selected');

        btn.addEventListener('click', () => {
            currentPage = i;
            fetchVehicles(currentFilter, currentPage);
        });

        pagesHost.appendChild(btn);
    }

    const btnLeft = document.getElementById(leftId);
    const btnRight = document.getElementById(rightId);

    if (currentPage <= 1) btnLeft.classList.add('disabled');
    else btnLeft.classList.remove('disabled');

    if (currentPage >= lastPage) btnRight.classList.add('disabled');
    else btnRight.classList.remove('disabled');
}

function renderPaginator(filteredLastPage) {
    const lastPage = filteredLastPage || meta.last_page;

    renderPaginatorFor('pages', 'left', 'right', lastPage);
    renderPaginatorFor('pages-top', 'left-top', 'right-top', lastPage);
}

document.getElementById('left').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchVehicles(currentFilter, currentPage);
    }
});

document.getElementById('right').addEventListener('click', () => {
    if (currentPage < meta.last_page) {
        currentPage++;
        fetchVehicles(currentFilter, currentPage);
    }
});

document.getElementById('end').addEventListener('click', () => {
    currentPage = meta.last_page;
    fetchVehicles(currentFilter, currentPage);
});

document.getElementById('left-top')?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchVehicles(currentFilter, currentPage);
    }
});

document.getElementById('right-top')?.addEventListener('click', () => {
    if (currentPage < meta.last_page) {
        currentPage++;
        fetchVehicles(currentFilter, currentPage);
    }
});

document.getElementById('end-top')?.addEventListener('click', () => {
    currentPage = meta.last_page;
    fetchVehicles(currentFilter, currentPage);
});

function openVehicleModal(card) {
    const modal = document.getElementById('vehicleModal');
    const sliderHost = modal.querySelector('.modal_slider');
    const details = modal.querySelector('.modal_details');
    const h3 = card.querySelector('.heading_left h3');

    sliderHost.innerHTML = '';

    const originalSlider = card.querySelector('.image_slider');
    if (originalSlider) {
        const clonedSlider = originalSlider.cloneNode(true);
        clonedSlider.style.transform = 'translateX(0)';
        sliderHost.append(clonedSlider);
    }

    details.innerHTML = `
        ${card.querySelector('.specs-grid')?.outerHTML || ''}
    `;

    const bottomSpecs = details.querySelector('.bottom_specs');
    if (h3 && bottomSpecs) bottomSpecs.prepend(h3.cloneNode(true));

    modal.classList.remove('hidden');
}

const modal = document.getElementById('vehicleModal');

modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal_overlay') || e.target.classList.contains('modal_close')) {
        modal.classList.add('hidden');
    }
});
