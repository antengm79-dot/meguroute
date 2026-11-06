import { HashRouter, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { StoreProvider } from "./store";
import { TabBar } from "./components/ui";
import Home from "./screens/Home";
import Plan from "./screens/Plan";
import Questions from "./screens/Questions";
import Results from "./screens/Results";
import RoutePreview from "./screens/RoutePreview";
import Trip from "./screens/Trip";
import Camera from "./screens/Camera";
import TripEnd from "./screens/TripEnd";
import Vlog from "./screens/Vlog";
import Publish from "./screens/Publish";
import Feed from "./screens/Feed";
import RouteDetail from "./screens/RouteDetail";
import MyPage from "./screens/MyPage";
import Records from "./screens/Records";
import Dress from "./screens/Dress";
import Follow from "./screens/Follow";
import StoreAdmin from "./store-admin/StoreAdmin";

const TAB_ROUTES = ["/", "/feed", "/plan", "/me"];

/** the phone app (screens + bottom tab bar) */
export function Phone() {
  const loc = useLocation();
  return (
    <div className="shell">
      <div className="stage">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/plan/questions" element={<Questions />} />
          <Route path="/plan/results" element={<Results />} />
          <Route path="/plan/route" element={<RoutePreview />} />
          <Route path="/trip" element={<Trip />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/trip/end" element={<TripEnd />} />
          <Route path="/vlog" element={<Vlog />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/route/:id" element={<RouteDetail />} />
          <Route path="/me" element={<MyPage />} />
          <Route path="/me/records" element={<Records />} />
          <Route path="/dress" element={<Dress />} />
          <Route path="/follow" element={<Follow />} />
        </Routes>
      </div>
      {TAB_ROUTES.includes(loc.pathname) && <TabBar />}
    </div>
  );
}

function StorePage() {
  const nav = useNavigate();
  return (
    <div className="sa-page">
      <StoreAdmin onExit={() => nav("/me")} />
    </div>
  );
}

export default function App() {
  const Router = import.meta.env.VITE_ARTIFACT ? MemoryRouter : HashRouter;
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route path="/store" element={<StorePage />} />
          <Route path="*" element={<Phone />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}
