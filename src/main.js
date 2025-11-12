import { HomePage } from "./pages/HomePage.js";
import { getProducts, getProduct, getCategories } from "./api/productApi.js";
import { DetailPage } from "./pages/Detailpage.js";
import { bindSearchFormEvents } from "./components/SearchForm.js";
import { openCartModal } from "./app/cart/modal.js";
import { showToast } from "./app/toast/toast.js";

const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const STORAGE_KEY = "spa_cart_items";
const DEFAULT_PAGINATION = { page: 1, totalPages: 1, hasNext: false, total: 0 };

const enableMocking = () =>
  import("@/mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    }),
  );

function getNormalizedPathname() {
  const path = location.pathname;

  if (basePath && path.startsWith(basePath)) {
    const normalized = path.slice(basePath.length);
    if (!normalized) {
      return "/";
    }
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  return path || "/";
}

let currentLimit = 20;
let currentSort = "price_asc";
let currentSearch = "";
let currentCategory1 = "";
let currentCategory2 = "";
let currentProducts = [];
let currentProductDetail = null;
let cartBadgeUnsubscribe = null;
let currentPagination = { ...DEFAULT_PAGINATION };
let isFetchingNextPage = false;
let homeScrollHandler = null;
let homeScrollBound = false;
const cartListeners = new Set();
let cartItems = loadCartFromStorage();
let categoriesCache = null;
let categoriesInFlight = null;

async function loadCategories() {
  if (categoriesCache) {
    return categoriesCache;
  }

  if (!categoriesInFlight) {
    categoriesInFlight = getCategories()
      .then((data) => {
        categoriesCache = data ?? {};
        return categoriesCache;
      })
      .finally(() => {
        categoriesInFlight = null;
      });
  }

  return categoriesInFlight;
}

function bindFilters() {
  bindSearchFormEvents({
    currentLimit,
    currentSort,
    currentSearch,
    onLimitChange: (nextLimit) => {
      if (currentLimit === nextLimit) {
        return;
      }
      currentLimit = nextLimit;
      render();
    },
    onSortChange: (nextSort) => {
      if (currentSort === nextSort) {
        return;
      }
      currentSort = nextSort;
      render();
    },
    onSearchSubmit: (nextSearch) => {
      if (currentSearch === nextSearch) {
        return;
      }
      currentSearch = nextSearch;
      render();
    },
    onCategoryReset: () => {
      if (!currentCategory1 && !currentCategory2) {
        return;
      }
      currentCategory1 = "";
      currentCategory2 = "";
      render();
    },
    onCategory1Change: (nextCategory1) => {
      if (currentCategory1 === nextCategory1 && !currentCategory2) {
        return;
      }
      currentCategory1 = nextCategory1;
      currentCategory2 = "";
      render();
    },
    onCategory2Change: (nextCategory1, nextCategory2) => {
      if (currentCategory1 === nextCategory1 && currentCategory2 === nextCategory2) {
        return;
      }
      currentCategory1 = nextCategory1;
      currentCategory2 = nextCategory2;
      render();
    },
  });
}

async function render() {
  const $root = document.getElementById("root");
  const pathname = getNormalizedPathname();

  if (pathname === "/" || pathname === "") {
    currentProductDetail = null;
    unbindInfiniteScroll();
    currentPagination = normalizePagination();
    isFetchingNextPage = false;
    $root.innerHTML = HomePage({
      loading: true,
      filters: {
        limit: currentLimit,
        sort: currentSort,
        search: currentSearch,
        category1: currentCategory1,
        category2: currentCategory2,
      },
    });

    const categoriesPromise = loadCategories().catch((error) => {
      console.error("카테고리 로딩 실패:", error);
      return {};
    });

    try {
      const data = await getProducts({
        limit: currentLimit,
        sort: currentSort,
        search: currentSearch,
        category1: currentCategory1,
        category2: currentCategory2,
      });
      currentProducts = data?.products ?? [];
      currentPagination = normalizePagination(data?.pagination);
      isFetchingNextPage = false;
      const categories = await categoriesPromise;
      const filters = {
        ...(data?.filters ?? {}),
        limit: currentLimit,
        sort: currentSort,
        search: currentSearch,
        category1: currentCategory1,
        category2: currentCategory2,
      };

      $root.innerHTML = HomePage({ ...data, filters, categories, loading: false });
      bindFilters();
      bindCartIcon();
      bindInfiniteScroll();
    } catch (error) {
      console.error("상품 목록 로딩 실패:", error);
      currentProducts = [];
      currentPagination = normalizePagination();
      isFetchingNextPage = false;
      const categories = await categoriesPromise;
      $root.innerHTML = HomePage({
        loading: false,
        products: [],
        filters: {
          limit: currentLimit,
          sort: currentSort,
          search: currentSearch,
          category1: currentCategory1,
          category2: currentCategory2,
        },
        pagination: {},
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        categories,
      });
      bindFilters();
      bindCartIcon();
      unbindInfiniteScroll();
    }
  } else if (pathname.startsWith("/product/")) {
    currentProducts = [];
    currentPagination = normalizePagination();
    isFetchingNextPage = false;
    unbindInfiniteScroll();
    $root.innerHTML = DetailPage({ loading: true });
    const productId = pathname.split("/").pop();
    const data = await getProduct(productId);
    currentProductDetail = data;
    $root.innerHTML = DetailPage({ product: data, loading: false });
    bindCartIcon();
  } else {
    // fallback: 홈으로 이동
    history.replaceState({}, "", `${basePath}/`);
    render();
    return;
  }
}

document.addEventListener("click", (event) => {
  const addToCartButton = event.target.closest(".add-to-cart-btn");
  if (addToCartButton) {
    event.preventDefault();
    event.stopPropagation();
    const productId = addToCartButton.dataset.productId;
    if (productId) {
      addProductToCart(productId);
    }
    return;
  }

  const productCard = event.target.closest(".product-card");

  if (!productCard) {
    return;
  }

  const productId = productCard.dataset.productId;

  if (!productId) {
    return;
  }

  const nextUrl = `${basePath}/product/${productId}`;
  history.pushState({}, "", nextUrl);
  render();
});

window.addEventListener("popstate", () => {
  render();
});

function main() {
  render();
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}

function getCartProduct(productId) {
  if (!productId) {
    return null;
  }

  const listMatch = currentProducts.find((item) => item.productId === productId);
  if (listMatch) {
    return listMatch;
  }

  if (currentProductDetail?.productId === productId) {
    return currentProductDetail;
  }

  return null;
}

function addProductToCart(productId) {
  const product = getCartProduct(productId);
  if (!product) {
    console.warn("상품 정보를 찾을 수 없어 장바구니에 담지 못했습니다.", productId);
    return;
  }
  const existing = cartItems.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
    existing.selected = true;
  } else {
    cartItems.push({
      productId,
      title: product.title,
      price: Number(product.lprice ?? product.price ?? 0),
      image: product.image,
      brand: product.brand ?? "",
      selected: true,
      quantity: 1,
    });
  }
  persistCart();
  notifyCartListeners();
  showToast("장바구니에 상품이 담겼습니다.");
}

