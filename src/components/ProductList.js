export const Skeleton = /* HTML */ `
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div class="aspect-square bg-gray-200"></div>
    <div class="p-3">
      <div class="h-4 bg-gray-200 rounded mb-2"></div>
      <div class="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div class="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
`;

export const Loading = /* HTML */ `
  <div class="text-center py-4">
    <div class="inline-flex items-center">
      <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="text-sm text-gray-600">상품을 불러오는 중...</span>
    </div>
  </div>
`;

const ProductItem = ({ title, image, productId, lprice, brand }) => {
  return /* HTML */ `
    <div
      class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card"
      data-product-id="${productId}"
    >
      <!-- 상품 이미지 -->
      <div class="aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image">
        <img
          src="${image}"
          alt="${title}"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>
      <!-- 상품 정보 -->
      <div class="p-3">
        <div class="cursor-pointer product-info mb-3">
          <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${title}</h3>
          <p class="text-xs text-gray-500 mb-2">${brand ?? ""}</p>
          <p class="text-lg font-bold text-gray-900">${Number(lprice).toLocaleString()}원</p>
        </div>
        <!-- 장바구니 버튼 -->
        <button
          class="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md
      hover:bg-blue-700 transition-colors add-to-cart-btn"
          data-product-id="${productId}"
        >
          장바구니 담기
        </button>
      </div>
    </div>
  `;
};

const ErrorState = (message = "잠시 후 다시 시도해주세요.") => /* HTML */ `
  <div class="bg-white border border-red-200 rounded-lg p-6 text-center">
    <div class="mx-auto mb-4">
      <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 7v6m0 4h.01"
        ></path>
      </svg>
    </div>
    <p class="text-sm font-medium text-red-600 mb-2">상품을 불러오지 못했습니다.</p>
    <p class="text-xs text-gray-500 mb-4">${message}</p>
    <button
      id="retry-fetch-products"
      class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
    >
      다시 시도
    </button>
  </div>
`;

export const ProductList = ({ loading = false, products = [], error = null, total = 0 } = {}) => {
  return /* HTML */ `
    <!-- 상품 목록 -->
    <div class="mb-6">
      <div>
        ${error
          ? ErrorState(error ?? undefined)
          : loading
            ? ` <!-- 상품 그리드 -->
    <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
      <!-- 로딩 스켈레톤 -->
      ${Skeleton.repeat(4)}
    </div>
    ${Loading}`
            : `<div class="mb-4 text-sm text-gray-600" id="products-summary">
              총 <span class="font-medium text-gray-900" id="products-count">${total}개</span>의 상품
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
              ${products.map(ProductItem).join("")}
          </div>
          <div id="products-load-indicator" class="text-center py-4 text-sm text-gray-500 hidden">
            다음 상품을 불러오는 중...
          </div>
          `}
      </div>
    </div>
  `;
};
