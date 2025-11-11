import { HomePage } from "./pages/HomePage.js";
import { getProducts, getProduct } from "./api/productApi.js";
import { DetailPage } from "./pages/Detailpage.js";
import { bindSearchFormEvents } from "./components/SearchForm.js";

const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

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

async function render() {
  const $root = document.getElementById("root");
  const pathname = getNormalizedPathname();

  if (pathname === "/" || pathname === "") {
    $root.innerHTML = HomePage({ loading: true, filters: { limit: currentLimit, sort: currentSort } });
    try {
      const data = await getProducts({ limit: currentLimit, sort: currentSort });
      const filters = { ...(data?.filters ?? {}), limit: currentLimit, sort: currentSort };

      $root.innerHTML = HomePage({ ...data, filters, loading: false });
      bindSearchFormEvents({
        currentLimit,
        currentSort,
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
      });
    } catch (error) {
      console.error("상품 목록 로딩 실패:", error);
      $root.innerHTML = HomePage({
        loading: false,
        products: [],
        filters: { limit: currentLimit, sort: currentSort },
        pagination: {},
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
      bindSearchFormEvents({
        currentLimit,
        currentSort,
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
      });
    }
  } else if (pathname.startsWith("/product/")) {
    $root.innerHTML = DetailPage({ loading: true });
    const productId = pathname.split("/").pop();
    const data = await getProduct(productId);
    $root.innerHTML = DetailPage({ product: data, loading: false });
  } else {
    // fallback: 홈으로 이동
    history.replaceState({}, "", `${basePath}/`);
    render();
    return;
  }
}

document.addEventListener("click", (event) => {
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
