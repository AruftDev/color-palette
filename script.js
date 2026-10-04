const paletteContainer = document.getElementById("palette-container");
const genrateBtn = document.getElementById("generate-btn");
const hamburgerMenu = document.getElementById("hamburger-menu");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const sidebarContent = document.getElementById("sidebar-content");
const toast = document.getElementById("toast");

const NUM_COLORS = 5;
let currentPalette = []; // aqui se guardaran los colores

let favoriteColors = JSON.parse(localStorage.getItem("myFavoriteColors")) || [];

function generateRandomHex() {
  const chars = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * 16)];
  }

  return color;
}

function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace("#", "");

  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 2), 16);
  const b = parseInt(hexcolor.substring(4, 2), 16);
  const yiq = r * 299 + g * 587 + (b * 114) / 1000;

  return yiq >= 128 ? "#1e293b" : "#ffffff";
}

function initPalette() {
  paletteContainer.innerHTML = "";
  currentPalette = [];
  for (let i = 0; i < NUM_COLORS; i++) {
    const hex = generateRandomHex();
    currentPalette.push({ hex: hex, locked: false });
    const col = document.createElement("div");
    col.className = "color-column";
    col.style.background = hex;

    const textColor = getContrastYIQ(hex);
    const isFav = favoriteColors.includes(hex) ? "fav-active" : "";
    const favIcon = favoriteColors.includes(hex) ? "ti-heart" : "ti-heart-plus";

    col.innerHTML = `
      <div class="color-controls">
        <button class="control-btn lock-btn" title="Bloquear color">
          <i class="ti ti-lock-open-2"></i>
        </button>
        <button class="control-btn copy-btn" title ="Copiar hex">
          <i class="ti ti-copy"></i>
        </button>
        <button class="control-btn fav-btn ${isFav}" title="Guardar en favoritos">
          <i class="ti ti-heart"></i>
        </button>
      </div>
      <div class="color-hex" style="color: ${textColor};">${hex}</div>
    `;

    col
      .querySelector(".lock-btn")
      .addEventListener("click", (e) => toggleLock(i, e.currentTarget));
    col
      .querySelector(".copy-btn")
      .addEventListener("click", (e) =>
        copyToClipboard(currentPalette[i].hex, e.currentTarget),
      );
    col
      .querySelector(".fav-btn")
      .addEventListener("click", (e) =>
        toggleFavorite(currentPalette[i].hex, e.currentTarget),
      );

    paletteContainer.appendChild(col);
  }
}

function updatePalette() {
  const columns = document.querySelectorAll(".color-column");
  columns.forEach((col, i) => {
    if (!currentPalette[i].locked) {
      const newHex = generateRandomHex();
      currentPalette[i].hex = newHex;
      col.style.backgroundColor = newHex;

      const hexDisplay = col.querySelector(".color-hex");
      hexDisplay.innerText = newHex;
      hexDisplay.style.color = getContrastYIQ(newHex);

      const favBtn = col.querySelector(".fav-btn");
      const favIcon = favBtn.querySelector("i");
      if (favoriteColors.includes(newHex)) {
        favBtn.classList.add("fav-active");
        favIcon.className = "ti ti-heart";
      } else {
        favBtn.classList.remove("fav-active");
        favIcon.className = "ti ti-heart-plus";
      }
    }
  });
}

function toggleLock(index, button) {
  currentPalette[index].locked = !currentPalette[index].locked;
  const icon = button.querySelector("i");
  if (currentPalette[index].locked) {
    button.classList.add("lock-active");
    icon.className = "ti ti-lock";
  } else {
    button.classList.remove("lock-active");
    icon.className = "ti ti-lock-open-2";
  }
}

function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const icon = button.querySelector("i");
    const originalClass = icon.className;

    button.classList.add("copied-active");
    icon.className = "ti ti-copy-check";

    toast.classList.add("show");

    setTimeout(() => {
      button.classList.remove("copied-active");
      icon.className = originalClass;
    }, 2000);

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  });
}

function toggleFavorite(hex, button) {
  const icon = button.querySelector("i");

  if (favoriteColors.includes(hex)) {
    favoriteColors = favoriteColors.filter((color) => color !== hex);
    button.classList.remove("fav-active");
    icon.className = "ti ti-heart";
  } else {
    favoriteColors.push(hex);
    button.classList.add("fav-active");
    icon.className = "ti ti-heart-plus";
  }

  localStorage.setItem("myFavoriteColors", JSON.stringify(favoriteColors));
  renderSidebar();
}

window.deleteFavoriteFromSidebar = function (hex) {
  favoriteColors = favoriteColors.filter((color) => color !== hex);
  localStorage.setItem("myFavoriteColors", JSON.stringify(favoriteColors));
  renderSidebar();

  const columns = document.querySelectorAll(".color-column");
  columns.forEach((col, i) => {
    if (currentPalette[i].hex === hex) {
      const favBtn = col.querySelector(".fav-btn");
      if (favBtn) {
        favBtn.classList.remove("fav-active");
        favBtn.querySelector("i").className = "ti ti-heart-plus";
      }
    }
  });
};

function renderSidebar() {
  sidebarContent.innerHTML = "";

  if (favoriteColors.length === 0) {
    sidebarContent.innerHTML =
      '<p style="text-align:center; color:#64748b; font-size:0.95rem; margin-top:20px;">No tienes colores guardados.</p>';
    return;
  }

  favoriteColors.forEach((hex) => {
    const card = document.createElement("div");
    card.className = "saved-color-card";

    card.innerHTML = `
            <div class="card-info" title="Copiar código">
                <div class="color-preview-circle" style="background-color: ${hex}"></div>
                <span>${hex}</span>
            </div>
            <i class="ti ti-trash delete-btn" title="Eliminar favorito"></i>
        `;

    card.querySelector(".card-info").addEventListener("click", (e) => {
      copyToClipboard(hex, card.querySelector(".color-preview-circle"));
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteFavoriteFromSidebar(hex);
    });

    sidebarContent.appendChild(card);
  });
}

genrateBtn.addEventListener("click", updatePalette);

document.body.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    updatePalette();
  }
});

hamburgerMenu.addEventListener("click", () => sidebar.classList.add("open"));
closeSidebar.addEventListener("click", () => sidebar.classList.remove("open"));

initPalette();
renderSidebar();
