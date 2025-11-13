import { Footer } from "../components/Footer.js";

const renderHeader = () => `
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-md mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button type="button" data-detail-back class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
        <div class="flex items-center space-x-2">
          <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H3m4 11v6a1 1 0 001 1h1a1 1 0 001-1v-6M13 13v6a1 1 0 001 1h1a1 1 0 001-1v-6"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
`;

const renderLoading = () => `
  <div class="min-h-screen bg-gray-50">
    ${renderHeader()}
    <main class="max-w-md mx-auto px-4 py-4">
      <div class="py-20 bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    </main>
    ${Footer()}
  </div>
`;

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

const renderStars = (rating = 0) => {
  const score = Math.max(0, Math.min(5, Math.round(Number(rating))));
  return Array.from({ length: 5 })
    .map((_, index) => {
      const colorClass = index < score ? "text-yellow-400" : "text-gray-300";
      return `<svg class="w-4 h-4 ${colorClass}" fill="currentColor" viewBox="0 0 20 20"><path d="${STAR_PATH}"></path></svg>`;
    })
    .join("");
};

const renderRelatedProducts = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const cards = items
    .map(
      (item) => `
        <div class="bg-gray-50 rounded-lg p-3 related-product-card cursor-pointer" data-product-id="${item.productId}">
          <div class="aspect-square bg-white rounded-md overflow-hidden mb-2">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" loading="lazy">
          </div>
          <h3 class="text-sm font-medium text-gray-900 mb-1 line-clamp-2">${item.title}</h3>
          <p class="text-sm font-bold text-blue-600">${Number(item.lprice ?? item.price ?? 0).toLocaleString()}원</p>
        </div>
      `,
    )
    .join("");

  return `
    <div class="bg-white rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
        <p class="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-2 gap-3 responsive-grid">
          ${cards}
        </div>
      </div>
    </div>
  `;
};

export const DetailPage = ({ loading, product, related = [] }) => {
  if (loading || !product) {
    return renderLoading();
  }

  const price = Number(product.lprice ?? product.price ?? 0).toLocaleString();
  const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
  const brandLabel = product.brand ? `<p class="text-xs text-gray-500 mb-2">${product.brand}</p>` : "";
  const description = product.description || "상품 설명을 준비중입니다.";
  const ratingValue = Number(product.rating ?? 0);
  const normalizedRating = Number.isFinite(ratingValue) ? ratingValue : 0;
  const reviewValue = Number(product.reviewCount ?? 0);
  const normalizedReviewCount = Number.isFinite(reviewValue) ? reviewValue : 0;

  return `
    <div class="min-h-screen bg-gray-50">
      ${renderHeader()}
      <main class="max-w-md mx-auto px-4 py-4">
        <nav class="mb-4">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" data-link="" class="hover:text-blue-600 transition-colors">홈</a>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <button type="button" class="breadcrumb-link" data-breadcrumb-category1="${product.category1}">
              ${product.category1}
            </button>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <button
              type="button"
              class="breadcrumb-link"
              data-breadcrumb-category1="${product.category1}"
              data-breadcrumb-category2="${product.category2}"
            >
              ${product.category2}
            </button>
          </div>
        </nav>

        <div class="bg-white rounded-lg shadow-sm mb-6">
          <div class="p-4">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover product-detail-image">
            </div>
            <div>
              ${brandLabel}
              <h1 class="text-xl font-bold text-gray-900 mb-3">${product.title}</h1>
              <div class="flex items-center mb-3">
                <div class="flex items-center">${renderStars(normalizedRating)}</div>
                <span class="ml-2 text-sm text-gray-600">${normalizedRating.toFixed(1)} (${normalizedReviewCount.toLocaleString()}개 리뷰)</span>
              </div>
              <div class="mb-4">
                <span class="text-2xl font-bold text-blue-600">${price}원</span>
              </div>
              <div class="text-sm text-gray-600 mb-4">재고 ${stock}개</div>
              <div class="text-sm text-gray-700 leading-relaxed mb-6">
                ${description}
              </div>
            </div>
          </div>
          <div class="border-t border-gray-200 p-4">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-gray-900">수량</span>
              <div class="flex items-center">
                <button id="quantity-decrease" class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                  </svg>
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  value="1"
                  min="1"
                  max="${stock}"
                  class="w-16 h-8 text-center text-sm border-t border-b border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                <button id="quantity-increase" class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </button>
              </div>
            </div>
            <button id="add-to-cart-btn" data-product-id="${product.productId}" class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium add-to-cart-btn">
              장바구니 담기
            </button>
          </div>
        </div>

        <div class="mb-6">
          <button
            class="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors go-to-product-list"
            data-category1="${product.category1}"
            data-category2="${product.category2}"
          >
            상품 목록으로 돌아가기
          </button>
        </div>

        ${renderRelatedProducts(related)}
      </main>
      ${Footer()}
    </div>
  `;
};