function bindCartIcon() {
  const cartButton = document.getElementById("cart-icon-btn");
  if (!cartButton || cartButton.dataset.bound === "true") return;
  cartButton.dataset.bound = "true";
  cartButton.addEventListener("click", (event) => {
    event.preventDefault();
    openCartModal();
  });
  if (cartBadgeUnsubscribe) {
    cartBadgeUnsubscribe();
  }
  cartBadgeUnsubscribe = subscribeCart((snapshot) => updateCartBadge(cartButton, snapshot));
}

function updateCartBadge(button, snapshot) {
  if (!button) return;
  let badge = button.querySelector("[data-cart-count]");
  const count = snapshot.summary.totalCount;
  if (!count) {
    if (badge) badge.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.dataset.cartCount = "true";
    badge.className =
      "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center";
    button.appendChild(badge);
  }
  badge.textContent = String(count);
}

function normalizePagination(pagination = DEFAULT_PAGINATION) {
  const page = Number(pagination.page ?? DEFAULT_PAGINATION.page);
  const totalPages = Number(pagination.totalPages ?? DEFAULT_PAGINATION.totalPages);
  const hasNext = typeof pagination.hasNext === "boolean" ? Boolean(pagination.hasNext) : page < totalPages;
  const total = Number(
    pagination.total ?? pagination.totalCount ?? DEFAULT_PAGINATION.total ?? currentProducts.length ?? 0,
  );
  return { page, totalPages, hasNext, total };
}

