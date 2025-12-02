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
  let prompts = readPrompts();
  prompts = sortPrompts(prompts);

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

    // full content (hidden until expanded)
    const fullEl = document.createElement("div");
    fullEl.className = "full-content";
    fullEl.textContent = p.content;

    // rating container (render stars)
    const ratingContainer = document.createElement("div");
    ratingContainer.className = "rating";
    renderStarControl(ratingContainer, p.id, p.rating || 0);

    // notes container (render notes UI)
    const notesContainer = document.createElement("div");
    notesContainer.className = "notes-container";
    renderNotes(notesContainer, p);

    const meta = document.createElement("div");
    meta.className = "meta";

    const idSpan = document.createElement("div");
    idSpan.style.fontSize = "0.78rem";
    idSpan.style.color = "var(--muted)";
    idSpan.textContent = new Date(p.id).toLocaleString();

    const actions = document.createElement("div");
    actions.className = "actions";

    // expand/collapse button
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-btn";
    collapseBtn.type = "button";
    collapseBtn.textContent = "Expand";
    collapseBtn.addEventListener("click", () => {
      const isExpanded = card.classList.toggle("expanded");
      collapseBtn.textContent = isExpanded ? "Collapse" : "Expand";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-id", p.id);
    deleteBtn.addEventListener("click", onDeletePrompt);

    actions.appendChild(collapseBtn);
    actions.appendChild(deleteBtn);
    meta.appendChild(idSpan);
    meta.appendChild(actions);

    card.appendChild(titleEl);
    card.appendChild(previewEl);
    card.appendChild(fullEl);
    card.appendChild(notesContainer);
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

// --- Notes feature ---
function findPromptIndex(promptId) {
  const prompts = readPrompts();
  return prompts.findIndex((p) => String(p.id) === String(promptId));
}

function addNote(promptId, text) {
  const t = String(text || "").trim();
  if (!t) return null;
  const prompts = readPrompts();
  const idx = prompts.findIndex((p) => String(p.id) === String(promptId));
  if (idx === -1) return null;
  const note = {
    id: `note-${Date.now()}`,
    text: t,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (!Array.isArray(prompts[idx].notes)) prompts[idx].notes = [];
  prompts[idx].notes.unshift(note);
  try {
    writePrompts(prompts);
  } catch (e) {
    console.warn("Failed to save note", e);
  }
  // update UI for that card
  const card = document.querySelector(`.card[data-id="${promptId}"]`);
  if (card) {
    const nc = card.querySelector(".notes-container");
    if (nc) renderNotes(nc, prompts[idx]);
  }
  return note;
}

function editNote(promptId, noteId, newText) {
  const t = String(newText || "").trim();
  const prompts = readPrompts();
  const idx = prompts.findIndex((p) => String(p.id) === String(promptId));
  if (idx === -1) return false;
  const notes = prompts[idx].notes || [];
  const nidx = notes.findIndex((n) => String(n.id) === String(noteId));
  if (nidx === -1) return false;
  notes[nidx].text = t;
  notes[nidx].updatedAt = Date.now();
  prompts[idx].notes = notes;
  try {
    writePrompts(prompts);
  } catch (e) {
    console.warn("Failed to edit note", e);
  }
  const card = document.querySelector(`.card[data-id="${promptId}"]`);
  if (card) {
    const nc = card.querySelector(".notes-container");
    if (nc) renderNotes(nc, prompts[idx]);
  }
  return true;
}

function deleteNote(promptId, noteId) {
  if (!confirm("Delete this note?")) return false;
  const prompts = readPrompts();
  const idx = prompts.findIndex((p) => String(p.id) === String(promptId));
  if (idx === -1) return false;
  const notes = prompts[idx].notes || [];
  const nidx = notes.findIndex((n) => String(n.id) === String(noteId));
  if (nidx === -1) return false;
  notes.splice(nidx, 1);
  prompts[idx].notes = notes;
  try {
    writePrompts(prompts);
  } catch (e) {
    console.warn("Failed to delete note", e);
  }
  const card = document.querySelector(`.card[data-id="${promptId}"]`);
  if (card) {
    const nc = card.querySelector(".notes-container");
    if (nc) renderNotes(nc, prompts[idx]);
  }
  return true;
}

// render notes UI into provided container for given prompt object
function renderNotes(container, prompt) {
  container.innerHTML = "";
  container.dataset.promptId = prompt.id;

  const section = document.createElement("section");
  section.className = "notes";

  // add area
  const addWrap = document.createElement("div");
  addWrap.className = "notes-add";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "note-add-btn";
  addBtn.textContent = "Add note";
  addWrap.appendChild(addBtn);

  const editor = document.createElement("div");
  editor.className = "note-editor";
  editor.hidden = true;
  const ta = document.createElement("textarea");
  ta.className = "note-text";
  ta.setAttribute("aria-label", "Note text");
  ta.rows = 3;
  editor.appendChild(ta);
  const actions = document.createElement("div");
  actions.className = "note-editor-actions";
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "note-save-btn";
  saveBtn.textContent = "Save";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "note-cancel-btn";
  cancelBtn.textContent = "Cancel";
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  editor.appendChild(actions);
  addWrap.appendChild(editor);
  section.appendChild(addWrap);

  // notes list
  const list = document.createElement("ul");
  list.className = "notes-list";
  list.setAttribute("aria-live", "polite");
  const notes = Array.isArray(prompt.notes) ? prompt.notes : [];
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.className = "note-item";
    li.dataset.noteId = n.id;
    const text = document.createElement("div");
    text.className = "note-body";
    text.textContent = n.text;
    const meta = document.createElement("div");
    meta.className = "note-meta";
    const ts = document.createElement("div");
    ts.className = "note-ts";
    ts.textContent = new Date(n.updatedAt || n.createdAt).toLocaleString();
    const act = document.createElement("div");
    act.className = "note-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "note-edit";
    editBtn.setAttribute("aria-label", "Edit note");
    editBtn.textContent = "Edit";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "note-delete";
    delBtn.setAttribute("aria-label", "Delete note");
    delBtn.textContent = "Delete";
    act.appendChild(editBtn);
    act.appendChild(delBtn);
    meta.appendChild(ts);
    meta.appendChild(act);
    li.appendChild(text);
    li.appendChild(meta);
    list.appendChild(li);
  });
  section.appendChild(list);
  container.appendChild(section);

  // event delegation within notes container
  section.addEventListener("click", (e) => {
    const target = e.target;
    if (target.closest(".note-add-btn")) {
      editor.hidden = false;
      ta.focus();
      return;
    }
    if (target.closest(".note-cancel-btn")) {
      editor.hidden = true;
      ta.value = "";
      return;
    }
    if (target.closest(".note-save-btn")) {
      const val = ta.value.trim();
      if (!val) return;
      addNote(prompt.id, val);
      ta.value = "";
      editor.hidden = true;
      return;
    }

    const li = target.closest(".note-item");
    if (!li) return;
    const nid = li.dataset.noteId;
    if (target.closest(".note-delete")) {
      deleteNote(prompt.id, nid);
      return;
    }
    if (target.closest(".note-edit")) {
      // replace note content with inline editor
      const noteText = li.querySelector(".note-body").textContent;
      li.innerHTML = "";
      const editTa = document.createElement("textarea");
      editTa.className = "note-edit-text";
      editTa.rows = 3;
      editTa.value = noteText;
      const editActions = document.createElement("div");
      editActions.className = "note-edit-actions";
      const save = document.createElement("button");
      save.type = "button";
      save.className = "note-edit-save";
      save.textContent = "Save";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "note-edit-cancel";
      cancel.textContent = "Cancel";
      editActions.appendChild(save);
      editActions.appendChild(cancel);
      li.appendChild(editTa);
      li.appendChild(editActions);

      // wire edit actions
      save.addEventListener("click", () => {
        const newText = editTa.value.trim();
        if (!newText) return;
        editNote(prompt.id, nid, newText);
      });
      cancel.addEventListener("click", () => {
        renderNotes(container, prompt);
      });
    }
  });
}

// --- end notes feature ---

// Sorting helper
function sortPrompts(prompts) {
  const sel = document.getElementById("sort-select");
  const mode = sel ? sel.value : "newest";
  const copy = Array.from(prompts);
  if (mode === "newest") {
    return copy.sort((a, b) => Number(b.id) - Number(a.id));
  }
  if (mode === "oldest") {
    return copy.sort((a, b) => Number(a.id) - Number(b.id));
  }
  if (mode === "rating-desc") {
    return copy.sort(
      (a, b) =>
        Number(b.rating || 0) - Number(a.rating || 0) ||
        Number(b.id) - Number(a.id)
    );
  }
  if (mode === "rating-asc") {
    return copy.sort(
      (a, b) =>
        Number(a.rating || 0) - Number(b.rating || 0) ||
        Number(b.id) - Number(a.id)
    );
  }
  return copy;
}

// Theme helpers
const THEME_KEY = "prompt_library_theme";
function readTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}
function writeTheme(t) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch (e) {}
}
function applyTheme(t) {
  const body = document.body;
  if (t === "dark") body.classList.add("dark-mode");
  else body.classList.remove("dark-mode");
  const el = document.getElementById("theme-toggle");
  if (el) {
    if (el.tagName === "INPUT" && el.type === "checkbox") {
      el.checked = t === "dark";
    } else {
      el.textContent = t === "dark" ? "Light mode" : "Dark mode";
    }
  }
}
function toggleTheme() {
  const cur = readTheme();
  const next = cur === "dark" ? "light" : "dark";
  writeTheme(next);
  applyTheme(next);
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
  // sort control
  const sortEl = document.getElementById("sort-select");
  if (sortEl) {
    sortEl.addEventListener("change", () => renderPrompts());
  }
  // theme toggle (switch checkbox)
  const themeSwitch = document.getElementById("theme-toggle");
  if (themeSwitch) {
    // initialize switch state from saved theme
    const saved = readTheme();
    themeSwitch.checked = saved === "dark";
    // when user toggles, set explicit theme based on checkbox state
    themeSwitch.addEventListener("change", () => {
      const next = themeSwitch.checked ? "dark" : "light";
      writeTheme(next);
      applyTheme(next);
    });
  }
  // apply saved theme
  applyTheme(readTheme());
});
