import { PageLayout } from "./PageLayout.js";
import { SearchForm, ProductList } from "../components/index.js";

export const HomePage = ({ filters = {}, products = [], loading, error, categories = {}, pagination }) => {
  const limit = filters?.limit ?? 20;
  const sort = filters?.sort ?? "price_asc";
  const search = filters?.search ?? "";
  const category1 = filters?.category1 ?? "";
  const category2 = filters?.category2 ?? "";
  const total = pagination?.total ?? pagination?.totalCount ?? products.length ?? 0;

  return PageLayout({
    children: `
      ${SearchForm({ limit, sort, search, category1, category2, categories })}
      ${ProductList({ loading, products, error, total })}
    `,
  });
};