function bindInfiniteScroll() {
  unbindInfiniteScroll();
  if (!currentPagination.hasNext) return;
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  homeScrollHandler = () => {
    if (shouldLoadMore()) {
      void loadMoreProducts();
    }
  };
  window.addEventListener("scroll", homeScrollHandler, { passive: true });
  homeScrollBound = true;
}

function unbindInfiniteScroll() {
  if (!homeScrollBound || !homeScrollHandler) return;
  window.removeEventListener("scroll", homeScrollHandler);
  homeScrollHandler = null;
  homeScrollBound = false;
  showLoadIndicator(false);
  isFetchingNextPage = false;
}

function shouldLoadMore() {
  if (isFetchingNextPage) return false;
  if (!currentPagination.hasNext) return false;
  const scrollElement = document.documentElement;
  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = Math.max(scrollElement.scrollHeight, document.body.scrollHeight) - 300;
  return scrollPosition >= threshold;
}

async function loadMoreProducts() {
  if (isFetchingNextPage || !currentPagination.hasNext) return;
  isFetchingNextPage = true;
  showLoadIndicator(true);
  const nextPage = (currentPagination.page ?? 1) + 1;
  try {
    const data = await getProducts({
      limit: currentLimit,
      sort: currentSort,
      search: currentSearch,
      category1: currentCategory1,
      category2: currentCategory2,
      page: nextPage,
    });
    const newProducts = data?.products ?? [];
    if (newProducts.length > 0) {
      currentProducts = currentProducts.concat(newProducts);
      appendProductsToGrid(newProducts);
      updateProductsCount();
    }
    currentPagination = normalizePagination(
      data?.pagination ?? {
        page: nextPage,
        totalPages: currentPagination.totalPages,
        total: currentPagination.total,
      },
    );
    if (!currentPagination.hasNext) {
      unbindInfiniteScroll();
    }
  } catch (error) {
    console.error("다음 상품을 불러오지 못했습니다.", error);
    showToast("다음 상품을 불러오지 못했습니다.", "error");
  } finally {
    isFetchingNextPage = false;
    showLoadIndicator(false);
  }
}

function appendProductsToGrid(products) {
  const grid = document.getElementById("products-grid");
  if (!grid || !Array.isArray(products) || products.length === 0) return;
  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = createProductCard(product).trim();
    const element = wrapper.firstElementChild;
    if (element) {
      fragment.appendChild(element);
    }
  });
  grid.appendChild(fragment);
}

