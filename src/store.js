export const DEFAULT_PAGINATION = { page: 1, totalPages: 1, hasNext: false, total: 0 };

export const DEFAULT_FILTERS = {
  limit: 20,
  sort: "price_asc",
  search: "",
  category1: "",
  category2: "",
};

export function normalizePaginationState(pagination = DEFAULT_PAGINATION, productCount = 0) {
  const page = Number(pagination.page ?? DEFAULT_PAGINATION.page);
  const totalPages = Number(pagination.totalPages ?? DEFAULT_PAGINATION.totalPages);
  const hasNext = typeof pagination.hasNext === "boolean" ? Boolean(pagination.hasNext) : page < totalPages;
  const total = Number(pagination.total ?? pagination.totalCount ?? DEFAULT_PAGINATION.total ?? productCount ?? 0);
  return { page, totalPages, hasNext, total };
}

export function createAppStore(initialState = {}) {
  const initialProducts = Array.isArray(initialState.products) ? [...initialState.products] : [];
  const state = {
    filters: { ...DEFAULT_FILTERS, ...(initialState.filters ?? {}) },
    products: initialProducts,
    productDetail: initialState.productDetail ?? null,
    pagination: normalizePaginationState(initialState.pagination ?? DEFAULT_PAGINATION, initialProducts.length),
    isFetchingNextPage: Boolean(initialState.isFetchingNextPage),
  };
  const listeners = new Set();

  function getState() {
    return {
      filters: { ...state.filters },
      products: [...state.products],
      productDetail: state.productDetail ? { ...state.productDetail } : null,
      pagination: { ...state.pagination },
      isFetchingNextPage: state.isFetchingNextPage,
    };
  }

  function notify() {
    if (listeners.size === 0) return;
    const snapshot = getState();
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("스토어 구독자 알림 중 오류가 발생했습니다.", error);
      }
    });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }
    listeners.add(listener);
    listener(getState());
    return () => {
      listeners.delete(listener);
    };
  }

  function updateFilters(partial) {
    if (!partial || typeof partial !== "object") return;
    const nextFilters = { ...state.filters };
    if (Object.prototype.hasOwnProperty.call(partial, "limit")) {
      const nextLimit = Number(partial.limit);
      if (!Number.isNaN(nextLimit)) {
        nextFilters.limit = nextLimit;
      }
    }
    if (Object.prototype.hasOwnProperty.call(partial, "sort")) {
      nextFilters.sort = partial.sort ?? DEFAULT_FILTERS.sort;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "search")) {
      nextFilters.search = partial.search ?? "";
    }
    if (Object.prototype.hasOwnProperty.call(partial, "category1")) {
      nextFilters.category1 = partial.category1 ?? "";
    }
    if (Object.prototype.hasOwnProperty.call(partial, "category2")) {
      nextFilters.category2 = partial.category2 ?? "";
    }
    state.filters = nextFilters;
    notify();
  }

  function setProducts(products) {
    state.products = Array.isArray(products) ? [...products] : [];
    notify();
  }

  function appendProducts(products) {
    if (!Array.isArray(products) || products.length === 0) return;
    state.products = state.products.concat(products);
    notify();
  }

  function clearProducts() {
    if (state.products.length === 0) return;
    state.products = [];
    notify();
  }

  function setProductDetail(detail) {
    state.productDetail = detail ?? null;
    notify();
  }

  function setPagination(pagination) {
    state.pagination = normalizePaginationState({ ...state.pagination, ...(pagination ?? {}) }, state.products.length);
    notify();
  }

  function resetPagination() {
    state.pagination = normalizePaginationState(DEFAULT_PAGINATION, state.products.length);
    notify();
  }

  function setFetchingNextPage(value) {
    const next = Boolean(value);
    if (state.isFetchingNextPage === next) {
      return;
    }
    state.isFetchingNextPage = next;
    notify();
  }

  return {
    getState,
    subscribe,
    updateFilters,
    setProducts,
    appendProducts,
    clearProducts,
    setProductDetail,
    setPagination,
    resetPagination,
    setFetchingNextPage,
  };
}
