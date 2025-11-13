import { CartTemplates } from "../../components/Cart.js";
import { showToast } from "../toast/toast.js";

let overlay = null;
let unsubscribe = null;
let keydownHandler = null;

export function openCartModal() {
  const manager = window.cartManager;
  if (!manager) return;
  const snapshot = manager.getState();

  if (overlay) {
    updateModalContent(snapshot, manager);
    focusFirstButton();
    return;
  }

  const root = document.getElementById("root") ?? document.body;

  overlay = document.createElement("div");
  overlay.id = "cart-modal-overlay";
  overlay.className =
    "cart-modal-overlay fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50";
  overlay.innerHTML = `<div class="relative w-full sm:w-auto sm:min-w-[360px]"></div>`;

  root.appendChild(overlay);
  document.body.classList.add("overflow-hidden");

  overlay.addEventListener("click", handleOverlayClick);
  updateModalContent(snapshot, manager);

  unsubscribe = manager.subscribe((nextSnapshot) => updateModalContent(nextSnapshot, manager));
  keydownHandler = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCartModal();
    }
  };
  document.addEventListener("keydown", keydownHandler);
  focusFirstButton();
}

export function closeCartModal() {
  if (!overlay) return;
  overlay.removeEventListener("click", handleOverlayClick);
  overlay.remove();
  overlay = null;
  document.body.classList.remove("overflow-hidden");
  if (typeof unsubscribe === "function") {
    unsubscribe();
    unsubscribe = null;
  }
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }
}

function renderCartContent(snapshot) {
  if (snapshot.isEmpty) {
    return CartTemplates.empty({});
  }
  return CartTemplates.list({
    title: "장바구니",
    totalCount: snapshot.summary.totalCount,
    items: snapshot.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.priceLabel,
      quantity: { count: item.quantity },
      image: item.image,
      brand: item.brand,
      total: item.totalLabel,
      selected: item.selected,
    })),
    totalPrice: snapshot.summary.totalPrice,
    selectedCount: snapshot.summary.selectedCount,
    selectedPrice: snapshot.summary.selectedPrice,
    selectable: true,
  });
}

export function updateModalContent(snapshot, manager = window.cartManager) {
  if (!overlay || !manager) return;
  const container = overlay.querySelector(".relative");
  if (!container) return;
  container.innerHTML = renderCartContent(snapshot);
  attachEventHandlers(container, snapshot, manager);
}

function attachEventHandlers(container, snapshot, manager) {
  const closeBtn = container.querySelector("#cart-modal-close-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeCartModal);

  const selectAllCheckbox = container.querySelector("#cart-modal-select-all-checkbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = snapshot.summary.totalCount > 0 && snapshot.allSelected;
    selectAllCheckbox.addEventListener("change", (event) => manager.toggleAll(event.target.checked));
  }

  container.querySelectorAll(".cart-item-checkbox").forEach((checkbox) => {
    const productId = checkbox.dataset.productId;
    const item = snapshot.items.find((entry) => entry.productId === productId);
    checkbox.checked = item ? item.selected : snapshot.allSelected;
    checkbox.addEventListener("change", () => manager.toggleItem(productId));
  });

  container.querySelectorAll(".quantity-decrease-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.dataset.productId;
      const item = snapshot.items.find((entry) => entry.productId === productId);
      if (!item) return;
      const next = Math.max(1, item.quantity - 1);
      manager.updateQuantity(productId, next);
    });
  });

  container.querySelectorAll(".quantity-increase-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.dataset.productId;
      const next = getQuantity(snapshot, productId) + 1;
      manager.updateQuantity(productId, next);
    });
  });

  container.querySelectorAll(".cart-item-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      manager.removeItem(btn.dataset.productId);
      showToast("장바구니에서 상품이 삭제되었습니다.", "info");
    });
  });

  const clearBtn = container.querySelector("#cart-modal-clear-cart-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      manager.clear();
      showToast("장바구니를 비웠습니다.", "info");
    });
  }

  const removeSelectedBtn = container.querySelector("#cart-modal-remove-selected-btn");
  if (removeSelectedBtn) {
    removeSelectedBtn.addEventListener("click", () => {
      manager.removeSelected();
      showToast("선택한 상품이 삭제되었습니다.", "info");
    });
  }

  const checkoutBtn = container.querySelector("#cart-modal-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      showToast("구매하기 기능은 추후 지원 예정입니다.", "info");
    });
  }
}

function handleOverlayClick(event) {
  if (event.target.id === "cart-modal-overlay") {
    closeCartModal();
  }
}

function focusFirstButton() {
  if (!overlay) return;
  const closeBtn = overlay.querySelector("#cart-modal-close-btn");
  if (closeBtn) {
    closeBtn.focus();
  }
}

function getQuantity(snapshot, productId) {
  return snapshot.items.find((item) => item.productId === productId)?.quantity ?? 1;
}
