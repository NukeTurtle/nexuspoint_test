const isApple = /iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);
const isMobile = isApple || isAndroid;
const isTablet = (isAndroid && window.innerWidth >= 768 && window.innerWidth <= 1024) || (isApple && window.innerWidth >= 768 && window.innerWidth <= 1024);
const isDesktop = /Windows/i.test(navigator.userAgent);

const type = "vehicles";
const page = 1;

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

let currentSrc = "";

function renderCards(param = currentFilter, order = currentOrder) {
    currentFilter = param;
    currentOrder = order;
    cardsDiv.innerHTML = "";
    let vehicles = [...vehiclesToDisplay];

    if (param !== "All") {
        vehicles = vehicles.filter(vehicle => vehicle.advert_classification === param);
    }

    switch (order) {
        case 'price-desc':
            vehicles.sort((a, b) => b.price - a.price);
            break;

        case 'price-asc':
            vehicles.sort((a, b) => a.price - b.price);
            break;

        case 'favoured-first': {
            const starredIds = JSON.parse(localStorage.getItem('starred_items')) || [];
            vehicles.sort((a, b) => {
                const aFav = starredIds.includes(String(a.stock_id));
                const bFav = starredIds.includes(String(b.stock_id));
                if (aFav === bFav) return 0;
                return aFav ? -1 : 1;
            });
            break;
        }

        default:
            break;
    }

    const visibleVehicles = vehicles.slice(page, page + meta.per_page);

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
        Showing ${visibleVehicles.length} of ${vehicles.length} cars
    `;

    applyStarState();
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
    const mainURL = "https://m6zhmj6dggvrmepfanilteq4q40rlalu.lambda-url.eu-west-1.on.aws";

    fetch(`${mainURL}/vehicles?page=${page}&results_per_page=8&advert_classification=${currentFilter}`)
        .then(res => res.json())
        .then(data => {
            meta = data.meta;
            vehiclesToDisplay = data.data.slice(0, meta.per_page);
            renderCards("All");
        });

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter');
        if (!btn) return;

        nav.querySelectorAll('.filter').forEach(el => el.classList.remove('selected'));
        btn.classList.add("selected");

        renderCards(btn.dataset.type);
    });

    filter_options.addEventListener("change", (e) => {
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