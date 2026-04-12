import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Private_page } from "./pages/Private_page";
import { PrivateLayout } from "./components/Private/Private-layout";
import Profile from "./pages/Privateviews/Profile";
import { SearchMate } from "./pages/Privateviews/Search-mate";
import { YourMatches } from "./pages/Privateviews/Your-matches";
import { FindGames } from "./pages/Privateviews/Find-games";
import Settings from "./pages/Privateviews/Settings";
import { MatchUserDetails } from "./components/matchUserDetails";
import { Reset } from "./pages/Reset";
import { ConfirmEmailChange } from "./pages/ConfirmEmailChange";
import { Onboarding } from "./components/Onboarding/Onboarding";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      <Route path="/" element={<Home />} />
      <Route path="/private" element={<PrivateLayout />}>
        <Route index element={<Private_page />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search-a-mate" element={<SearchMate />} />
        <Route path="your-matches" element={<YourMatches />} />
        <Route path="your-matches/matchDetails/:id" element={<MatchUserDetails />} />
        <Route path="find-games" element={<FindGames />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/reset" element={<Reset />} />
      <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);
