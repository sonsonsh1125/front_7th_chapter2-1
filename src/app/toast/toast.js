const containerId = "global-toast-container";
const AUTO_DISMISS_DELAY = 3000;

export function showToast(message, type = "success") {
  ensureContainer();
  const container = document.getElementById(containerId);
  if (!container) return;

  const toast = document.createElement("div");
  const { wrapperClass, icon } = getToastConfig(type);
  toast.className = wrapperClass;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <div class="flex-shrink-0">${icon}</div>
    <p class="flex-1 text-sm font-medium">${escapeHtml(message)}</p>
    <button
      type="button"
      id="toast-close-btn"
      class="flex-shrink-0 ml-3 text-white hover:text-gray-200 transition-colors"
      aria-label="토스트 닫기"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  const closeButton = toast.querySelector("button");
  if (closeButton) {
    closeButton.addEventListener("click", () => dismissToast(toast));
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("opacity-100", "translate-y-0"));

  setTimeout(() => dismissToast(toast), AUTO_DISMISS_DELAY);
}

function ensureContainer() {
  if (document.getElementById(containerId)) return;
  const container = document.createElement("div");
  container.id = containerId;
  container.className =
    "fixed top-6 inset-x-0 flex flex-col items-center gap-2 z-[9999] px-4 sm:px-0 pointer-events-none";
  document.body.appendChild(container);
}

function dismissToast(node) {
  if (!node) return;
  node.classList.remove("opacity-100", "translate-y-0");
  node.classList.add("opacity-0", "-translate-y-2");
  setTimeout(() => {
    node.remove();
    const container = document.getElementById(containerId);
    if (container && container.childElementCount === 0) {
      container.remove();
    }
  }, 200);
}

function getToastConfig(type) {
  const baseClass =
    "pointer-events-auto transition transform translate-y-2 opacity-0 rounded-lg shadow-lg px-4 py-3 text-sm flex items-center space-x-3 max-w-sm w-full sm:w-auto";

  switch (type) {
    case "info":
      return {
        wrapperClass: `${baseClass} bg-blue-600 text-white`,
        icon: `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `,
      };
    case "error":
      return {
        wrapperClass: `${baseClass} bg-red-600 text-white`,
        icon: `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        `,
      };
    default:
      return {
        wrapperClass: `${baseClass} bg-green-600 text-white`,
        icon: `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        `,
      };
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
