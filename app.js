// app.js — prompt library using localStorage with 5-star ratings
const STORAGE_KEY = "prompt_library_prompts";

function readPrompts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    console.error("Failed to parse prompts from localStorage", e);
    return [];
  }
}

function writePrompts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to write prompts to localStorage", e);
  }
}

function createPreview(text, maxWords = 15) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "...";
}

// Render all prompts
function renderPrompts() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  const prompts = readPrompts();

  if (prompts.length === 0) {
    container.innerHTML =
      '<div class="card"><div class="title">No prompts saved</div><div class="preview">Use the form to add a prompt — it will be stored locally in your browser.</div></div>';
    return;
  }

  prompts.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("data-id", p.id);

    const titleEl = document.createElement("div");
    titleEl.className = "title";
    titleEl.textContent = p.title || "Untitled";

    const previewEl = document.createElement("div");
    previewEl.className = "preview";
    previewEl.textContent = createPreview(p.content, 18);

    // rating container (render stars)
    const ratingContainer = document.createElement("div");
    ratingContainer.className = "rating";
    renderStarControl(ratingContainer, p.id, p.rating || 0);

    const meta = document.createElement("div");
    meta.className = "meta";

    const idSpan = document.createElement("div");
    idSpan.style.fontSize = "0.78rem";
    idSpan.style.color = "var(--muted)";
    idSpan.textContent = new Date(p.id).toLocaleString();

    const actions = document.createElement("div");
    actions.className = "actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-id", p.id);
    deleteBtn.addEventListener("click", onDeletePrompt);

    actions.appendChild(deleteBtn);
    meta.appendChild(idSpan);
    meta.appendChild(actions);

    card.appendChild(titleEl);
    card.appendChild(previewEl);
    card.appendChild(ratingContainer);
    card.appendChild(meta);

    container.appendChild(card);
  });
}

// Set rating for a prompt and persist
function setPromptRating(promptId, rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  const prompts = readPrompts();
  const idx = prompts.findIndex((p) => String(p.id) === String(promptId));
  if (idx === -1) return;
  prompts[idx].rating = r;
  writePrompts(prompts);

  // update the single card if present
  const card = document.querySelector(`.card[data-id="${promptId}"]`);
  if (card) {
    const ratingContainer = card.querySelector(".rating");
    if (ratingContainer) renderStarControl(ratingContainer, promptId, r);
  } else {
    renderPrompts();
  }
}

// render accessible star control into a container
function renderStarControl(container, promptId, currentRating) {
  container.innerHTML = "";
  const starGroup = document.createElement("div");
  starGroup.className = "star-group";
  starGroup.setAttribute("role", "radiogroup");
  starGroup.setAttribute("aria-label", "Rate prompt (1 to 5 stars)");

  for (let i = 1; i <= 5; i++) {
    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.className = "star-btn";
    starButton.dataset.value = i;
    starButton.setAttribute("role", "radio");
    starButton.setAttribute("aria-checked", (i === currentRating).toString());
    starButton.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
    starButton.innerHTML = i <= currentRating ? "★" : "☆";

    if (i <= currentRating) starButton.classList.add("filled");

    // mouse interaction
    starButton.addEventListener("click", () => setPromptRating(promptId, i));

    // keyboard interactions
    starButton.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        setPromptRating(promptId, i);
      } else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") {
        ev.preventDefault();
        const prev = Math.max(1, i - 1);
        starGroup.querySelector(`button[data-value="${prev}"]`)?.focus();
      } else if (ev.key === "ArrowRight" || ev.key === "ArrowUp") {
        ev.preventDefault();
        const next = Math.min(5, i + 1);
        starGroup.querySelector(`button[data-value="${next}"]`)?.focus();
      } else if (/^[1-5]$/.test(ev.key)) {
        ev.preventDefault();
        setPromptRating(promptId, Number(ev.key));
      }
    });

    // hover preview
    starButton.addEventListener("mouseover", () =>
      highlightStars(starGroup, i)
    );
    starGroup.addEventListener("mouseleave", () =>
      highlightStars(starGroup, currentRating || 0)
    );

    starGroup.appendChild(starButton);
  }

  container.appendChild(starGroup);
}

function highlightStars(group, upTo) {
  Array.from(group.querySelectorAll("button")).forEach((b) => {
    const v = Number(b.dataset.value);
    b.innerHTML = v <= upTo ? "★" : "☆";
    if (v <= upTo) b.classList.add("filled");
    else b.classList.remove("filled");
  });
}

function onDeletePrompt(e) {
  const id = e.currentTarget.getAttribute("data-id");
  if (!id) return;
  let prompts = readPrompts();
  prompts = prompts.filter((p) => String(p.id) !== String(id));
  writePrompts(prompts);
  renderPrompts();
}

function onSavePrompt(e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  // minimal validation: require content
  if (!content) {
    // simple UI feedback: focus content
    document.getElementById("content").focus();
    return;
  }

  const prompts = readPrompts();
  const newPrompt = {
    id: Date.now(),
    title: title || "Untitled",
    content,
    rating: 0,
  };
  prompts.unshift(newPrompt); // newest first
  writePrompts(prompts);

  // reset form
  document.getElementById("prompt-form").reset();
  renderPrompts();
}

// wire up
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("prompt-form")
    .addEventListener("submit", onSavePrompt);
  renderPrompts();
});
