import { HomePage } from "./pages/HomePage.js";
import { getProducts, getProduct } from "./api/productApi.js";
import { DetailPage } from "./pages/Detailpage.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

// component가 router를 가져다 사용하면 router는 render를 의존
// render는 page를 가져다 사용하고 page는 component를 가져다 사용하는
// 순환참조가 일어나게 됨 => 코드의 실행과정이 꼬일수 있음(역할과 책임의 문제)

async function render() {
  const $root = document.getElementById("root");

  if (location.pathname === "/") {
    $root.innerHTML = HomePage({ loading: true });
    const data = await getProducts();
    $root.innerHTML = HomePage({ ...data, loading: false });

    document.addEventListener("click", (event) => {
      if (event.target.closest(".product-card")) {
        const productId = event.target.closest(".product-card").dataset.productId;
        history.pushState({}, "", `/product/${productId}`);
        render();
      }
    });
  } else {
    $root.innerHTML = DetailPage({ loading: true });
    const productId = location.pathname.split("/").pop();
    const data = await getProduct(productId);
    $root.innerHTML = DetailPage({ product: data, loading: false });
  }
}

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