function createProductCard(product) {
  const priceValue = Number(product.lprice ?? product.price ?? 0);
  const priceLabel = `${priceValue.toLocaleString()}원`;
  const brand = product.brand ?? "";
  return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card" data-product-id="${product.productId}">
      <div class="aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image">
        <img
          src="${product.image}"
          alt="${product.title}"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>
      <div class="p-3">
        <div class="cursor-pointer product-info mb-3">
          <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${product.title}</h3>
          <p class="text-xs text-gray-500 mb-2">${brand}</p>
          <p class="text-lg font-bold text-gray-900">${priceLabel}</p>
        </div>
        <button
          class="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors add-to-cart-btn"
          data-product-id="${product.productId}"
        >
          장바구니 담기
        </button>
      </div>
    </div>
  `;
}

function updateProductsCount() {
  const countEl = document.getElementById("products-count");
  if (countEl) {
    const total = currentPagination.total ?? currentProducts.length ?? 0;
    countEl.textContent = `${total}개`;
  }
}

function showLoadIndicator(visible) {
  const indicator = document.getElementById("products-load-indicator");
  if (!indicator) return;
  indicator.classList.toggle("hidden", !visible);
}

function getCartSnapshot() {
  const totalCount = cartItems.length;
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedItems = cartItems.filter((item) => item.selected);
  const selectedCount = selectedItems.length;
  const selectedPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    items: cartItems.map((item) => ({
      ...item,
      priceLabel: `${item.price.toLocaleString()}원`,
      totalLabel: `${(item.price * item.quantity).toLocaleString()}원`,
    })),
    summary: {
      totalCount,
      totalPrice,
      totalPriceLabel: `${totalPrice.toLocaleString()}원`,
      selectedCount,
      selectedPrice,
      selectedPriceLabel: `${selectedPrice.toLocaleString()}원`,
    },
    isEmpty: totalCount === 0,
    allSelected: totalCount > 0 && selectedCount === totalCount,
  };
}

function notifyCartListeners() {
  const snapshot = getCartSnapshot();
  cartListeners.forEach((listener) => listener(snapshot));
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: snapshot }));
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      productId: item.productId,
      title: item.title ?? "",
      image: item.image ?? "",
      brand: item.brand ?? "",
      price: Number(item.price ?? 0),
      quantity: Math.max(1, Number(item.quantity ?? 1)),
      selected: item.selected !== false,
    }));
  } catch (error) {
    console.warn("장바구니 데이터를 불러오지 못했습니다.", error);
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        cartItems.map((item) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          selected: item.selected,
        })),
      ),
    );
  } catch (error) {
    console.warn("장바구니 데이터를 저장하지 못했습니다.", error);
  }
}

function toggleCartItem(productId) {
  const target = cartItems.find((item) => item.productId === productId);
  if (!target) return;
  target.selected = !target.selected;
  persistCart();
  notifyCartListeners();
}

function toggleCartAll(checked) {
  cartItems.forEach((item) => {
    item.selected = checked;
  });
  persistCart();
  notifyCartListeners();
}

function updateCartQuantity(productId, nextQuantity) {
  const quantity = Math.max(1, Number(nextQuantity ?? 1));
  const target = cartItems.find((item) => item.productId === productId);
  if (!target) return;
  target.quantity = quantity;
  persistCart();
  notifyCartListeners();
}

function removeCartItem(productId) {
  const beforeLength = cartItems.length;
  cartItems = cartItems.filter((item) => item.productId !== productId);
  if (cartItems.length === beforeLength) return;
  persistCart();
  notifyCartListeners();
}

function clearCart() {
  if (cartItems.length === 0) return;
  cartItems = [];
  persistCart();
  notifyCartListeners();
}

function removeSelectedCartItems() {
  const beforeLength = cartItems.length;
  cartItems = cartItems.filter((item) => !item.selected);
  if (cartItems.length === beforeLength) return;
  persistCart();
  notifyCartListeners();
}

function subscribeCart(listener) {
  if (typeof listener !== "function") return () => {};
  cartListeners.add(listener);
  listener(getCartSnapshot());
  return () => {
    cartListeners.delete(listener);
  };
}

window.cartManager = {
  getState: getCartSnapshot,
  subscribe: subscribeCart,
  addItem: addProductToCart,
  toggleItem: toggleCartItem,
  toggleAll: toggleCartAll,
  updateQuantity: updateCartQuantity,
  removeItem: removeCartItem,
  removeSelected: removeSelectedCartItems,
  clear: clearCart,
};

notifyCartListeners();
