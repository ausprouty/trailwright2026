import "./OikosListTool.css";

export default class OikosListTool {
  static get toolbox() {
    return {
      title: "Oikos List",
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
            fill="currentColor"
          />
        </svg>
      `,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, readOnly = false }) {
    this.readOnly = readOnly;

    this.data = {
      title: data && typeof data.title === "string"
        ? data.title
        : "",
      items: Array.isArray(data && data.items)
        ? data.items.map((item) => ({
            name: item && typeof item.name === "string"
              ? item.name
              : "",
            relationship:
              item && typeof item.relationship === "string"
                ? item.relationship
                : "",
            notes: item && typeof item.notes === "string"
              ? item.notes
              : "",
          }))
        : [],
    };

    this.wrapper = null;
    this.titleInput = null;
    this.itemsWrap = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "oikos-list-tool";

    if (this.readOnly) {
      this.renderReadOnly();
      return this.wrapper;
    }

    this.renderEditable();
    return this.wrapper;
  }

  renderEditable() {
    const titleLabel = document.createElement("div");
    titleLabel.className = "oikos-list-tool__label";
    titleLabel.textContent = "Title";

    this.titleInput = document.createElement("input");
    this.titleInput.type = "text";
    this.titleInput.className = "oikos-list-tool__title";
    this.titleInput.value = this.data.title;
    this.titleInput.placeholder = "Enter list title";
    this.titleInput.addEventListener("input", () => {
      this.data.title = this.titleInput.value;
    });

    this.itemsWrap = document.createElement("div");
    this.itemsWrap.className = "oikos-list-tool__items";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "oikos-list-tool__add-button";
    addButton.textContent = "Add person";
    addButton.addEventListener("click", () => {
      this.data.items.push({
        name: "",
        relationship: "",
        notes: "",
      });
      this.renderItemEditors();
    });

    this.wrapper.appendChild(titleLabel);
    this.wrapper.appendChild(this.titleInput);
    this.wrapper.appendChild(this.itemsWrap);
    this.wrapper.appendChild(addButton);

    if (!this.data.items.length) {
      this.data.items.push({
        name: "",
        relationship: "",
        notes: "",
      });
    }

    this.renderItemEditors();
  }

  renderItemEditors() {
    this.itemsWrap.innerHTML = "";

    this.data.items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "oikos-list-tool__item";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "oikos-list-tool__input";
      nameInput.placeholder = "Name";
      nameInput.value = item.name;
      nameInput.addEventListener("input", () => {
        this.data.items[index].name = nameInput.value;
      });

      const relationshipInput = document.createElement("input");
      relationshipInput.type = "text";
      relationshipInput.className = "oikos-list-tool__input";
      relationshipInput.placeholder = "Relationship";
      relationshipInput.value = item.relationship;
      relationshipInput.addEventListener("input", () => {
        this.data.items[index].relationship =
          relationshipInput.value;
      });

      const notesInput = document.createElement("textarea");
      notesInput.className = "oikos-list-tool__textarea";
      notesInput.placeholder = "Notes";
      notesInput.value = item.notes;
      notesInput.addEventListener("input", () => {
        this.data.items[index].notes = notesInput.value;
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className =
        "oikos-list-tool__remove-button";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        this.data.items.splice(index, 1);

        if (!this.data.items.length) {
          this.data.items.push({
            name: "",
            relationship: "",
            notes: "",
          });
        }

        this.renderItemEditors();
      });

      card.appendChild(nameInput);
      card.appendChild(relationshipInput);
      card.appendChild(notesInput);
      card.appendChild(removeButton);

      this.itemsWrap.appendChild(card);
    });
  }

  renderReadOnly() {
    if (this.data.title) {
      const heading = document.createElement("h3");
      heading.className = "oikos-list-tool__heading";
      heading.textContent = this.data.title;
      this.wrapper.appendChild(heading);
    }

    const list = document.createElement("div");
    list.className = "oikos-list-tool__read-only-list";

    this.data.items.forEach((item) => {
      if (!item.name && !item.relationship && !item.notes) {
        return;
      }

      const card = document.createElement("div");
      card.className = "oikos-list-tool__read-only-item";

      const name = document.createElement("div");
      name.className = "oikos-list-tool__read-only-name";
      name.textContent = item.name || "";

      const relationship = document.createElement("div");
      relationship.className =
        "oikos-list-tool__read-only-relationship";
      relationship.textContent = item.relationship || "";

      const notes = document.createElement("div");
      notes.className = "oikos-list-tool__read-only-notes";
      notes.textContent = item.notes || "";

      if (item.name) {
        card.appendChild(name);
      }

      if (item.relationship) {
        card.appendChild(relationship);
      }

      if (item.notes) {
        card.appendChild(notes);
      }

      list.appendChild(card);
    });

    this.wrapper.appendChild(list);
  }

  save() {
    return {
      title: this.data.title.trim(),
      items: this.data.items
        .map((item) => ({
          name: item.name.trim(),
          relationship: item.relationship.trim(),
          notes: item.notes.trim(),
        }))
        .filter((item) => {
          return item.name || item.relationship || item.notes;
        }),
    };
  }

  validate(savedData) {
    return Array.isArray(savedData.items);
  }
}