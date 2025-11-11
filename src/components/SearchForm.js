const LIMIT_OPTIONS = [10, 20, 50, 100];

const renderLimitOption = (value, current) => {
  const numericValue = Number(value);
  const isSelected = Number(current) === numericValue ? "selected" : "";

  return `<option value="${numericValue}" ${isSelected}>${numericValue}개</option>`;
};

const renderSortOption = (value, label, currentSort) => {
  const isSelected = value === currentSort ? "selected" : "";
  return `<option value="${value}" ${isSelected}>${label}</option>`;
};

export const SearchForm = ({ limit = 20, sort = "price_asc" } = {}) => {
  return /* HTML */ `
    <!-- 검색 및 필터 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <!-- 검색창 -->
      <div class="mb-4">
        <div class="relative">
          <input
            type="text"
            id="search-input"
            placeholder="상품명을 검색해보세요..."
            value=""
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
      <!-- 필터 옵션 -->
      <div class="space-y-3">
        <!-- 카테고리 필터 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">카테고리:</label>
            <button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>
          </div>
          <!-- 1depth 카테고리 -->
          <div class="flex flex-wrap gap-2">
            <div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>
          </div>
          <!-- 2depth 카테고리 -->
        </div>
        <!-- 기존 필터들 -->
        <div class="flex gap-2 items-center justify-between">
          <!-- 페이지당 상품 수 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">개수:</label>
            <select
              id="limit-select"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              ${LIMIT_OPTIONS.map((option) => renderLimitOption(option, limit)).join("")}
            </select>
          </div>
          <!-- 정렬 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">정렬:</label>
            <select
              id="sort-select"
              class="text-sm border border-gray-300 rounded px-2 py-1
                             focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              ${[
                { value: "price_asc", label: "가격 낮은순" },
                { value: "price_desc", label: "가격 높은순" },
                { value: "name_asc", label: "이름순" },
                { value: "name_desc", label: "이름 역순" },
              ]
                .map(({ value, label }) => renderSortOption(value, label, sort))
                .join("")}
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const bindSearchFormEvents = ({
  onLimitChange,
  onSortChange,
  currentLimit = 20,
  currentSort = "price_asc",
} = {}) => {
  const limitSelect = document.getElementById("limit-select");
  const sortSelect = document.getElementById("sort-select");

  if (limitSelect) {
    limitSelect.value = String(currentLimit);
    limitSelect.onchange = (event) => {
      const selectedLimit = Number(event.target.value);

      if (Number.isNaN(selectedLimit)) {
        return;
      }

      if (typeof onLimitChange === "function") {
        onLimitChange(selectedLimit);
      }
    };
  }

  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.onchange = (event) => {
      const nextSort = event.target.value;

      if (typeof onSortChange === "function") {
        onSortChange(nextSort);
      }
    };
  }
};
