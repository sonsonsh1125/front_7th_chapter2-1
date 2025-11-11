import { PageLayout } from "./PageLayout.js";
import { SearchForm, ProductList } from "../components/index.js";

export const HomePage = ({ filters = {}, products, loading, error }) => {
  const limit = filters?.limit ?? 20;
  const sort = filters?.sort ?? "price_asc";

  return PageLayout({
    children: `
      ${SearchForm({ limit, sort })}
      ${ProductList({ loading, products, error })}
    `,
  });
};
