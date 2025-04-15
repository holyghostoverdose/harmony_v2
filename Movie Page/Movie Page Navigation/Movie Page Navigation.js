/**
 * Bottom Navigation Component
 * JavaScript implementation for navigation functionality
 */

class BottomNavigation {
  constructor() {
    this.navItems = Array.from(document.querySelectorAll(".nav-item"));
    this.currentActiveIndex = 0;
    this.init();
  }

  init() {
    // Add click event listeners to all navigation items
    this.navItems.forEach((item, index) => {
      item.addEventListener("click", () => this.setActiveItem(index));
    });

    // Add keyboard navigation support
    document.addEventListener("keydown", (event) =>
      this.handleKeyNavigation(event),
    );
  }

  /**
   * Sets the active navigation item
   * @param {number} index - The index of the item to set as active
   */
  setActiveItem(index) {
    if (index === this.currentActiveIndex) return;

    // Remove active class from current active item
    this.navItems[this.currentActiveIndex].classList.remove("nav-item-active");
    this.navItems[this.currentActiveIndex].removeAttribute("aria-current");

    // If the current active item has an icon container, we need to handle it
    const currentIconContainer =
      this.navItems[this.currentActiveIndex].querySelector(".icon-container");
    if (currentIconContainer) {
      // Convert the icon container to a regular img
      const img = currentIconContainer.querySelector("img");
      if (img) {
        this.navItems[this.currentActiveIndex].innerHTML = "";
        this.navItems[this.currentActiveIndex].appendChild(img);
        const label = document.createElement("span");
        label.className = "nav-label";
        label.textContent =
          this.navItems[this.currentActiveIndex].textContent?.trim() || "";
        this.navItems[this.currentActiveIndex].appendChild(label);
      }
    }

    // Set new active item
    this.currentActiveIndex = index;
    this.navItems[index].classList.add("nav-item-active");
    this.navItems[index].setAttribute("aria-current", "page");

    // If the new active item doesn't have an icon container, we need to create one
    const newActiveImg = this.navItems[index].querySelector("img");
    if (
      newActiveImg &&
      !this.navItems[index].querySelector(".icon-container")
    ) {
      const iconContainer = document.createElement("div");
      iconContainer.className = "icon-container";

      // Move the image into the container
      newActiveImg.parentNode?.removeChild(newActiveImg);
      iconContainer.appendChild(newActiveImg);

      // Get the label text
      const labelText = this.navItems[index].textContent?.trim() || "";

      // Clear the button and add the new structure
      this.navItems[index].innerHTML = "";
      this.navItems[index].appendChild(iconContainer);

      const label = document.createElement("span");
      label.className = "nav-label";
      label.textContent = labelText;
      this.navItems[index].appendChild(label);
    }
  }

  /**
   * Handles keyboard navigation
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyNavigation(event) {
    // Only handle if focus is within the navigation
    const activeElement = document.activeElement;
    if (!this.navItems.includes(activeElement)) return;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        this.focusNextItem();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.focusPreviousItem();
        break;
    }
  }

  /**
   * Focuses the next navigation item
   */
  focusNextItem() {
    const currentFocusIndex = this.navItems.findIndex(
      (item) => item === document.activeElement,
    );
    const nextIndex = (currentFocusIndex + 1) % this.navItems.length;
    this.navItems[nextIndex].focus();
  }

  /**
   * Focuses the previous navigation item
   */
  focusPreviousItem() {
    const currentFocusIndex = this.navItems.findIndex(
      (item) => item === document.activeElement,
    );
    const prevIndex =
      (currentFocusIndex - 1 + this.navItems.length) % this.navItems.length;
    this.navItems[prevIndex].focus();
  }
}

// Initialize the navigation when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new BottomNavigation();
});
