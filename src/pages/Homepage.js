import { PageLayout } from "./PageLayout.js";
import { SearchFrom, ProductList } from "../components/index.js";

export const HomePage = ({ filters, pagination, products, loading }) => {
  return PageLayout({
    children: `
      ${SearchFrom({ filters, pagination })}
      ${ProductList({ loading, products })}
    `,
  });
};
