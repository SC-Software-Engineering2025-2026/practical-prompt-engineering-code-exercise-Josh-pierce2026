// app.js — prompt library using localStorage
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function createPreview(text, maxWords = 15) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "...";
}

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

    const titleEl = document.createElement("div");
    titleEl.className = "title";
    titleEl.textContent = p.title || "Untitled";

    const previewEl = document.createElement("div");
    previewEl.className = "preview";
    previewEl.textContent = createPreview(p.content, 18);

    // full content element (hidden by default, shown when expanded)
    const fullEl = document.createElement("div");
    fullEl.className = "full-content";
    fullEl.textContent = p.content;

    const meta = document.createElement("div");
    meta.className = "meta";

    const idSpan = document.createElement("div");
    idSpan.style.fontSize = "0.78rem";
    idSpan.style.color = "var(--muted)";
    idSpan.textContent = new Date(p.id).toLocaleString();

    const actions = document.createElement("div");
    actions.className = "actions";
    // expand/collapse button
    const expandBtn = document.createElement("button");
    expandBtn.className = "btn primary";
    expandBtn.textContent = "Expand";
    expandBtn.setAttribute("aria-expanded", "false");
    expandBtn.addEventListener("click", () => {
      const expanded = card.classList.toggle("expanded");
      expandBtn.textContent = expanded ? "Collapse" : "Expand";
      expandBtn.setAttribute("aria-expanded", String(expanded));
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-id", p.id);
    deleteBtn.addEventListener("click", onDeletePrompt);

    actions.appendChild(expandBtn);
    actions.appendChild(deleteBtn);
    meta.appendChild(idSpan);
    meta.appendChild(actions);

    card.appendChild(titleEl);
    card.appendChild(previewEl);
    card.appendChild(fullEl);
    card.appendChild(meta);

    container.appendChild(card);
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
