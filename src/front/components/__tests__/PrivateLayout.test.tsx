import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PrivateLayout } from "../Private/Private-layout";
import { StoreProvider } from "../../hooks/useGlobalReducer";

// Mock the child components
jest.mock("../Private/Private-navbar", () => ({
  PrivateNavbar: () => <nav>Private Navbar</nav>,
}));

jest.mock("../Private/Private-sidebar", () => ({
  Sidebar: ({ activePath }: { activePath: string }) => <aside>Sidebar - {activePath}</aside>,
}));

jest.mock("../../services/notificationService", () => ({
  notificationService: {
    loadSettings: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../hooks/useProfileCompletion", () => ({
  useProfileCompletion: () => ({
    isComplete: true,
    missingFields: [] as string[],
    completionPercentage: 100,
    validationResult: { isComplete: true, missingFields: [], completionPercentage: 100 },
  }),
}));

describe("PrivateLayout", () => {
  it("renders layout with navbar and sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/private/profile"]}>
        <StoreProvider>
          <PrivateLayout />
        </StoreProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Private Navbar")).toBeInTheDocument();
    expect(screen.getByText(/Sidebar/)).toBeInTheDocument();
  });

  it("passes correct activePath to Sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/private/search-a-mate"]}>
        <StoreProvider>
          <PrivateLayout />
        </StoreProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Sidebar - \/private\/search-a-mate/)).toBeInTheDocument();
  });
});
